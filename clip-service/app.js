const express = require('express');
const cors = require('cors');
const Jimp = require('jimp');

const PORT = process.env.PORT || 8000;
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

function normalizeText(text) {
  return (text || '').toString().trim().toLowerCase();
}

function extractKeywords(text) {
  return Array.from(
    new Set(
      normalizeText(text)
        .split(/[^а-яa-z0-9]+/gi)
        .filter((word) => word.length >= 3),
    ),
  );
}

function countSharedKeywords(source, target) {
  const set = new Set(target);
  return source.reduce((count, word) => (set.has(word) ? count + 1 : count), 0);
}

function buildSearchText(item) {
  return [
    item.animalType,
    item.breed,
    item.color,
    item.description,
    item.location?.city,
    item.location?.address,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
}

async function fetchImageHash(url) {
  try {
    const image = await Jimp.read(url);
    return image.hash();
  } catch (error) {
    return null;
  }
}

function hammingDistance(hashA, hashB) {
  if (!hashA || !hashB || hashA.length !== hashB.length) return Number.MAX_SAFE_INTEGER;
  const HEX_BIT_COUNTS = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4];
  let distance = 0;
  for (let i = 0; i < hashA.length; i += 1) {
    const valueA = parseInt(hashA[i], 16);
    const valueB = parseInt(hashB[i], 16);
    distance += HEX_BIT_COUNTS[valueA ^ valueB];
  }
  return distance;
}

async function buildImageScores(sourceUrls, candidateUrls) {
  const sourceHashes = await Promise.all(sourceUrls.map((url) => fetchImageHash(url)));
  const candidateHashes = await Promise.all(candidateUrls.map((url) => fetchImageHash(url)));

  let bestDistance = null;
  sourceHashes.forEach((sourceHash) => {
    if (!sourceHash) return;
    candidateHashes.forEach((candidateHash) => {
      if (!candidateHash) return;
      const distance = hammingDistance(sourceHash, candidateHash);
      if (bestDistance === null || distance < bestDistance) {
        bestDistance = distance;
      }
    });
  });

  const normalized = bestDistance === null ? 0 : Math.max(0, 1 - bestDistance / 64);
  return { bestDistance, normalized };
}

app.post('/similar', async (req, res) => {
  try {
    const { source = {}, candidates = [] } = req.body;
    const textA = buildSearchText(source);
    const keywordsA = extractKeywords(textA);

    const sourceImages = Array.isArray(source.photos)
      ? source.photos.map((photo) => photo.photoUrl).filter(Boolean)
      : [];

    const results = await Promise.all(
      candidates.map(async (candidate) => {
        const textB = buildSearchText(candidate);
        const keywordsB = extractKeywords(textB);
        const shared = countSharedKeywords(keywordsA, keywordsB);
        const union = new Set([...keywordsA, ...keywordsB]).size || 1;
        const textScore = union > 0 ? shared / union : 0;

        const candidateImages = Array.isArray(candidate.photoUrls)
          ? candidate.photoUrls.filter(Boolean)
          : [];

        const imageScoreData = await buildImageScores(sourceImages, candidateImages);
        const imageScore = imageScoreData.normalized;

        const combinedScore = sourceImages.length > 0 && candidateImages.length > 0
          ? (textScore * 0.4 + imageScore * 0.6)
          : textScore;

        return {
          id: candidate.id,
          clipScore: Number(combinedScore.toFixed(5)),
          phashDistance: imageScoreData.bestDistance,
        };
      }),
    );

    results.sort((a, b) => b.clipScore - a.clipScore);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка clip-service', error: error?.message || String(error) });
  }
});

app.listen(PORT, () => {
  console.log(`clip-service running on http://0.0.0.0:${PORT}`);
});
