-- ============================================================
-- Add pgvector embeddings to books table
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable the pgvector extension
create extension if not exists vector;

-- Add embedding column (text-embedding-3-small = 1536 dimensions)
alter table public.books add column if not exists embedding vector(1536);

-- Allow authenticated users to update books (needed to store embeddings)
create policy "Authenticated users can update books"
  on public.books for update
  to authenticated using (true);

-- Similarity search function
-- Returns book IDs ordered by cosine similarity to the query embedding
create or replace function match_books(
  query_embedding vector(1536),
  exclude_id      text,
  match_count     int default 8
)
returns table (id text, similarity float)
language sql stable
as $$
  select
    id,
    1 - (embedding <=> query_embedding) as similarity
  from books
  where embedding is not null
    and id != exclude_id
  order by embedding <=> query_embedding
  limit match_count;
$$;
