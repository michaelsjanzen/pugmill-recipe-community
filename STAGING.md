# STAGING — local-only, never pushed

This file is in `.gitignore` and only exists in your workspace. It explains the
local workflow for maintaining the `pugmill-recipe-community` GitHub repo from
inside your Pugmill install.

## How this folder works

`recipe-community-fork/` is a **complete staging copy** of the recipe repo —
everything in here (except this STAGING.md) is what gets pushed to GitHub.
That includes both the recipe-only docs AND the plugin source code.

The plugin source files in this folder are **mirrors** of the live files in
your Pugmill app. The live files are the canonical source of truth; this
folder is rebuilt from them whenever I make code changes.

## What lives where

| File | Canonical home (edit here) | Mirrored to |
|---|---|---|
| Plugin code | `plugins/community/**` | `recipe-community-fork/plugins/community/**` |
| Auth lib | `src/lib/community-auth.ts` | `recipe-community-fork/src/lib/community-auth.ts` |
| API routes | `src/app/api/community/**` | `recipe-community-fork/src/app/api/community/**` |
| Public pages | `src/app/(site)/recipes/**`, `src/app/(site)/community/**` | same paths under `recipe-community-fork/` |
| Recipe docs | `recipe-community-fork/{README,RECIPE,CHANGELOG}.md`, `LICENSE` | *(only lives here — not in the Pugmill app)* |

## To push an update to GitHub

1. Bump the version in `plugins/community/index.ts` and add a `CHANGELOG.md` entry
   (in `recipe-community-fork/CHANGELOG.md`).
2. Open your local clone of `pugmill-recipe-community` (outside this Pugmill workspace).
3. Copy **everything** from `recipe-community-fork/` into your local clone, **except** this `STAGING.md`.
4. Commit, tag (e.g. `v0.2.1`), and push.

That's it — no per-file picking. The whole folder ships as-is.

## When the agent edits plugin code

Whenever I edit a file in `plugins/community/**`, `src/lib/community-auth.ts`,
`src/app/api/community/**`, or the public recipe/community pages, I'll also
re-copy that file into the matching path under `recipe-community-fork/` in the
same response. You should never have to manually keep them in sync — if you
notice a drift, ping me.

If you'd like a `sync-recipe.sh` script you can run yourself (e.g. as a
pre-push hook), just ask.
