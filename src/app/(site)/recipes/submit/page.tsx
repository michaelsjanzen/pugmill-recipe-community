import { getCommunityUser } from "@/lib/community-auth";
import RecipeSubmitForm from "../../../../../plugins/community/components/RecipeSubmitForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit a Recipe | Pugmill Community",
};

export default async function SubmitRecipePage() {
  const member = await getCommunityUser();

  return (
    <div className="space-y-6">
      <a href="/recipes" className="text-sm no-underline" style={{ color: "var(--color-muted)" }}>
        &larr; Back to Recipes
      </a>

      <div>
        <h1 className="text-3xl font-bold" style={{ color: "var(--color-foreground)" }}>
          Submit a Recipe
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
          Share a Pugmill plugin, theme, workflow, or PNA cartridge with the community.
        </p>
      </div>

      {!member ? (
        <div
          className="p-8 rounded-xl text-center space-y-4"
          style={{ border: "1px solid var(--color-border)" }}
        >
          <p className="font-semibold" style={{ color: "var(--color-foreground)" }}>
            Sign in to submit a recipe
          </p>
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            You need a GitHub account to submit recipes to the community registry.
          </p>
          <a
            href="/api/community/auth/github"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold no-underline"
            style={{ backgroundColor: "var(--color-foreground)", color: "var(--color-background)" }}
          >
            Sign in with GitHub
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}
          >
            {member.githubAvatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.githubAvatarUrl}
                alt={member.githubHandle}
                width={24}
                height={24}
                className="rounded-full"
              />
            )}
            <span>
              Signed in as{" "}
              <strong style={{ color: "var(--color-foreground)" }}>{member.githubHandle}</strong>
            </span>
            <a
              href="/api/community/auth/signout"
              className="ml-auto text-xs underline"
              style={{ color: "var(--color-muted)" }}
            >
              Sign out
            </a>
          </div>
          <RecipeSubmitForm />
        </div>
      )}
    </div>
  );
}
