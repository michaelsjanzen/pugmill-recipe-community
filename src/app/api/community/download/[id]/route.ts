import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  pluginCommunityRecipes,
  pluginCommunityDownloadEvents,
} from "../../../../../../plugins/community/schema";
import { eq, sql } from "drizzle-orm";
import { getCommunityUser } from "@/lib/community-auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recipeId = parseInt(id, 10);

  if (isNaN(recipeId)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const rows = await db
    .select({
      id: pluginCommunityRecipes.id,
      githubOwner: pluginCommunityRecipes.githubOwner,
      githubRepo: pluginCommunityRecipes.githubRepo,
      latestVersion: pluginCommunityRecipes.latestVersion,
    })
    .from(pluginCommunityRecipes)
    .where(eq(pluginCommunityRecipes.id, recipeId))
    .limit(1);

  const recipe = rows[0];
  if (!recipe) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Record the event (best-effort, don't block the redirect)
  try {
    const member = await getCommunityUser();

    await db.insert(pluginCommunityDownloadEvents).values({
      recipeId,
      memberId: member?.id ?? null,
      version: recipe.latestVersion ?? null,
    } as typeof pluginCommunityDownloadEvents.$inferInsert);

    await db
      .update(pluginCommunityRecipes)
      .set({ downloadCount: sql`${pluginCommunityRecipes.downloadCount} + 1` })
      .where(eq(pluginCommunityRecipes.id, recipeId));
  } catch {
    // Never block the redirect on a tracking failure
  }

  const releaseUrl = `https://github.com/${recipe.githubOwner}/${recipe.githubRepo}/releases/latest`;
  return NextResponse.redirect(releaseUrl);
}
