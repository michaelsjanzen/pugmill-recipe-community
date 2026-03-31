# Pugmill Community Recipe

**Type:** Plugin
**Version:** 0.2.0
**Requires:** Pugmill CMS v0.2.0+
**Author:** michaeljanzen
**Repository:** https://github.com/pugmillcms/recipe-community

Adds a public recipe registry to your Pugmill site. Community members sign in with GitHub to browse, submit, and manage plugins, themes, workflows, and PNA cartridges built for Pugmill CMS.

---

## What this recipe installs

- `/recipes` — browseable registry with type filters and pagination
- `/recipes/submit` — GitHub-authenticated submission form
- `/recipes/{owner}/{repo}` — recipe detail page with README rendering, download tracking, and owner controls
- `/community/account` — member profile (GitHub avatar, tier, score)
- GitHub OAuth sign-in at `/api/community/auth/github`
- Admin plugin page at Admin > Plugins > Community (OAuth status + navigation setup)
- 8 database tables (all prefixed `plugin_community_`)
- Download event and star tracking

---

## Prerequisites

- Pugmill CMS v0.2.0 installed and running
- A GitHub OAuth App (see Step 2 below)
- `jose` npm package

---

## Installation

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

### Step 3 — Add environment variables

Add to your `.env.local`:

```env
COMMUNITY_GITHUB_CLIENT_ID=your_client_id_here
COMMUNITY_GITHUB_CLIENT_SECRET=your_client_secret_here
COMMUNITY_SESSION_SECRET=your_random_secret_here
```

Generate `COMMUNITY_SESSION_SECRET` with:

```bash
openssl rand -base64 32
```

### Step 4 — Copy plugin files

Copy the following directory into your Pugmill install:

```
plugins/community/  →  plugins/community/
```

### Step 5 — Copy src files

Copy these files into their matching paths in your Pugmill install:

```
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

### Step 6 — Register the plugin

Add `"community"` to the `activePlugins` array in `pugmill.config.json`:

```json
{
  "activePlugins": ["default-widgets", "contact-form", "bot-analytics", "community"]
}
```

### Step 7 — Register the plugin in the registry

Open `src/lib/plugin-registry.ts`. The file has a comment block at the top with explicit install instructions. Follow Steps 2 and 3 in that comment:

**Step 2** — add a static import near the other plugin imports:
```ts
import { communityPlugin } from "../../plugins/community/index";
```

**Step 3** — add `communityPlugin` to the `ALL_PLUGINS` array.

### Step 8 — Run the schema migration

The plugin creates its own tables on first load via `schema.migrate()`. Restart your dev server and the tables will be created automatically. You can verify in Drizzle Studio:

```bash
npm run db:studio
```

Confirm these tables exist:
- `plugin_community_members`
- `plugin_community_recipes`
- `plugin_community_recipe_versions`
- `plugin_community_recipe_pnas`
- `plugin_community_stars`
- `plugin_community_download_events`
- `plugin_community_comments`
- `plugin_community_contribution_scores`

### Step 9 — Apply navigation (optional)

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

To cleanly uninstall:

1. Remove `"community"` from `activePlugins` in `pugmill.config.json`
2. Remove the static import from `src/lib/plugin-loader.ts`
3. Delete the copied files (plugin directory + src files listed in Step 5)
4. Drop the plugin tables (the `schema.teardown()` method in `plugins/community/index.ts` will do this if called manually)

---

## Extension points

The recipe fires no core hooks and registers no core hook listeners. To extend it:

- **On recipe submission:** Add logic after the `db.insert` in `plugins/community/actions/recipes.ts` (e.g. send a notification, post to a webhook)
- **Scoring automation:** Call `db.update(pluginCommunityContributionScores, ...)` from a cron job or `post:after-save` listener
- **Moderation:** Add an `approved` column to `plugin_community_recipes` and filter the listing query accordingly
