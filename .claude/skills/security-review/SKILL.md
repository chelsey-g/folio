---
name: security-review
description: Run a security-focused code review. Use when you want to audit recent changes for vulnerabilities, exposed secrets, or unsafe patterns.
---

## Step 1 — Build check

```bash
npm run build
```

Fix any build errors before proceeding.

## Step 2 — Static analysis

Check recent changes for:

- **Secrets/credentials** leaked into code or committed to git (check `.env*` files are in `.gitignore`)
- **SQL injection** — verify all Supabase queries use parameterized calls, never string concatenation
- **XSS** — check for `dangerouslySetInnerHTML`, unescaped user content rendered as HTML
- **Auth bypass** — every API route that touches user data must verify `session` before proceeding
- **IDOR** — DB queries that filter by `user_id` must use `session.user.id`, not a client-supplied value
- **Rate limiting** — AI/external API routes (like `/api/vibe`) should validate input length and reject abusive payloads

## Step 3 — Report

List any findings with file + line number. If clean, say so.
