import type { PugmillPlugin } from "../../src/lib/plugin-registry";
import { db } from "../../src/lib/db";
import { sql } from "drizzle-orm";
import CommunityAdminPage from "./AdminPage";

export const communityPlugin: PugmillPlugin = {
  id: "community",
  name: "Pugmill Community",
  version: "0.2.0",
  description: "Recipe registry for plugins, themes, workflows, and PNA cartridges.",
  adminPage: CommunityAdminPage,

  schema: {
    async migrate() {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS plugin_community_members (
          id                SERIAL PRIMARY KEY,
          github_id         TEXT NOT NULL UNIQUE,
          github_handle     TEXT NOT NULL UNIQUE,
          github_avatar_url TEXT,
          github_access_token TEXT,
          tier              TEXT NOT NULL DEFAULT 'apprentice',
          score             INTEGER NOT NULL DEFAULT 0,
          score_updated_at  TIMESTAMPTZ,
          created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_active_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS plugin_community_recipes (
          id                SERIAL PRIMARY KEY,
          owner_id          INTEGER NOT NULL,
          github_repo_url   TEXT NOT NULL,
          github_owner      TEXT NOT NULL,
          github_repo       TEXT NOT NULL,
          type              TEXT NOT NULL,
          name              TEXT NOT NULL,
          slug              TEXT NOT NULL UNIQUE,
          summary           TEXT NOT NULL,
          readme_md         TEXT,
          latest_version    TEXT,
          license           TEXT,
          stars_count       INTEGER NOT NULL DEFAULT 0,
          download_count    INTEGER NOT NULL DEFAULT 0,
          last_indexed_at   TIMESTAMPTZ,
          created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS plugin_community_recipe_versions (
          id           SERIAL PRIMARY KEY,
          recipe_id    INTEGER NOT NULL,
          version      TEXT NOT NULL,
          changelog    TEXT,
          release_url  TEXT,
          zipball_url  TEXT,
          published_at TIMESTAMPTZ NOT NULL
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS plugin_community_recipe_pnas (
          recipe_id INTEGER NOT NULL,
          pna_id    INTEGER NOT NULL,
          required  BOOLEAN NOT NULL DEFAULT FALSE,
          PRIMARY KEY (recipe_id, pna_id)
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS plugin_community_stars (
          id         SERIAL PRIMARY KEY,
          recipe_id  INTEGER NOT NULL,
          member_id  INTEGER NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS plugin_community_download_events (
          id         SERIAL PRIMARY KEY,
          recipe_id  INTEGER NOT NULL,
          member_id  INTEGER,
          version    TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS plugin_community_comments (
          id         SERIAL PRIMARY KEY,
          recipe_id  INTEGER NOT NULL,
          member_id  INTEGER NOT NULL,
          body       TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS plugin_community_contribution_scores (
          member_id          INTEGER PRIMARY KEY,
          recipes_published  INTEGER NOT NULL DEFAULT 0,
          stars_received     INTEGER NOT NULL DEFAULT 0,
          downloads_received INTEGER NOT NULL DEFAULT 0,
          comments_posted    INTEGER NOT NULL DEFAULT 0,
          last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
    },

    async teardown() {
      await db.execute(sql`DROP TABLE IF EXISTS plugin_community_contribution_scores`);
      await db.execute(sql`DROP TABLE IF EXISTS plugin_community_comments`);
      await db.execute(sql`DROP TABLE IF EXISTS plugin_community_download_events`);
      await db.execute(sql`DROP TABLE IF EXISTS plugin_community_stars`);
      await db.execute(sql`DROP TABLE IF EXISTS plugin_community_recipe_pnas`);
      await db.execute(sql`DROP TABLE IF EXISTS plugin_community_recipe_versions`);
      await db.execute(sql`DROP TABLE IF EXISTS plugin_community_recipes`);
      await db.execute(sql`DROP TABLE IF EXISTS plugin_community_members`);
    },
  },

  initialize(_hooks, _settings) {
    // No core hook listeners needed — the plugin's public routes and
    // server actions handle all community interactions directly.
  },
};

export default communityPlugin;
