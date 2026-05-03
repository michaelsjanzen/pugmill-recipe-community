import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const clientId = process.env.COMMUNITY_GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "GitHub OAuth not configured" }, { status: 503 });
  }

  // Derive the base URL from the incoming request rather than process.env.NEXTAUTH_URL.
  // This makes the OAuth flow work on any Pugmill host (Replit autoscale, custom domain,
  // local dev) without depending on a specific env var being set correctly at boot.
  const origin = new URL(request.url).origin;

  const params = new URLSearchParams({
    client_id: clientId,
    scope: "read:user user:email",
    redirect_uri: `${origin}/api/community/auth/callback`,
  });

  return NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params}`
  );
}
