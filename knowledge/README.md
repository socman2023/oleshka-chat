# Knowledge architecture

The public repository contains only RAG code and schema notes. Canon chunks are kept out of GitHub because this repository is public.

## First production index

- Vectorize index: `heroes-knowledge`
- embedding model: `@cf/qwen/qwen3-embedding-0.6b`
- dimensions: `1024`
- metric: `cosine`
- Worker binding: `KNOWLEDGE`
- Workers AI binding: `AI`

## Metadata

Each vector stores the retrieved text directly in metadata for the first version, so D1/R2 is not required yet.

Fields:
- `character`: `shared`, `oleshka`, later `sanko`, etc.
- `layer`: world/profile/current/blog/etc.
- `priority`: canon-source priority number.
- `source`: source document.
- `title`: section/title.
- `date`: ISO timestamp where applicable.
- `text`: the actual context chunk returned to Gemini.

Create metadata indexes before ingestion for `character`, `layer`, `date`, and `priority`.

## Retrieval

For Oleshka, query chunks whose `character` is either `shared` or `oleshka`. The Worker embeds the user's question, requests the top semantic matches, builds a canon context block, and sends that block to Gemini together with Oleshka's system profile and recent conversation history.

The first private deployment package contains normalized core/current knowledge and the blog archive through September 2026. Books are intentionally deferred until retrieval quality and free-tier usage are measured.
