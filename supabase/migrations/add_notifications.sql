-- ============================================================
-- Agent notifications table
-- Run this in your Supabase SQL editor
-- ============================================================

create table public.notifications (
  id                   uuid default gen_random_uuid() primary key,
  user_id              uuid references auth.users on delete cascade not null,
  type                 text not null,                          -- e.g. 'reading_complete'
  message              text not null,                         -- Claude's recommendation text
  finished_book_id     text references public.books(id),      -- book they just finished
  recommended_book_id  text references public.books(id),      -- book Claude picked
  book_title           text,                                  -- denormalised for display
  dismissed            boolean default false not null,
  created_at           timestamptz default now() not null
);

alter table public.notifications enable row level security;

create policy "Users see their own notifications"
  on public.notifications for select
  to authenticated using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on public.notifications for update
  to authenticated using (auth.uid() = user_id);

-- Service role (agent) handles inserts — no RLS policy needed for that role
