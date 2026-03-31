import { db } from "@/lib/db";
import {
  pluginCommunityRecipes,
  pluginCommunityMembers,
} from "../../../../../../plugins/community/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { getCommunityUser } from "@/lib/community-auth";
import { reindexRecipe, deleteRecipe } from "../../../../../../plugins/community/actions/recipes";
import DeleteRecipeForm from "../../../../../../plugins/community/components/DeleteRecipeForm";

const TYPE_LABELS: Record<string, string> = {
  plugin: "Plugin",
  theme: "Theme",
  workflow: "Workflow",
  cartridge: "PNA Cartridge",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ owner: string; slug: string }>;
}): Promise<Metadata> {
  const { owner, slug } = await params;
  const fullSlug = `${owner}/${slug}`;

  const rows = await db
    .select()
    .from(pluginCommunityRecipes)
    .where(eq(pluginCommunityRecipes.slug, fullSlug))
    .limit(1);
  const recipe = rows[0] ?? null;

  if (!recipe) return { title: "Recipe not found" };

  return {
    title: `${recipe.name} | Pugmill Community`,
    description: recipe.summary || undefined,
  };
}

export default async function RecipeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ owner: string; slug: string }>;
  searchParams: Promise<{ reindexed?: string }>;
}) {
  const [{ owner, slug }, sp] = await Promise.all([params, searchParams]);
  const fullSlug = `${owner}/${slug}`;

  const [recipeRows, currentUser] = await Promise.all([
    db
      .select()
      .from(pluginCommunityRecipes)
      .where(eq(pluginCommunityRecipes.slug, fullSlug))
      .limit(1),
    getCommunityUser(),
  ]);

  const recipe = recipeRows[0];
  if (!recipe) notFound();

  const ownerRows = await db
    .select()
    .from(pluginCommunityMembers)
    .where(eq(pluginCommunityMembers.id, recipe.ownerId))
    .limit(1);
  const recipeOwner = ownerRows[0] ?? null;

  const isOwner = currentUser?.id === recipe.ownerId;

  const boundReindex = reindexRecipe.bind(null, recipe.id);
  const boundDelete = deleteRecipe.bind(null, recipe.id);

  return (
    <div className="space-y-8">
      {/* Back link */}
      <a href="/recipes" className="text-sm no-underline" style={{ color: "var(--color-muted)" }}>
        &larr; Back to Recipes
      </a>

      {sp.reindexed === "1" && (
        <p className="text-sm px-4 py-2 rounded-lg" style={{ backgroundColor: "var(--color-surface, transparent)", border: "1px solid var(--color-border)", color: "var(--color-muted)" }}>
          Recipe refreshed from GitHub.
        </p>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <h1 className="text-3xl font-bold m-0" style={{ color: "var(--color-foreground)" }}>
            {recipe.name}
          </h1>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}
          >
            {TYPE_LABELS[recipe.type] ?? recipe.type}
          </span>
          {recipe.latestVersion && (
            <span className="text-sm" style={{ color: "var(--color-muted)" }}>
              {recipe.latestVersion}
            </span>
          )}
        </div>
        {recipe.summary && (
          <p className="text-base m-0" style={{ color: "var(--color-muted)" }}>
            {recipe.summary}
          </p>
        )}
      </div>

      {/* Meta panel */}
      <div
        className="grid gap-4 p-5 rounded-xl"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          border: "1px solid var(--color-border)",
        }}
      >
        {recipeOwner && (
          <div>
            <div className="text-xs font-medium mb-1" style={{ color: "var(--color-muted)" }}>
              Author
            </div>
            <div className="flex items-center gap-1.5">
              {recipeOwner.githubAvatarUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={recipeOwner.githubAvatarUrl}
                  alt={recipeOwner.githubHandle}
                  width={18}
                  height={18}
                  className="rounded-full"
                />
              )}
              <span className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                {recipeOwner.githubHandle}
              </span>
            </div>
          </div>
        )}

        {recipe.license && (
          <div>
            <div className="text-xs font-medium mb-1" style={{ color: "var(--color-muted)" }}>
              License
            </div>
            <span className="text-sm" style={{ color: "var(--color-foreground)" }}>
              {recipe.license}
            </span>
          </div>
        )}

        <div>
          <div className="text-xs font-medium mb-1" style={{ color: "var(--color-muted)" }}>
            Stars
          </div>
          <span className="text-sm" style={{ color: "var(--color-foreground)" }}>
            {recipe.starsCount.toLocaleString()}
          </span>
        </div>

        <div>
          <div className="text-xs font-medium mb-1" style={{ color: "var(--color-muted)" }}>
            Downloads
          </div>
          <span className="text-sm" style={{ color: "var(--color-foreground)" }}>
            {recipe.downloadCount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 flex-wrap items-center">
        <a
          href={recipe.githubRepoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold no-underline"
          style={{ border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
        >
          View on GitHub
        </a>

        {recipe.latestVersion && (
          <a
            href={`/api/community/download/${recipe.id}`}
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold no-underline"
            style={{ backgroundColor: "var(--color-accent)", color: "var(--color-accent-fg)" }}
          >
            Download {recipe.latestVersion}
          </a>
        )}

        {isOwner && (
          <>
            <form action={boundReindex}>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}
              >
                Refresh from GitHub
              </button>
            </form>
            <DeleteRecipeForm action={boundDelete} />
          </>
        )}
      </div>

      {/* README */}
      {recipe.readmeMd && (
        <div
          className="p-6 rounded-xl prose max-w-none"
          style={{
            border: "1px solid var(--color-border)",
            color: "var(--color-foreground)",
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
            {recipe.readmeMd}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
