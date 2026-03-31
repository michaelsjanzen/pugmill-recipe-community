import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.COMMUNITY_GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "GitHub OAuth not configured" }, { status: 503 });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    scope: "read:user user:email",
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/community/auth/callback`,
  });

  return NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params}`
  );
}
