import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getConfig, updateConfig } from "../../src/lib/config";

const NAV_ITEMS = [
  { label: "Recipes", path: "/recipes" },
  { label: "Plugins", path: "/recipes?type=plugin" },
  { label: "Themes", path: "/recipes?type=theme" },
  { label: "PNA Cartridges", path: "/recipes?type=cartridge" },
  { label: "Account", path: "/community/account" },
];


function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full mr-2 ${ok ? "bg-green-500" : "bg-zinc-300"}`}
    />
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-6 space-y-4">
      <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
      {children}
    </div>
  );
}

export default async function CommunityAdminPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const githubClientId = process.env.COMMUNITY_GITHUB_CLIENT_ID;
  const githubClientSecret = process.env.COMMUNITY_GITHUB_CLIENT_SECRET;
  const sessionSecret = process.env.COMMUNITY_SESSION_SECRET;
  const oauthReady = !!(githubClientId && githubClientSecret && sessionSecret);

  const config = await getConfig();
  const currentNav = (config.appearance.navigation ?? []) as { label: string; path: string }[];
  const navApplied = NAV_ITEMS.every((item) =>
    currentNav.some((n) => n.path === item.path && n.label === item.label)
  );

  const navSaved = searchParams.navSaved === "1";

  async function applyNavigation() {
    "use server";
    const current = await getConfig();
    await updateConfig({
      ...current,
      appearance: {
        ...current.appearance,
        navigation: NAV_ITEMS,
      },
    });
    revalidatePath("/admin/plugins/community");
    redirect("/admin/plugins/community?navSaved=1");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Pugmill Community</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Recipe registry for plugins, themes, workflows, and PNA cartridges.
        </p>
      </div>

      {/* OAuth status */}
      <Section title="GitHub OAuth">
        <p className="text-sm text-zinc-600">
          Community members sign in with GitHub. Three environment variables are required.
        </p>
        <ul className="space-y-2 text-sm">
          <li>
            <StatusDot ok={!!githubClientId} />
            <code className="text-xs bg-zinc-100 px-1 py-0.5 rounded">COMMUNITY_GITHUB_CLIENT_ID</code>
            {!githubClientId && <span className="text-zinc-400 ml-2">not set</span>}
          </li>
          <li>
            <StatusDot ok={!!githubClientSecret} />
            <code className="text-xs bg-zinc-100 px-1 py-0.5 rounded">COMMUNITY_GITHUB_CLIENT_SECRET</code>
            {!githubClientSecret && <span className="text-zinc-400 ml-2">not set</span>}
          </li>
          <li>
            <StatusDot ok={!!sessionSecret} />
            <code className="text-xs bg-zinc-100 px-1 py-0.5 rounded">COMMUNITY_SESSION_SECRET</code>
            {!sessionSecret && <span className="text-zinc-400 ml-2">not set</span>}
          </li>
        </ul>
        {!oauthReady && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            Add these to your <code>.env.local</code> file. Create a GitHub OAuth app at{" "}
            github.com/settings/developers with callback URL{" "}
            <code>/community/auth/callback</code>. Generate{" "}
            <code>COMMUNITY_SESSION_SECRET</code> with{" "}
            <code>openssl rand -base64 32</code>.
          </p>
        )}
      </Section>

      {/* Navigation setup */}
      <Section title="Navigation setup">
        <p className="text-sm text-zinc-600">
          These nav items give visitors access to the recipe registry and GitHub sign-in.
          Applying them replaces your current navigation.{" "}
          <a href="/admin/settings/navigation" className="underline text-zinc-900">
            Customize further in Settings &rsaquo; Navigation.
          </a>
        </p>
        <div className="border border-zinc-200 rounded overflow-hidden text-sm">
          <table className="w-full">
            <thead className="bg-zinc-50 text-xs text-zinc-500 uppercase">
              <tr>
                <th className="text-left px-3 py-2">Label</th>
                <th className="text-left px-3 py-2">Path</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {NAV_ITEMS.map((item) => (
                <tr key={item.path}>
                  <td className="px-3 py-2 font-medium text-zinc-700">{item.label}</td>
                  <td className="px-3 py-2">
                    <code className="text-xs bg-zinc-100 px-1 py-0.5 rounded">{item.path}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-3">
          <form action={applyNavigation}>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-zinc-900 text-white hover:bg-zinc-700 transition-colors"
            >
              {navApplied ? "Re-apply navigation" : "Apply navigation"}
            </button>
          </form>
          {(navApplied || navSaved) && (
            <span className="text-sm text-green-700">
              {navSaved ? "Navigation updated." : "Already applied."}
            </span>
          )}
        </div>
      </Section>

      {/* Homepage setup */}
      <Section title="Homepage">
        <p className="text-sm text-zinc-600">
          The homepage shows a built-in hero by default -- no setup needed. If you want a
          fully custom homepage instead, create a CMS page with the slug{" "}
          <code className="text-xs bg-zinc-100 px-1 py-0.5 rounded">home</code> and publish
          it; that page will take over automatically.
        </p>
        <ol className="list-decimal list-inside space-y-1 text-sm text-zinc-500">
          <li>
            Go to{" "}
            <a href="/admin/pages/new" className="underline text-zinc-700">
              Pages &rsaquo; New Page
            </a>
          </li>
          <li>
            Set the slug to exactly{" "}
            <code className="text-xs bg-zinc-100 px-1 py-0.5 rounded">home</code>, type Page, status Published
          </li>
          <li>The built-in hero is replaced automatically</li>
        </ol>
      </Section>

    </div>
  );
}
