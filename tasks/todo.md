# Folio — Task List

## Completed ✅

- [x] Scaffold Next.js 16 project with TypeScript + Tailwind 4
- [x] Install @supabase/supabase-js + @supabase/ssr
- [x] types/index.ts — Book, UserBook, Profile, ShelfType, GoogleBooksVolume
- [x] lib/supabase/client.ts + server.ts
- [x] middleware.ts — auth route protection
- [x] lib/utils.ts — cn, googleVolumeToBook, formatAuthors, truncate
- [x] supabase/schema.sql — profiles, books, user_books + RLS
- [x] .env.local.example
- [x] app/layout.tsx — root layout (Geist font, stone theme)
- [x] app/globals.css — Tailwind 4 setup
- [x] app/page.tsx — landing page (hero + feature strip)
- [x] app/(auth)/login/page.tsx
- [x] app/(auth)/signup/page.tsx
- [x] app/auth/callback/route.ts
- [x] components/ui/StarRating.tsx
- [x] components/ui/Badge.tsx
- [x] components/books/BookCover.tsx
- [x] components/books/BookCard.tsx
- [x] components/books/ShelfSelector.tsx
- [x] components/books/ReviewForm.tsx
- [x] components/layout/Navbar.tsx
- [x] components/profile/ProfileStats.tsx
- [x] app/(app)/layout.tsx
- [x] app/api/books/route.ts
- [x] app/(app)/search/page.tsx
- [x] app/(app)/books/[id]/page.tsx
- [x] app/(app)/shelf/page.tsx
- [x] app/(app)/home/page.tsx
- [x] app/(app)/profile/[username]/page.tsx
- [x] .claude/CLAUDE.md

## Up Next

- [ ] Add .env.local with real Supabase credentials
- [ ] Run schema.sql in Supabase SQL editor
- [ ] Test auth flow end-to-end
- [ ] Add next.config.ts image domain for books.google.com
- [ ] Reading progress tracker (update current_page on book detail)
- [ ] Profile edit page (/profile/edit)
- [ ] OAuth (Google) — add to Supabase + login page
- [ ] Public profiles — show other users' shelves on book pages
