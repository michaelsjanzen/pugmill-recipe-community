# STAGING — local-only, never pushed

This file is in `.gitignore` and only exists in your workspace. It explains the
local workflow for maintaining the `pugmill-recipe-community` GitHub repo from
inside your Pugmill install.

## What lives where

| Repo file | Where to edit it locally |
|---|---|
| `README.md` | `recipe-community-fork/README.md` *(this folder)* |
| `RECIPE.md` | `recipe-community-fork/RECIPE.md` *(this folder)* |
| `CHANGELOG.md` | `recipe-community-fork/CHANGELOG.md` *(this folder)* |
| `LICENSE` | `recipe-community-fork/LICENSE` *(this folder)* |
| `plugins/community/**` | **Live files** in `plugins/community/` at the project root |
| `src/lib/community-auth.ts` | **Live file** in `src/lib/community-auth.ts` at the project root |
| `src/app/api/community/**` | **Live files** in `src/app/api/community/` at the project root |
| `src/app/(site)/recipes/**` | **Live files** in `src/app/(site)/recipes/` at the project root |
| `src/app/(site)/community/**` | **Live files** in `src/app/(site)/community/` at the project root |

This folder used to mirror the source files too, which created two copies to
keep in sync. We dropped the mirror — the live Pugmill files are the single
source of truth.

## To push an update to GitHub

1. Bump the version in `plugins/community/index.ts` and add a `CHANGELOG.md` entry.
2. Open your local clone of `pugmill-recipe-community` (outside this Pugmill workspace).
3. Copy the changed files over:
   - From `recipe-community-fork/` → repo root: `README.md`, `RECIPE.md`, `CHANGELOG.md`, `LICENSE`
   - From the Pugmill project root → repo: `plugins/community/`, `src/lib/community-auth.ts`,
     and the `src/app/api/community/` + `src/app/(site)/recipes/` + `src/app/(site)/community/` trees
4. Commit, tag (e.g. `v0.2.1`), and push.

If you'd like me to write a small `sync-recipe.sh` script that performs step 3
automatically into a target directory, just ask.
