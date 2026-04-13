-- ============================================================
-- Folio — Database Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Profiles (one per auth user, auto-created via trigger)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  reading_goal int,
  created_at timestamptz default now() not null
);

-- Books (cached from Google Books API)
create table if not exists public.books (
  id text primary key,  -- Google Books volume ID
  title text not null,
  authors text[],
  description text,
  cover_url text,
  isbn_13 text,
  page_count int,
  published_date text,
  categories text[],
  created_at timestamptz default now() not null
);

-- User Books (shelf + progress + review)
create table if not exists public.user_books (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  book_id text references public.books on delete cascade not null,
  shelf text check (shelf in ('want_to_read', 'reading', 'read')) not null,
  rating int check (rating between 1 and 5),
  review text,
  current_page int default 0,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(user_id, book_id)
);

-- Auto-update updated_at on user_books
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger user_books_updated_at
  before update on public.user_books
  for each row execute function update_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Saved Vibes (user-saved vibe searches)
create table if not exists public.saved_vibes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  query text not null,
  moods jsonb not null default '{"tone":null,"pace":null,"length":null}',
  created_at timestamptz default now() not null
);

-- Vibe Cache (server-side cache of Claude results to avoid repeated API calls)
create table if not exists public.vibe_cache (
  cache_key text primary key,  -- SHA-256 of query+moods
  items jsonb not null,
  created_at timestamptz default now() not null,
  expires_at timestamptz not null
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.user_books enable row level security;

-- Profiles: anyone authenticated can read, owner can update
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated using (auth.uid() = id);

-- Books: anyone authenticated can read, insert (for caching)
create policy "Books are viewable by authenticated users"
  on public.books for select
  to authenticated using (true);

create policy "Authenticated users can insert books"
  on public.books for insert
  to authenticated with check (true);

-- User books: users manage their own rows only
create policy "Users can view their own books"
  on public.user_books for select
  to authenticated using (auth.uid() = user_id);

create policy "Users can insert their own books"
  on public.user_books for insert
  to authenticated with check (auth.uid() = user_id);

create policy "Users can update their own books"
  on public.user_books for update
  to authenticated using (auth.uid() = user_id);

create policy "Users can delete their own books"
  on public.user_books for delete
  to authenticated using (auth.uid() = user_id);

alter table public.saved_vibes enable row level security;
alter table public.vibe_cache enable row level security;

-- Saved vibes: users manage their own only
create policy "Users can view their own saved vibes"
  on public.saved_vibes for select
  to authenticated using (auth.uid() = user_id);

create policy "Users can insert their own saved vibes"
  on public.saved_vibes for insert
  to authenticated with check (auth.uid() = user_id);

create policy "Users can delete their own saved vibes"
  on public.saved_vibes for delete
  to authenticated using (auth.uid() = user_id);

-- Vibe cache: any authenticated user can read/write (shared cache)
create policy "Authenticated users can read vibe cache"
  on public.vibe_cache for select
  to authenticated using (true);

create policy "Authenticated users can insert vibe cache"
  on public.vibe_cache for insert
  to authenticated with check (true);

create policy "Authenticated users can update vibe cache"
  on public.vibe_cache for update
  to authenticated using (true);
