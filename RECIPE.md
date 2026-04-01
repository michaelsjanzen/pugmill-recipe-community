---
name: pugmill-recipe-community
description: >
  Adds a public recipe registry to your Pugmill site. Community members sign
  in with GitHub to browse, submit, and manage plugins, themes, and other
  extensions built for Pugmill CMS. Installs 8 database tables prefixed
  plugin_community_, public routes at /recipes and /community/account, API
  routes for GitHub OAuth and download tracking, and a shared auth library
  at src/lib/community-auth.ts. Requires a GitHub OAuth App and the jose
  npm package. Tables are created automatically via schema.migrate() on
  first cold start — no external migration scripts needed.
compatibility: "Pugmill CMS v0.2+. Plugin recipe. Has routes and lib files. Requires COMMUNITY_GITHUB_CLIENT_ID, COMMUNITY_GITHUB_CLIENT_SECRET, and COMMUNITY_SESSION_SECRET secrets."
license: MIT
metadata:
  type: plugin
  pugmill-version: "0.2"
  has-routes: "true"
  has-migrations: "false"
---

Adds a public recipe registry to your Pugmill site where community members can sign in with GitHub to browse, submit, and manage Pugmill extensions.

**Plugin id:** `community`
**Repository:** https://github.com/michaelsjanzen/pugmill-recipe-community

---

## Installation

Read `PLUGIN_AUTHORING.md` in your Pugmill install for the full plugin installation contract. This recipe adds routes and a shared lib file on top of the standard 4-step contract.

### Step 1 — Install the `jose` dependency

```bash
npm install jose
```

### Step 2 — Create a GitHub OAuth App

1. Go to https://github.com/settings/developers → **OAuth Apps** → **New OAuth App**
2. Fill in:
   - **Application name:** Your site name (e.g. "Pugmill Community")
   - **Homepage URL:** `https://your-site.com`
   - **Authorization callback URL:** `https://your-site.com/api/community/auth/callback`
3. Click **Register application**
4. Copy the **Client ID** and generate a **Client Secret**

### Step 3 — Add environment secrets

Add to your `.env.local` (and as platform secrets for production):

```env
COMMUNITY_GITHUB_CLIENT_ID=your_client_id_here
COMMUNITY_GITHUB_CLIENT_SECRET=your_client_secret_here
COMMUNITY_SESSION_SECRET=your_random_secret_here
```

Generate `COMMUNITY_SESSION_SECRET` with:

```bash
openssl rand -base64 32
```

### Step 4 — Copy files

Copy the `plugins/` and `src/` directories from this repository into the Pugmill project root, preserving the directory structure:

```
plugins/community/                                →  plugins/community/
src/lib/community-auth.ts                         →  src/lib/community-auth.ts
src/app/(site)/recipes/page.tsx                   →  src/app/(site)/recipes/page.tsx
src/app/(site)/recipes/submit/page.tsx            →  src/app/(site)/recipes/submit/page.tsx
src/app/(site)/recipes/[owner]/[slug]/page.tsx    →  src/app/(site)/recipes/[owner]/[slug]/page.tsx
src/app/(site)/community/account/page.tsx         →  src/app/(site)/community/account/page.tsx
src/app/api/community/auth/github/route.ts        →  src/app/api/community/auth/github/route.ts
src/app/api/community/auth/callback/route.ts      →  src/app/api/community/auth/callback/route.ts
src/app/api/community/auth/signout/route.ts       →  src/app/api/community/auth/signout/route.ts
src/app/api/community/download/[id]/route.ts      →  src/app/api/community/download/[id]/route.ts
```

### Step 5 — Register the plugin

Follow steps 2 and 3 of the plugin installation contract in `PLUGIN_AUTHORING.md`:

Add a static import in `src/lib/plugin-registry.ts`:
```ts
import { communityPlugin } from "../../plugins/community/index";
```

Add `communityPlugin` to the `ALL_PLUGINS` array in the same file.

### Step 6 — Activate the plugin

Activate via Admin > Settings > Plugins, or add `"community"` to `config.modules.activePlugins` in the database.

### Step 7 — Restart the dev server

The plugin creates its 8 database tables automatically via `schema.migrate()` on first cold start. Verify in Drizzle Studio (`npm run db:studio`) that these tables exist:

- `plugin_community_members`
- `plugin_community_recipes`
- `plugin_community_recipe_versions`
- `plugin_community_recipe_pnas`
- `plugin_community_stars`
- `plugin_community_download_events`
- `plugin_community_comments`
- `plugin_community_contribution_scores`

### Step 8 — Apply navigation (optional)

Go to **Admin > Plugins > Community** and click **Apply navigation** to add Recipes, Plugins, Themes, Workflows, PNA Cartridges, and Account links to your site navigation.

---

## Environment variables reference

| Variable | Required | Description |
|---|---|---|
| `COMMUNITY_GITHUB_CLIENT_ID` | Yes | GitHub OAuth App client ID |
| `COMMUNITY_GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth App client secret |
| `COMMUNITY_SESSION_SECRET` | Yes | Secret for signing community session JWTs (min 32 chars) |

---

## How it works

**Authentication:** Community members sign in with GitHub via a standard OAuth flow. Sessions are stored as httpOnly JWTs in a `__pugmill_community` cookie — separate from the Pugmill admin session. Visitors who are not signed in can browse recipes but cannot submit.

**Recipe submission:** A signed-in member provides a GitHub repository URL. The plugin fetches repo metadata and the latest release from the GitHub API, stores the result, and indexes the README for display.

**Download tracking:** The `/api/community/download/{id}` route records a download event and increments the recipe's counter before redirecting to the GitHub release page.

**Tiers and scoring:** Members have a `tier` (default: `apprentice`) and a `score`. The contribution scoring tables are in place for future automation — score calculation is not wired by default and can be implemented as a scheduled job or cron hook.

---

## Removing this recipe

1. Remove `"community"` from `config.modules.activePlugins`
2. Remove the static import and `ALL_PLUGINS` entry from `src/lib/plugin-registry.ts`
3. Delete the copied files (see Step 4 above)
4. Drop the plugin tables by calling `schema.teardown()` from `plugins/community/index.ts` manually, or run the SQL directly

---

## Extension points

The recipe fires no core hooks and registers no core hook listeners. To extend it:

- **On recipe submission:** Add logic after the `db.insert` in `plugins/community/actions/recipes.ts`
- **Scoring automation:** Call `db.update(pluginCommunityContributionScores, ...)` from a cron job or `post:after-save` listener
- **Moderation:** Add an `approved` column to `plugin_community_recipes` and filter the listing query accordingly
