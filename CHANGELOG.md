# Changelog

## 0.2.1

### Bug fixes

- **OAuth `redirect_uri` mismatch behind proxies.** The `/api/community/auth/github` and `/api/community/auth/callback` routes now prefer the `PRODUCTION_URL` environment variable when constructing the GitHub `redirect_uri`, falling back to the request origin only when unset. On hosted platforms with a reverse proxy (Replit autoscale, Cloud Run, Vercel preview deployments, etc.), `request.url` can report an internal hostname instead of the public custom domain — that mismatch caused GitHub to reject sign-in with `redirect_uri is not associated with this application`.
- **Production build resolution failures.** All plugin files (`plugins/community/index.ts`, `schema.ts`, `AdminPage.tsx`, `actions/recipes.ts`) now import shared Pugmill modules via the `@/` path alias instead of relative `../../src/lib/...` paths. The relative paths worked in `next dev` but the production Next.js build could not resolve them, causing `npm run build` to fail with "module cannot be found" errors during deployment.

### Accessibility

- **Admin page contrast in dark mode.** Code-style chips, the "Apply navigation" button, the success status text, and the OAuth-not-configured warning callout now meet WCAG AA contrast (≥8:1 where readable as body text) when the Pugmill admin shell is in dark mode. Previously these elements rendered as dark-on-dark or low-contrast and were difficult to read.
- **Dark mode warning callout.** The amber "Add these to your .env.local" callout now has explicit `dark:` Tailwind variants so it remains readable on dark admin backgrounds.

### Documentation

- Clarified in `RECIPE.md` that step 7 (server restart) is **required**, not optional, and explained why (`loadPlugins()` per-process cache).
- Added `PRODUCTION_URL` to the environment variables reference with guidance on when it's required.
- Admin page OAuth-not-configured warning now mentions platform secret stores (Replit Secrets, Vercel env vars) alongside `.env.local`.

### Removed

- The `NEXTAUTH_URL` environment variable is no longer consulted by the OAuth routes. Use `PRODUCTION_URL` instead. (`NEXTAUTH_URL` was removed in pre-0.2.0 development but had not been documented as deprecated.)

---

## 0.2.0

Initial public release.

- 8 database tables prefixed `plugin_community_*`
- Public routes at `/recipes`, `/recipes/submit`, `/recipes/{owner}/{slug}`, `/community/account`
- GitHub OAuth at `/api/community/auth/{github,callback,signout}`
- Download tracking at `/api/community/download/{id}`
- Admin plugin page at `/admin/plugins/community`
- Shared auth library at `src/lib/community-auth.ts`
- GitHub access tokens encrypted at rest via `@/lib/encrypt` when `AI_ENCRYPTION_KEY` is set
