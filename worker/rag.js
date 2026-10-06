// RAG helpers for the custom Oleshka Worker.
// Expected Cloudflare bindings:
//   env.AI        -> Workers AI
//   env.KNOWLEDGE -> Vectorize index "heroes-knowledge"

export const EMBEDDING_MODEL = "@cf/qwen/qwen3-embedding-0.6b";
export const RAG_TOP_K = 8;

export async function embedText(env, text) {
  const response = await env.AI.run(EMBEDDING_MODEL, { text: [text] });
  const vector = response?.data?.[0];
  if (!vector) throw new Error("Embedding model returned no vector");
  return vector;
}

export async function retrieveKnowledge(env, query, character = "oleshka") {
  const vector = await embedText(env, query);
  const result = await env.KNOWLEDGE.query(vector, {
    topK: RAG_TOP_K,
    returnMetadata: "all",
    returnValues: false,
    filter: {
      character: { $in: ["shared", character] },
    },
  });

  return (result?.matches || []).map((match) => ({
    id: match.id,
    score: match.score,
    ...match.metadata,
  }));
}

export function buildKnowledgeContext(matches) {
  if (!matches?.length) return "";

  return matches
    .map((match, index) => {
      const date = match.date ? ` | дата: ${match.date}` : "";
      const title = match.title ? ` | раздел: ${match.title}` : "";
      return `[${index + 1}] ${match.source || "источник"}${date}${title}\n${match.text || ""}`;
    })
    .join("\n\n");
}

export async function upsertKnowledgeBatch(env, records) {
  const texts = records.map((record) => record.embedding_text || record.text);
  const embeddings = await env.AI.run(EMBEDDING_MODEL, { text: texts });

  if (!Array.isArray(embeddings?.data) || embeddings.data.length !== records.length) {
    throw new Error("Embedding batch size mismatch");
  }

  return env.KNOWLEDGE.upsert(
    records.map((record, index) => ({
      id: record.id,
      values: embeddings.data[index],
      metadata: record.metadata,
    }))
  );
}
