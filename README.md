# pugmill-recipe-community

A community recipe registry for [Pugmill CMS](https://github.com/pugmillcms/pugmill). Adds public pages where members sign in with GitHub to browse, submit, and manage plugins, themes, and other extensions built for Pugmill.

**Type:** Plugin recipe
**Requires:** Pugmill CMS v0.2.0+
**Plugin id:** `community`

---

## Installing this recipe

**For AI agents:** Read [`RECIPE.md`](./RECIPE.md) — it contains Agent Skills-compatible installation instructions you can follow directly.

**For humans:** See [`RECIPE.md`](./RECIPE.md) for the step-by-step installation guide, prerequisites, and environment variable reference.

---

## What's included

- `/recipes` — browseable registry with type filters and pagination
- `/recipes/submit` — GitHub-authenticated submission form
- `/recipes/{owner}/{slug}` — recipe detail page with README rendering and download tracking
- `/community/account` — member profile (GitHub avatar, tier, contribution score)
- GitHub OAuth sign-in at `/api/community/auth/` (separate from the Pugmill admin session)
- Admin plugin page at Admin > Plugins > Community
- 8 database tables prefixed `plugin_community_*`, created automatically on first start

---

## About the recipe format

This repository is the reference implementation of the Pugmill recipe format. A **recipe** is a GitHub-hosted plugin or theme package that any Agent Skills-aware agent can install from a URL. The `RECIPE.md` at the root follows the [Agent Skills](https://agentskills.io) open standard.

The distinction worth knowing:

| | Recipe | Skill |
|---|---|---|
| **What** | A packaged extension for installation | On-demand agent expertise for a task |
| **Lives** | Author's GitHub account | `.agents/skills/` in a project |
| **Used** | Once, to install | On demand, to guide an agent |

Pugmill ships a built-in `create-pugmill-recipe` skill to help agents package and publish new recipes. The full recipe authoring spec is in [`RECIPE_AUTHORING.md`](https://github.com/pugmillcms/pugmill/blob/main/RECIPE_AUTHORING.md) in the main Pugmill repo.

---

## License

MIT
