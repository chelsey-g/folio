---
name: pre-ship
description: Run the full pre-ship check — lint, type-check, and build. Use before deploying or opening a PR.
---

Run these three checks in sequence. Stop and report on first failure.

## Steps

```bash
npm run lint
```
If lint fails: show the errors, fix them, re-run before proceeding.

```bash
npx tsc --noEmit
```
If type errors: show them, fix them, re-run before proceeding.

```bash
npm run build
```
If build fails: show the errors, fix them.

## Report

After all three pass, report:
```
✓ Lint — clean
✓ Types — clean  
✓ Build — clean
Ready to ship.
```

If any step fails after your fix attempt, stop and report what's still broken so the user can decide how to proceed.
