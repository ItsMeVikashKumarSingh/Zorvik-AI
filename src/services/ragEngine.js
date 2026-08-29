/**
 * Zorvik AI Document Chunking & Semantic Vector RAG Engine
 * Provides sliding-window chunking, semantic vector similarity, and context retrieval.
 */

/**
 * Split raw document text into overlapping chunks
 * @param {string} text - Raw document content
 * @param {object} options - Chunking options (maxChunkSize, overlap)
 * @returns {Array<{ id: number, text: string, tokenEstimate: number }>}
 */
function chunkDocument(text, options = {}) {
  if (!text || typeof text !== "string") return [];

  const maxChunkSize = options.maxChunkSize || 1200; // ~300 words
  const overlap = options.overlap || 200;

  // Split by double newline (paragraphs) first
  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let currentChunk = "";
  let chunkId = 1;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    if (currentChunk.length + trimmed.length <= maxChunkSize) {
      currentChunk += (currentChunk ? "\n\n" : "") + trimmed;
    } else {
      if (currentChunk) {
        chunks.push({
          id: chunkId++,
          text: currentChunk,
          tokenEstimate: Math.ceil(currentChunk.length / 4),
        });
        // Retain overlap from end of currentChunk
        const overlapSlice = currentChunk.slice(-overlap);
        currentChunk = overlapSlice + "\n\n" + trimmed;
      } else {
        // Single oversized paragraph, slice directly
        for (let i = 0; i < trimmed.length; i += (maxChunkSize - overlap)) {
          const slice = trimmed.slice(i, i + maxChunkSize);
          chunks.push({
            id: chunkId++,
            text: slice,
            tokenEstimate: Math.ceil(slice.length / 4),
          });
        }
        currentChunk = "";
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      id: chunkId++,
      text: currentChunk.trim(),
      tokenEstimate: Math.ceil(currentChunk.length / 4),
    });
  }

  return chunks;
}

/**
 * Compute term frequency vector for text against a vocabulary
 * @param {string} text
 * @param {Array<string>} vocab
 * @returns {Array<number>}
 */
function vectorize(text, vocab) {
  const words = text.toLowerCase().match(/\b[a-z0-9_]{2,}\b/g) || [];
  const freq = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }
  return vocab.map((term) => freq[term] || 0);
}

/**
 * Calculate cosine similarity between two vectors
 * @param {Array<number>} vecA
 * @param {Array<number>} vecB
 * @returns {number}
 */
function cosineSimilarity(vecA, vecB) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Retrieve top K relevant document chunks for a query
 * @param {object} params
 * @param {string} params.query - User query
 * @param {string} [params.documentText] - Full document text (auto-chunked)
 * @param {Array<object>} [params.chunks] - Pre-chunked document array
 * @param {number} [params.topK=3] - Number of top chunks to return
 * @returns {Array<{ chunkId: number, text: string, similarity: number }>}
 */
function retrieveRelevantChunks({ query, documentText, chunks, topK = 3 }) {
  const allChunks = chunks || (documentText ? chunkDocument(documentText) : []);
  if (!allChunks.length || !query) return [];

  // Build vocabulary from query and all chunks
  const vocabSet = new Set();
  const queryWords = query.toLowerCase().match(/\b[a-z0-9_]{2,}\b/g) || [];
  queryWords.forEach((w) => vocabSet.add(w));

  allChunks.forEach((c) => {
    const chunkWords = c.text.toLowerCase().match(/\b[a-z0-9_]{2,}\b/g) || [];
    chunkWords.forEach((w) => vocabSet.add(w));
  });

  const vocab = Array.from(vocabSet);
  const queryVec = vectorize(query, vocab);

  const scored = allChunks.map((c) => {
    const chunkVec = vectorize(c.text, vocab);
    const score = cosineSimilarity(queryVec, chunkVec);
    return {
      chunkId: c.id,
      text: c.text,
      similarity: Number(score.toFixed(4)),
    };
  });

  // Sort descending by similarity score
  scored.sort((a, b) => b.similarity - a.similarity);

  // Return top K chunks (filtering out 0 similarity if possible)
  const filtered = scored.filter((s) => s.similarity > 0);
  return (filtered.length > 0 ? filtered : scored).slice(0, topK);
}

/**
 * Format retrieved chunks into a prompt grounding block
 * @param {Array<{ chunkId: number, text: string, similarity: number }>} retrieved
 * @returns {string}
 */
function formatRAGContext(retrieved = []) {
  if (!retrieved.length) return "";
  const sections = retrieved.map(
    (r, i) => `[Document Excerpt ${i + 1} (Relevance: ${(r.similarity * 100).toFixed(0)}%)]:\n${r.text}`
  );
  return `### ATTACHED DOCUMENT SEMANTIC CONTEXT (RAG):\n${sections.join("\n\n")}`;
}

module.exports = {
  chunkDocument,
  cosineSimilarity,
  retrieveRelevantChunks,
  formatRAGContext,
};
