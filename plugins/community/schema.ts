import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";

export const pluginCommunityMembers = pgTable("plugin_community_members", {
  id: serial("id").primaryKey(),
  githubId: text("github_id").notNull().unique(),
  githubHandle: text("github_handle").notNull().unique(),
  githubAvatarUrl: text("github_avatar_url"),
  githubAccessToken: text("github_access_token"),
  tier: text("tier").notNull().default("apprentice"),
  score: integer("score").notNull().default(0),
  scoreUpdatedAt: timestamp("score_updated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
});

export const pluginCommunityRecipes = pgTable("plugin_community_recipes", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull(),
  githubRepoUrl: text("github_repo_url").notNull(),
  githubOwner: text("github_owner").notNull(),
  githubRepo: text("github_repo").notNull(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  summary: text("summary").notNull(),
  readmeMd: text("readme_md"),
  latestVersion: text("latest_version"),
  license: text("license"),
  starsCount: integer("stars_count").notNull().default(0),
  downloadCount: integer("download_count").notNull().default(0),
  lastIndexedAt: timestamp("last_indexed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pluginCommunityRecipeVersions = pgTable("plugin_community_recipe_versions", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull(),
  version: text("version").notNull(),
  changelog: text("changelog"),
  releaseUrl: text("release_url"),
  zipballUrl: text("zipball_url"),
  publishedAt: timestamp("published_at").notNull(),
});

export const pluginCommunityRecipePnas = pgTable(
  "plugin_community_recipe_pnas",
  {
    recipeId: integer("recipe_id").notNull(),
    pnaId: integer("pna_id").notNull(),
    required: boolean("required").notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.recipeId, t.pnaId] })]
);

export const pluginCommunityStars = pgTable("plugin_community_stars", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull(),
  memberId: integer("member_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pluginCommunityDownloadEvents = pgTable("plugin_community_download_events", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull(),
  memberId: integer("member_id"),
  version: text("version"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pluginCommunityComments = pgTable("plugin_community_comments", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull(),
  memberId: integer("member_id").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pluginCommunityContributionScores = pgTable(
  "plugin_community_contribution_scores",
  {
    memberId: integer("member_id").primaryKey(),
    recipesPublished: integer("recipes_published").notNull().default(0),
    starsReceived: integer("stars_received").notNull().default(0),
    downloadsReceived: integer("downloads_received").notNull().default(0),
    commentsPosted: integer("comments_posted").notNull().default(0),
    lastCalculatedAt: timestamp("last_calculated_at").defaultNow().notNull(),
  }
);
