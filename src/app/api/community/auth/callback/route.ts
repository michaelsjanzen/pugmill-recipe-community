import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pluginCommunityMembers } from "../../../../../../plugins/community/schema";
import { eq } from "drizzle-orm";
import { createSessionToken } from "@/lib/community-auth";

interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing code parameter" }, { status: 400 });
  }

  const clientId = process.env.COMMUNITY_GITHUB_CLIENT_ID;
  const clientSecret = process.env.COMMUNITY_GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "GitHub OAuth not configured" }, { status: 503 });
  }

  // 1. Exchange code for access token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "pugmill-community/0.1",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/community/auth/callback`,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.json({ error: "Failed to exchange code for token" }, { status: 502 });
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };

  if (!tokenData.access_token) {
    return NextResponse.json(
      { error: tokenData.error ?? "No access token returned" },
      { status: 502 }
    );
  }

  const accessToken = tokenData.access_token;

  // 2. Fetch GitHub user
  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `token ${accessToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "pugmill-community/0.1",
    },
  });

  if (!userRes.ok) {
    return NextResponse.json({ error: "Failed to fetch GitHub user" }, { status: 502 });
  }

  const githubUser = (await userRes.json()) as GitHubUser;

  // 3. Upsert member row
  const githubIdStr = String(githubUser.id);
  const now = new Date();

  const existingRows = await db
    .select()
    .from(pluginCommunityMembers)
    .where(eq(pluginCommunityMembers.githubId, githubIdStr))
    .limit(1);
  const existing = existingRows[0] ?? null;

  let memberId: number;

  if (existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db
      .update(pluginCommunityMembers)
      .set({
        githubHandle: githubUser.login,
        githubAvatarUrl: githubUser.avatar_url,
        githubAccessToken: accessToken,
        lastActiveAt: now,
      } as any)
      .where(eq(pluginCommunityMembers.githubId, githubIdStr));
    memberId = existing.id;
  } else {
    const [inserted] = await db
      .insert(pluginCommunityMembers)
      .values({
        githubId: githubIdStr,
        githubHandle: githubUser.login,
        githubAvatarUrl: githubUser.avatar_url,
        githubAccessToken: accessToken,
        tier: "apprentice",
        score: 0,
        lastActiveAt: now,
      } as typeof pluginCommunityMembers.$inferInsert)
      .returning({ id: pluginCommunityMembers.id });
    memberId = inserted.id;
  }

  // 4. Create session token
  const token = await createSessionToken({
    memberId,
    githubHandle: githubUser.login,
    githubId: githubIdStr,
  });

  // 5. Redirect to /recipes with session cookie
  const response = NextResponse.redirect(
    new URL("/recipes", process.env.NEXTAUTH_URL)
  );
  response.cookies.set("__pugmill_community", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return response;
}
