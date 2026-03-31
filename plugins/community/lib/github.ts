export interface GithubRepoMeta {
  owner: string;
  repo: string;
  name: string;
  description: string | null;
  defaultBranch: string;
  license: string | null;
  pushedAt: string;
  htmlUrl: string;
}

export interface GithubRelease {
  version: string;
  changelog: string | null;
  releaseUrl: string;
  zipballUrl: string;
  publishedAt: string;
}

const GITHUB_HEADERS = {
  Accept: "application/vnd.github+json",
  "User-Agent": "pugmill-community/0.1",
};

function authHeaders(accessToken?: string): Record<string, string> {
  if (accessToken) {
    return { ...GITHUB_HEADERS, Authorization: `token ${accessToken}` };
  }
  return { ...GITHUB_HEADERS };
}

/**
 * Parse a github.com/owner/repo URL (or owner/repo shorthand).
 * Returns { owner, repo } or null if the URL is not recognised.
 */
export function parseGithubUrl(
  url: string
): { owner: string; repo: string } | null {
  const trimmed = url.trim().replace(/\.git$/, "");

  // Full URL: https://github.com/owner/repo or http://github.com/owner/repo
  const fullMatch = trimmed.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/?$/
  );
  if (fullMatch) {
    return { owner: fullMatch[1], repo: fullMatch[2] };
  }

  // Shorthand: owner/repo
  const shortMatch = trimmed.match(/^([^/]+)\/([^/]+)$/);
  if (shortMatch) {
    return { owner: shortMatch[1], repo: shortMatch[2] };
  }

  return null;
}

/**
 * Fetch repository metadata from the GitHub API.
 * Throws on non-2xx responses.
 */
export async function fetchRepoMeta(
  owner: string,
  repo: string,
  accessToken?: string
): Promise<GithubRepoMeta> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: authHeaders(accessToken),
  });

  if (!res.ok) {
    throw new Error(
      `GitHub API error ${res.status} fetching repo ${owner}/${repo}`
    );
  }

  const data = (await res.json()) as {
    name: string;
    description: string | null;
    default_branch: string;
    license: { spdx_id: string } | null;
    pushed_at: string;
    html_url: string;
  };

  return {
    owner,
    repo,
    name: data.name,
    description: data.description,
    defaultBranch: data.default_branch,
    license: data.license?.spdx_id ?? null,
    pushedAt: data.pushed_at,
    htmlUrl: data.html_url,
  };
}

/**
 * Fetch the latest release for a repository.
 * Returns null if there are no releases (404).
 * Throws on other non-2xx responses.
 */
export async function fetchLatestRelease(
  owner: string,
  repo: string,
  accessToken?: string
): Promise<GithubRelease | null> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
    { headers: authHeaders(accessToken) }
  );

  if (res.status === 404) return null;

  if (!res.ok) {
    throw new Error(
      `GitHub API error ${res.status} fetching latest release for ${owner}/${repo}`
    );
  }

  const data = (await res.json()) as {
    tag_name: string;
    body: string | null;
    html_url: string;
    zipball_url: string;
    published_at: string;
  };

  return {
    version: data.tag_name,
    changelog: data.body,
    releaseUrl: data.html_url,
    zipballUrl: data.zipball_url,
    publishedAt: data.published_at,
  };
}

/**
 * Fetch all releases for a repository.
 * Throws on non-2xx responses.
 */
export async function fetchReleases(
  owner: string,
  repo: string,
  accessToken?: string
): Promise<GithubRelease[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases`,
    { headers: authHeaders(accessToken) }
  );

  if (!res.ok) {
    throw new Error(
      `GitHub API error ${res.status} fetching releases for ${owner}/${repo}`
    );
  }

  const data = (await res.json()) as Array<{
    tag_name: string;
    body: string | null;
    html_url: string;
    zipball_url: string;
    published_at: string;
  }>;

  return data.map((r) => ({
    version: r.tag_name,
    changelog: r.body,
    releaseUrl: r.html_url,
    zipballUrl: r.zipball_url,
    publishedAt: r.published_at,
  }));
}

/**
 * Fetch the decoded text content of a file in a repository.
 * Returns null if the file does not exist (404).
 * Throws on other non-2xx responses.
 */
export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  accessToken?: string
): Promise<string | null> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    { headers: authHeaders(accessToken) }
  );

  if (res.status === 404) return null;

  if (!res.ok) {
    throw new Error(
      `GitHub API error ${res.status} fetching file ${path} in ${owner}/${repo}`
    );
  }

  const data = (await res.json()) as { content?: string; encoding?: string };

  if (data.encoding === "base64" && data.content) {
    return Buffer.from(data.content.replace(/\n/g, ""), "base64").toString(
      "utf-8"
    );
  }

  return null;
}
