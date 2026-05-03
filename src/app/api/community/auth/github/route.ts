import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const clientId = process.env.COMMUNITY_GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "GitHub OAuth not configured" }, { status: 503 });
  }

  // Prefer PRODUCTION_URL when set — behind proxies (Replit autoscale, etc.) request.url
  // can report the internal host instead of the public custom domain, which causes GitHub
  // to reject the redirect_uri. Fall back to the request origin for local dev.
  const origin = (process.env.PRODUCTION_URL?.replace(/\/$/, "")) || new URL(request.url).origin;

  const params = new URLSearchParams({
    client_id: clientId,
    scope: "read:user user:email",
    redirect_uri: `${origin}/api/community/auth/callback`,
  });

  return NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params}`
  );
}
