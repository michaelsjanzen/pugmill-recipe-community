import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { pluginCommunityMembers } from "../../plugins/community/schema";
import { eq } from "drizzle-orm";

const SECRET = new TextEncoder().encode(
  process.env.COMMUNITY_SESSION_SECRET ?? "fallback-dev-secret-change-me"
);
const COOKIE_NAME = "__pugmill_community";

export interface CommunitySession {
  memberId: number;
  githubHandle: string;
  githubId: string;
}

/**
 * Read the community session cookie, verify the JWT, and return the full
 * member row from the DB. Returns null on any failure (missing cookie,
 * invalid signature, expired token, member not found).
 */
export async function getCommunityUser(): Promise<
  (typeof pluginCommunityMembers.$inferSelect) | null
> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, SECRET);
    const memberId = payload.memberId as number | undefined;
    if (!memberId) return null;

    const rows = await db
      .select()
      .from(pluginCommunityMembers)
      .where(eq(pluginCommunityMembers.id, memberId))
      .limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Sign a JWT for the given community session and return the token string.
 * The caller is responsible for setting it as an httpOnly cookie on the response.
 */
export async function createSessionToken(session: CommunitySession): Promise<string> {
  return new SignJWT({
    memberId: session.memberId,
    githubHandle: session.githubHandle,
    githubId: session.githubId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
}

/**
 * Delete the community session cookie.
 */
export async function clearCommunitySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
