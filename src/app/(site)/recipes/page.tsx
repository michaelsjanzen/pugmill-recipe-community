import { db } from "@/lib/db";
import { pluginCommunityRecipes, pluginCommunityMembers } from "../../../../plugins/community/schema";
import { eq, desc, count, inArray } from "drizzle-orm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recipes | Pugmill Community",
  description: "Browse plugins, themes, workflows, and PNA cartridges for Pugmill CMS.",
};

const TYPE_LABELS: Record<string, string> = {
  plugin: "Plugin",
  theme: "Theme",
  workflow: "Workflow",
  cartridge: "PNA Cartridge",
};

const NAV_TYPES = [
  { label: "All", value: "" },
  { label: "Plugins", value: "plugin" },
  { label: "Themes", value: "theme" },
  { label: "Workflows", value: "workflow" },
  { label: "PNA Cartridges", value: "cartridge" },
];

const PAGE_SIZE = 24;

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const VALID_TYPES = new Set(["plugin", "theme", "workflow", "cartridge"]);
  const typeFilter = VALID_TYPES.has(sp.type ?? "") ? (sp.type ?? "") : "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const where =
    typeFilter
      ? eq(pluginCommunityRecipes.type, typeFilter)
      : undefined;

  const [recipes, [{ total }]] = await Promise.all([
    db
      .select({
        id: pluginCommunityRecipes.id,
        name: pluginCommunityRecipes.name,
        slug: pluginCommunityRecipes.slug,
        type: pluginCommunityRecipes.type,
        summary: pluginCommunityRecipes.summary,
        latestVersion: pluginCommunityRecipes.latestVersion,
        license: pluginCommunityRecipes.license,
        starsCount: pluginCommunityRecipes.starsCount,
        createdAt: pluginCommunityRecipes.createdAt,
        ownerId: pluginCommunityRecipes.ownerId,
      })
      .from(pluginCommunityRecipes)
      .where(where)
      .orderBy(desc(pluginCommunityRecipes.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ total: count() })
      .from(pluginCommunityRecipes)
      .where(where),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const ownerIds = [...new Set(recipes.map((r) => r.ownerId))];
  const owners =
    ownerIds.length > 0
      ? await db
          .select({
            id: pluginCommunityMembers.id,
            githubHandle: pluginCommunityMembers.githubHandle,
            githubAvatarUrl: pluginCommunityMembers.githubAvatarUrl,
          })
          .from(pluginCommunityMembers)
          .where(inArray(pluginCommunityMembers.id, ownerIds))
      : [];

  const ownerMap = new Map(owners.map((o) => [o.id, o]));

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (typeFilter) params.set("type", typeFilter);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/recipes${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-foreground)" }}>
            Recipes
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
            Community-built plugins, themes, workflows, and PNA cartridges for Pugmill CMS.
          </p>
        </div>
        <a
          href="/recipes/submit"
          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ backgroundColor: "var(--color-accent)", color: "var(--color-accent-fg)" }}
        >
          Submit a Recipe
        </a>
      </div>

      {/* Type filter nav */}
      <nav className="flex gap-2 flex-wrap">
        {NAV_TYPES.map(({ label, value }) => {
          const active = typeFilter === value;
          return (
            <a
              key={value}
              href={value ? `/recipes?type=${value}` : "/recipes"}
              className="px-3 py-1.5 rounded-full text-sm no-underline"
              style={
                active
                  ? { backgroundColor: "var(--color-accent)", color: "var(--color-accent-fg)", fontWeight: 600 }
                  : { border: "1px solid var(--color-border)", color: "var(--color-muted)" }
              }
            >
              {label}
            </a>
          );
        })}
      </nav>

      {/* Recipe list */}
      {recipes.length === 0 ? (
        <p className="text-center py-12" style={{ color: "var(--color-muted)" }}>
          No recipes found.{" "}
          <a href="/recipes/submit" style={{ color: "var(--color-accent)" }}>
            Be the first to submit one!
          </a>
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {recipes.map((recipe) => {
            const owner = ownerMap.get(recipe.ownerId);
            const [ownerHandle] = recipe.slug.split("/");
            return (
              <a
                key={recipe.id}
                href={`/recipes/${recipe.slug}`}
                className="block p-5 rounded-xl no-underline"
                style={{
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface, transparent)",
                }}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold" style={{ color: "var(--color-foreground)" }}>
                        {recipe.name}
                      </span>
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}
                      >
                        {TYPE_LABELS[recipe.type] ?? recipe.type}
                      </span>
                      {recipe.latestVersion && (
                        <span className="text-xs" style={{ color: "var(--color-muted)" }}>
                          {recipe.latestVersion}
                        </span>
                      )}
                    </div>
                    {recipe.summary && (
                      <p className="mt-1 text-sm truncate" style={{ color: "var(--color-muted)" }}>
                        {recipe.summary}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {owner?.githubAvatarUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={owner.githubAvatarUrl}
                        alt={owner.githubHandle}
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                    )}
                    <span className="text-xs" style={{ color: "var(--color-muted)" }}>
                      {ownerHandle}
                    </span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm" style={{ color: "var(--color-muted)" }}>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={pageUrl(page - 1)}
                className="px-4 py-1.5 rounded-lg text-sm no-underline"
                style={{ border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
              >
                &larr; Previous
              </a>
            )}
            {page < totalPages && (
              <a
                href={pageUrl(page + 1)}
                className="px-4 py-1.5 rounded-lg text-sm no-underline"
                style={{ border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
              >
                Next &rarr;
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
