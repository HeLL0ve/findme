import express from 'express';
import cors from 'cors';
import { pipeline, AutoProcessor, CLIPVisionModelWithProjection, RawImage } from '@xenova/transformers';

const PORT = process.env.PORT || 8000;
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─── Animal type filter ────────────────────────────────────────────────────

function normalizeAnimalType(type) {
  if (!type) return '';
  const n = String(type).toLowerCase().trim();
  const dogTerms = ['собак', 'dog', 'пес', 'щен', 'puppy'];
  const catTerms = ['кошк', 'кот', 'cat', 'котен', 'kitten'];
  for (const t of dogTerms) if (n.includes(t)) return 'dog';
  for (const t of catTerms) if (n.includes(t)) return 'cat';
  return n;
}

function areObviouslyDifferent(a, b) {
  const sa = normalizeAnimalType(a);
  const sb = normalizeAnimalType(b);
  if (!sa || !sb) return false;
  return (sa === 'dog' && sb === 'cat') || (sa === 'cat' && sb === 'dog');
}

// ─── CLIP vision model ─────────────────────────────────────────────────────

const MODEL_ID = 'Xenova/clip-vit-base-patch32';

let processor = null;
let visionModel = null;

async function loadClipModel() {
  if (processor && visionModel) return;
  console.log('[CLIP] Loading CLIP model:', MODEL_ID);
  processor = await AutoProcessor.from_pretrained(MODEL_ID);
  visionModel = await CLIPVisionModelWithProjection.from_pretrained(MODEL_ID);
  console.log('[CLIP] Model ready');
}

// Kick off model load immediately on startup
loadClipModel().catch((err) => console.error('[CLIP] Model load error:', err));

async function getImageEmbedding(url) {
  try {
    const image = await RawImage.fromURL(url);
    const inputs = await processor(image);
    const output = await visionModel(inputs);
    // output.image_embeds shape: [1, 512] — take the first row
    const raw = output.image_embeds.data;
    return Array.from(raw);
  } catch (err) {
    console.warn('[CLIP] Failed to embed image:', url, err?.message);
    return null;
  }
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Best cosine similarity across all source×candidate image pairs
async function bestImageSimilarity(sourceUrls, candidateUrls) {
  if (!sourceUrls.length || !candidateUrls.length) return null;

  const [srcEmbeddings, cndEmbeddings] = await Promise.all([
    Promise.all(sourceUrls.map(getImageEmbedding)),
    Promise.all(candidateUrls.map(getImageEmbedding)),
  ]);

  let best = null;
  for (const se of srcEmbeddings) {
    if (!se) continue;
    for (const ce of cndEmbeddings) {
      if (!ce) continue;
      const sim = cosineSimilarity(se, ce);
      if (best === null || sim > best) best = sim;
    }
  }
  return best; // null if no embeddings succeeded
}

// ─── Text keyword fallback ─────────────────────────────────────────────────

function normalizeText(text) {
  return (text || '').toString().trim().toLowerCase();
}

function extractKeywords(text) {
  return Array.from(
    new Set(
      normalizeText(text)
        .split(/[^а-яa-z0-9]+/gi)
        .filter((w) => w.length >= 3),
    ),
  );
}

function countSharedKeywords(source, target) {
  const set = new Set(target);
  return source.reduce((count, w) => (set.has(w) ? count + 1 : count), 0);
}

function buildSearchText(item) {
  return [item.animalType, item.breed, item.color, item.description,
          item.location?.city, item.location?.address]
    .filter(Boolean).join(' ').trim();
}

// ─── Route ─────────────────────────────────────────────────────────────────

app.post('/similar', async (req, res) => {
  try {
    const { source = {}, candidates = [] } = req.body;

    // Make sure the model is ready (usually already loaded, but guard just in case)
    await loadClipModel();

    const sourceUrls = Array.isArray(source.photos)
      ? source.photos.map((p) => p.photoUrl).filter(Boolean)
      : [];

    const textA = buildSearchText(source);
    const keywordsA = extractKeywords(textA);

    const results = await Promise.all(
      candidates.map(async (candidate) => {
        // Hard filter: obvious species mismatch
        if (areObviouslyDifferent(source.animalType, candidate.animalType)) {
          return { id: candidate.id, clipScore: 0, phashDistance: null };
        }

        const candidateUrls = Array.isArray(candidate.photoUrls)
          ? candidate.photoUrls.filter(Boolean)
          : [];

        // Text keyword score (fallback / supplement)
        const textB = buildSearchText(candidate);
        const keywordsB = extractKeywords(textB);
        const shared = countSharedKeywords(keywordsA, keywordsB);
        const union = new Set([...keywordsA, ...keywordsB]).size || 1;
        const textScore = union > 0 ? shared / union : 0;

        // Real CLIP visual similarity
        const imageSim = await bestImageSimilarity(sourceUrls, candidateUrls);

        let combinedScore;
        if (imageSim !== null) {
          // CLIP cosine similarity is typically 0.7–1.0 for same-image pairs
          // and 0.5–0.75 for visually similar but different photos.
          // Normalise it to 0–1 range relative to a 0.5 baseline.
          const normalizedImageSim = Math.max(0, (imageSim - 0.5) / 0.5);
          // Weight: 70 % visual, 30 % text
          combinedScore = normalizedImageSim * 0.7 + textScore * 0.3;
        } else {
          // No photos — rely purely on text
          combinedScore = textScore;
        }

        return {
          id: candidate.id,
          clipScore: Number(combinedScore.toFixed(5)),
          phashDistance: null, // pHash no longer used
        };
      }),
    );

    results.sort((a, b) => b.clipScore - a.clipScore);
    res.json(results);
  } catch (error) {
    console.error('[CLIP] Error:', error);
    res.status(500).json({ message: 'Ошибка clip-service', error: error?.message || String(error) });
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', modelReady: !!(processor && visionModel) });
});

app.listen(PORT, () => {
  console.log(`clip-service running on http://0.0.0.0:${PORT}`);
});
