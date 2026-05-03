import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { decryptString } from "@/lib/encrypt";
import { pluginCommunityMembers } from "../../plugins/community/schema";
import { eq } from "drizzle-orm";

// Fail fast if the session secret is missing. A silent fallback string would
// allow any visitor with knowledge of that string to forge community sessions.
const rawSecret = process.env.COMMUNITY_SESSION_SECRET;
if (!rawSecret || rawSecret.length < 32) {
  throw new Error(
    "COMMUNITY_SESSION_SECRET must be set to a string of at least 32 characters. " +
      "Generate one with: openssl rand -base64 32"
  );
}
const SECRET = new TextEncoder().encode(rawSecret);
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
 *
 * The stored githubAccessToken is decrypted before returning so all callers
 * see plaintext. Encryption at rest is handled in the OAuth callback.
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

    const member = rows[0];
    if (!member) return null;

    if (member.githubAccessToken) {
      member.githubAccessToken = decryptString(member.githubAccessToken);
    }
    return member;
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
