---
name: db-migration
description: Generate and apply a Supabase database migration. Use when adding tables, columns, indexes, or RLS policies.
---

When the user needs a schema change:

## Step 1 — Write the migration file

Create a file at `supabase/migrations/YYYYMMDD_description.sql` with the SQL for this change.

Use `if not exists` / `if exists` guards so migrations are idempotent:
```sql
alter table public.profiles add column if not exists reading_goal int;
create table if not exists public.my_table (...);
create index if not exists idx_name on public.table(col);
```

## Step 2 — Update schema.sql

Also apply the same change to `supabase/schema.sql` so the canonical schema stays current.

## Step 3 — Remind the user to run it

Tell the user:

```
Migration file written to supabase/migrations/YYYYMMDD_description.sql

Run this in your Supabase SQL editor:
→ https://app.supabase.com → SQL Editor → paste and run

Or via CLI if you have it set up:
  supabase db push
```

## Step 4 — Check for type impacts

After writing the migration, check if any TypeScript types in `types/index.ts` need updating to match the schema change. If so, update them.
