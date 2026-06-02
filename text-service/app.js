import express from 'express';
import cors from 'cors';
import { pipeline } from '@xenova/transformers';

const PORT = process.env.PORT || 9000;
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

function normalizeText(text) {
  return (text || '').toString().trim().toLowerCase();
}

function buildSearchText(item) {
  return [
    item.petName,
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

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c;
}

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    const x = Number(a[i]);
    const y = Number(b[i]);
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function flattenEmbedding(embedding) {
  if (!Array.isArray(embedding)) return [];
  return embedding.flat(Infinity).map((value) => Number(value ?? 0));
}

let semanticPipelinePromise = null;
async function getSemanticPipeline() {
  if (!semanticPipelinePromise) {
    semanticPipelinePromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return semanticPipelinePromise;
}

async function embedText(text) {
  const pipe = await getSemanticPipeline();
  const output = await pipe(text);
  return flattenEmbedding(output[0] ?? output);
}

app.post('/semantic', async (req, res) => {
  try {
    const { source = {}, candidates = [] } = req.body;
    const sourceText = buildSearchText(source);
    const candidateTexts = Array.isArray(candidates) ? candidates.map(buildSearchText) : [];

    const sourceEmbedding = await embedText(sourceText || '');
    const candidateEmbeddings = await Promise.all(candidateTexts.map((text) => embedText(text || '')));

    const results = candidates.map((candidate, index) => {
      const candidateEmbedding = candidateEmbeddings[index];
      const semanticScore = sourceEmbedding.length > 0 && candidateEmbedding.length > 0
        ? cosineSimilarity(sourceEmbedding, candidateEmbedding)
        : 0;

      const distanceKm = candidate.location?.latitude != null && candidate.location?.longitude != null &&
        source.location?.latitude != null && source.location?.longitude != null
        ? haversineDistanceKm(
            Number(source.location.latitude),
            Number(source.location.longitude),
            Number(candidate.location.latitude),
            Number(candidate.location.longitude),
          )
        : null;

      return {
        id: candidate.id,
        semanticScore: Number(semanticScore.toFixed(5)),
        distanceKm: distanceKm === null ? undefined : Number(distanceKm.toFixed(2)),
      };
    });

    results.sort((a, b) => (b.semanticScore ?? 0) - (a.semanticScore ?? 0));
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка text-service', error: error?.message || String(error) });
  }
});

app.listen(PORT, () => {
  console.log(`text-service running on http://0.0.0.0:${PORT}`);
});
