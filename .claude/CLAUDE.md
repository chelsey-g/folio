# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Folio** — A Goodreads-style book tracking app. Users can search books via Open Library API, organize them into three shelves (Want to Read / Currently Reading / Read), rate and review them, and view their reading history.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (Auth + Postgres) · `@supabase/ssr`

## Commands

```bash
npm run dev        # Start dev server (localhost:3000)
npm run build      # Production build
npm run lint       # ESLint
npx tsc --noEmit   # Type-check without building
```

## Architecture

### Route Structure

```
app/
├── page.tsx                          # Landing (redirects to /home if authed)
├── (auth)/login, signup              # Email auth forms — client components
├── auth/callback/route.ts            # Supabase PKCE code exchange
├── (app)/layout.tsx                  # Shared Navbar for all authed routes
├── (app)/home                        # Dashboard: reading stats + recent activity
├── (app)/search                      # Discover: keyword search + vibe search (client component)
├── (app)/books/[id]                  # Book detail + ShelfSelector + ReviewForm
├── (app)/shelf                       # All shelves grouped by status
├── (app)/profile/[username]          # Public user profile
├── (app)/stats                       # Private reading stats page
└── api/books/route.ts                # Proxy to Open Library API (?q= or ?id=)
└── api/vibe/route.ts                 # Semantic vibe search via OpenAI embeddings
```

### Supabase Setup

Two clients — always use the right one:
- `lib/supabase/client.ts` → `createClient()` for **client components** (browser)
- `lib/supabase/server.ts` → `await createClient()` for **server components and route handlers**

Auth is handled via `proxy.ts` (Next.js 16 renamed `middleware.ts` → `proxy.ts`): unauthenticated users are redirected to `/login`, authenticated users on `/login` or `/signup` are redirected to `/home`.

### Database (3 tables)

- **`profiles`** — extends `auth.users`. Auto-created on signup via trigger. Has `username`, `full_name`, `avatar_url`, `bio`.
- **`books`** — cached Open Library data. Primary key is the Open Library work ID (string, e.g. `OL45804W`). Upserted when a user adds a book to their shelf.
- **`user_books`** — junction between user and book. Holds `shelf`, `rating`, `review`, `current_page`, `started_at`, `finished_at`. Unique on `(user_id, book_id)`. Uses upsert with `onConflict: 'user_id,book_id'`.

Full schema with RLS policies: `supabase/schema.sql`

### Open Library API

- Calls to `https://openlibrary.org/search.json` for search, `/works/{id}.json` for detail
- All frontend calls go through the `/api/books` proxy route
- `lib/utils.ts:olSearchDocToBook()` and `olWorkToBook()` map raw OL responses to our `Book` type
- Book IDs in our DB are Open Library work IDs (e.g. `OL45804W`)
- Cover images: `https://covers.openlibrary.org/b/id/{cover_i}-M.jpg`

### Vibe Search (`api/vibe/route.ts`)

- POST with `{ query: string }` — requires auth (guards OpenAI spend)
- Extracts keywords from natural-language query, fetches 40 OL candidates
- Embeds all texts via `lib/embeddings.ts` (OpenAI `text-embedding-3-small`) in one batch call
- Ranks by cosine similarity, returns top 10 with `score` and `matchedSubjects`
- Requires `OPENAI_API_KEY` env var

### Key Types (`types/index.ts`)

`ShelfType`, `Book`, `UserBook`, `Profile`, `OLSearchDoc`, `OLSearchResponse`, `OLWork`, `SHELF_LABELS` map

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=          # Required for vibe search
```

---

## Workflow Orchestration

### #01 — Plan Mode
Use plan mode for any non-trivial task (3+ steps or architectural decisions). Write detailed specs upfront. Use plan mode for verification, not just building.

### #02 — Subagent Strategy
Use subagents to keep main context clean. Offload research, exploration, and parallel analysis. One focused task per subagent.

### #03 — Self-Correction
After any correction from the user: update `tasks/lessons.md` with the pattern. Review lessons at session start before coding.

### #04 — Verification Before Done
Run a complete check before marking done. Look for reasons NOT to ship. Challenge your own work before presenting it.

### #05 — Demand Elegance
For non-trivial changes: pause and ask "Is there a more elegant way?" before writing anything hacky.

### #06 — Autonomous Bug Fixing
When given a bug report: just fix it. Work autonomously until resolution. Don't ask for hand-holding on simple fixes.

### #07 — Task Management
- Write plan to `tasks/todo.md` before starting
- Update `tasks/todo.md` as you go, not at the end
- Mark items complete as you complete them
- Update `tasks/lessons.md` after corrections

### #08 — Core Principles
- Make every change as simple as possible
- Find root causes — no temporary fixes
- Delete dead code. Remove unused files. Avoid introducing bugs.
