import { getCommunityUser } from "@/lib/community-auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account | Pugmill Community",
};

export default async function AccountPage() {
  const member = await getCommunityUser();

  if (!member) {
    return (
      <div className="max-w-sm mx-auto mt-16 space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>
            Sign in to Pugmill Community
          </h1>
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            GitHub account required to submit and star recipes.
          </p>
        </div>
        <a
          href="/api/community/auth/github"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold no-underline"
          style={{ backgroundColor: "var(--color-foreground)", color: "var(--color-background)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          Sign in with GitHub
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto mt-16 space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>
        Account
      </h1>

      <div
        className="flex items-center gap-4 p-4 rounded-xl"
        style={{ border: "1px solid var(--color-border)" }}
      >
        {member.githubAvatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.githubAvatarUrl}
            alt={member.githubHandle}
            width={48}
            height={48}
            className="rounded-full shrink-0"
          />
        )}
        <div className="min-w-0">
          <p className="font-semibold truncate" style={{ color: "var(--color-foreground)" }}>
            {member.githubHandle}
          </p>
          <p className="text-xs capitalize" style={{ color: "var(--color-muted)" }}>
            {member.tier} &middot; {member.score.toLocaleString()} pts
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <a
          href="/recipes"
          className="text-sm no-underline"
          style={{ color: "var(--color-accent)" }}
        >
          Browse Recipes
        </a>
        <a
          href="/recipes/submit"
          className="text-sm no-underline"
          style={{ color: "var(--color-accent)" }}
        >
          Submit a Recipe
        </a>
      </div>

      <a
        href="/api/community/auth/signout"
        className="inline-flex px-4 py-2 rounded-lg text-sm font-medium no-underline"
        style={{ border: "1px solid var(--color-border)", color: "var(--color-muted)" }}
      >
        Sign out
      </a>
    </div>
  );
}
