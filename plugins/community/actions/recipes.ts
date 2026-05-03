"use server";

import { loadPlugins } from "@/lib/plugin-loader";
import { getCommunityUser } from "@/lib/community-auth";
import { db } from "@/lib/db";
import {
  pluginCommunityRecipes,
  pluginCommunityRecipeVersions,
} from "../schema";
import { eq } from "drizzle-orm";
import {
  parseGithubUrl,
  fetchRepoMeta,
  fetchLatestRelease,
  fetchFileContent,
} from "../lib/github";
import { redirect } from "next/navigation";

const VALID_TYPES = new Set(["plugin", "theme", "workflow", "cartridge"]);

export type SubmitRecipeState = { error: string | null; success: boolean; slug?: string };

export async function submitRecipe(
  _prevState: SubmitRecipeState,
  formData: FormData
): Promise<SubmitRecipeState> {
  await loadPlugins();

  const member = await getCommunityUser();
  if (!member) {
    return { error: "Sign in to submit a recipe", success: false };
  }

  const githubUrl = (formData.get("githubUrl") as string | null)?.trim() ?? "";
  const type = (formData.get("type") as string | null)?.trim() ?? "";

  if (!VALID_TYPES.has(type)) {
    return { error: "Invalid recipe type.", success: false };
  }

  const parsed = parseGithubUrl(githubUrl);
  if (!parsed) {
    return { error: "Invalid GitHub repository URL", success: false };
  }

  const { owner, repo } = parsed;

  let repoMeta: Awaited<ReturnType<typeof fetchRepoMeta>>;
  let latestRelease: Awaited<ReturnType<typeof fetchLatestRelease>>;
  let readmeMd: string | null = null;

  try {
    [repoMeta, latestRelease] = await Promise.all([
      fetchRepoMeta(owner, repo, member.githubAccessToken ?? undefined),
      fetchLatestRelease(owner, repo, member.githubAccessToken ?? undefined),
    ]);

    readmeMd =
      (await fetchFileContent(owner, repo, "README.md", member.githubAccessToken ?? undefined)) ??
      (await fetchFileContent(owner, repo, "readme.md", member.githubAccessToken ?? undefined));
  } catch {
    return { error: "Could not fetch repository from GitHub. Check the URL and try again.", success: false };
  }

  const slug = `${member.githubHandle}/${repo}`;

  const existingRows = await db
    .select({ id: pluginCommunityRecipes.id })
    .from(pluginCommunityRecipes)
    .where(eq(pluginCommunityRecipes.slug, slug))
    .limit(1);

  if (existingRows.length > 0) {
    return { error: "This repository has already been submitted.", success: false };
  }

  const [newRecipe] = await db
    .insert(pluginCommunityRecipes)
    .values({
      ownerId: member.id,
      githubRepoUrl: githubUrl,
      githubOwner: owner,
      githubRepo: repo,
      type,
      name: repoMeta.name,
      slug,
      summary: repoMeta.description ?? "",
      readmeMd,
      license: repoMeta.license,
      latestVersion: latestRelease?.version ?? null,
      lastIndexedAt: new Date(),
    } as typeof pluginCommunityRecipes.$inferInsert)
    .returning({ id: pluginCommunityRecipes.id });

  if (latestRelease) {
    await db.insert(pluginCommunityRecipeVersions).values({
      recipeId: newRecipe.id,
      version: latestRelease.version,
      changelog: latestRelease.changelog,
      releaseUrl: latestRelease.releaseUrl,
      zipballUrl: latestRelease.zipballUrl,
      publishedAt: new Date(latestRelease.publishedAt),
    } as typeof pluginCommunityRecipeVersions.$inferInsert);
  }

  return { error: null, success: true, slug };
}

export async function reindexRecipe(recipeId: number): Promise<void> {
  await loadPlugins();

  const member = await getCommunityUser();
  if (!member) redirect("/community/account");

  const rows = await db
    .select()
    .from(pluginCommunityRecipes)
    .where(eq(pluginCommunityRecipes.id, recipeId))
    .limit(1);

  const recipe = rows[0];
  if (!recipe || recipe.ownerId !== member.id) redirect("/recipes");

  const { githubOwner, githubRepo } = recipe;
  const token = member.githubAccessToken ?? undefined;

  try {
    const [repoMeta, latestRelease, readmeMd] = await Promise.all([
      fetchRepoMeta(githubOwner, githubRepo, token),
      fetchLatestRelease(githubOwner, githubRepo, token),
      fetchFileContent(githubOwner, githubRepo, "README.md", token).then(
        (r) => r ?? fetchFileContent(githubOwner, githubRepo, "readme.md", token)
      ),
    ]);

    await db
      .update(pluginCommunityRecipes)
      .set({
        name: repoMeta.name,
        summary: repoMeta.description ?? recipe.summary,
        readmeMd,
        license: repoMeta.license,
        latestVersion: latestRelease?.version ?? recipe.latestVersion,
        lastIndexedAt: new Date(),
        updatedAt: new Date(),
      } as Partial<typeof pluginCommunityRecipes.$inferInsert>)
      .where(eq(pluginCommunityRecipes.id, recipeId));

    if (latestRelease) {
      const existing = await db
        .select({ id: pluginCommunityRecipeVersions.id })
        .from(pluginCommunityRecipeVersions)
        .where(eq(pluginCommunityRecipeVersions.recipeId, recipeId))
        .limit(1);

      if (!existing.some((v: { id: number }) => v.id)) {
        await db.insert(pluginCommunityRecipeVersions).values({
          recipeId,
          version: latestRelease.version,
          changelog: latestRelease.changelog,
          releaseUrl: latestRelease.releaseUrl,
          zipballUrl: latestRelease.zipballUrl,
          publishedAt: new Date(latestRelease.publishedAt),
        } as typeof pluginCommunityRecipeVersions.$inferInsert);
      }
    }
  } catch {
    // If GitHub fetch fails, redirect without changes
  }

  redirect(`/recipes/${recipe.slug}?reindexed=1`);
}

export async function deleteRecipe(recipeId: number): Promise<void> {
  await loadPlugins();

  const member = await getCommunityUser();
  if (!member) redirect("/community/account");

  const rows = await db
    .select({ id: pluginCommunityRecipes.id, ownerId: pluginCommunityRecipes.ownerId })
    .from(pluginCommunityRecipes)
    .where(eq(pluginCommunityRecipes.id, recipeId))
    .limit(1);

  const recipe = rows[0];
  if (!recipe || recipe.ownerId !== member.id) redirect("/recipes");

  await db
    .delete(pluginCommunityRecipes)
    .where(eq(pluginCommunityRecipes.id, recipeId));

  redirect("/recipes");
}
