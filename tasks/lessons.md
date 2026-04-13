# Folio — Lessons Learned

_Updated after corrections. Review before each session._

---

## 2026-04-13 — Longitood is fallback only, never skip it

**What happened:** After implementing BookCover's onError handler, it went straight to the gradient placeholder instead of trying longitood first. User had already specified longitood as the fallback and had to repeat it twice.

**Rule:** When `cover_url` is null or an image fails to load, always try longitood before rendering a gradient placeholder. Never skip straight to gradient.

**Why:** Longitood covers a large percentage of books that OL doesn't have cover images for. The gradient placeholder is a last resort only.

**Apply when:** Any time `cover_url` is null server-side (`fetchLongitoodCover`), or client-side image load fails (`onError` → `/api/cover` proxy → gradient).

---

## 2026-04-13 — Use useRef for flags read inside async callbacks

**What happened:** Used `useState` for a `triedLongitood` boolean flag inside `BookCover.onError`. The async `/api/cover` fetch captured a stale closure of the initial `false` value, so the flag never appeared to flip and the fallback triggered multiple times.

**Rule:** Use `useRef` (not `useState`) for any flag that is read inside an async callback (fetch, setTimeout, event handler). `useState` setters are async and closures capture the value at render time.

**Why:** `useRef.current` is always the live value regardless of when the async callback runs. `useState` values are snapshots.

**Apply when:** Boolean guards, request IDs, "already tried" flags — anything read inside `fetch().then()` or `onError`.

---

## 2026-04-13 — Fetch category data server-side with ISR, not client-side

**What happened:** The Discover page made 5 parallel Open Library API calls from the browser on page load, causing 502 errors under any OL latency.

**Rule:** Any page that needs multiple external API calls to render its initial content must fetch server-side (server component or `getServerSideProps`) with ISR caching (`next: { revalidate: 3600 }`).

**Why:** Client-side parallel fetches have no caching, hit rate limits faster, and fail loudly for users. ISR caches the result at the edge and serves it instantly.

**Apply when:** Discover categories, any "pre-populated" page content that doesn't depend on per-user data.

---

## 2026-04-13 — Vibe search uses Claude Haiku, not OpenAI

**What happened:** Original vibe search used OpenAI embeddings (`text-embedding-3-small`). Quota was exceeded. Switched to Claude Haiku LLM-direct approach (Claude recommends books directly, OL validates them).

**Rule:** Use `ANTHROPIC_API_KEY` + `claude-haiku-4-5-20251001` for vibe search. Do not reference OpenAI or `lib/embeddings.ts` (deleted). The model ID must be exact — check `CLAUDE.md` for the current model string.

**Why:** OpenAI quota issues, and LLM-direct produces significantly better semantic results than embedding similarity.

**Apply when:** Any AI feature in this project — default to Anthropic/Claude, not OpenAI.

---

## 2026-04-13 — max_tokens must be high enough for 25 books

**What happened:** Claude returned truncated JSON (cut off mid-object) because `max_tokens` was set to 2048. With 25 books × reasons + genres, the response exceeds 2048 tokens.

**Rule:** Set `max_tokens: 4096` for vibe search Claude calls. Do not lower it.

**Why:** 25 books with `reason` + `genres` fields consistently approaches or exceeds 2048 tokens.

**Apply when:** Any Claude call that asks for structured JSON with many items.
