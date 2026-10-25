# Migration Plan: Next.js → Astro, Yarn → pnpm, Chakra UI → Tailwind

Status: proposal (decisions locked)
Scope: `kevinalh/kevin.languas.co` (personal site, last touched ~2021)
Versions checked against npm at time of writing: Astro `7.3.2`, `@astrojs/sitemap` `3.7.4`,
Tailwind `4.3.3`, pnpm `12.4.1`, Node `26.8.2` (newest available).

---

## 0. Locked decisions

| # | Decision |
| --- | --- |
| 1 | **Drop React entirely.** Raw Astro, no `@astrojs/react`, no Emotion, no framer-motion. |
| 2 | **Tailwind CSS v4** for styling. |
| 3 | **Delete light/dark mode** for now (single light theme), including the toggle and color-mode plumbing. |
| 4 | **Deployment-agnostic.** Keep Vercel only as the interim host; no Vercel-specific features. GitHub data freshness / ISR is **deferred** and will be reworked later. |
| 5 | Node to latest available (see note). |

> **Node version note:** Node **27 does not exist yet** — the newest release is `v26.8.2`
> (2026-09-09); Node majors ship in October, so 27 lands ~Oct 2026. Astro 7 only requires
> `>=22.12.0`. Decision: target **Node 26** now and bump to 27 when it ships. Note that 26 is a
> current/non-LTS line — if CI stability ever becomes a concern, drop to 24 LTS, which is a
> one-line change.

---

## 1. Current state (inventory)

| Area | Today |
| --- | --- |
| Framework | Next.js `^11.1.3`, React `^17`, pages router |
| Styling | Chakra UI `^1.8`, Emotion, `framer-motion`; light/dark via Chakra color mode |
| Data | `@apollo/client` + `graphql` → GitHub GraphQL, `getStaticProps` + ISR `revalidate: 1800` |
| Images | `next/image`, remote domains in `next.config.js` |
| Package manager | Yarn 3 (PnP), committed `.yarn/` releases/plugins/sdks |
| Runtime | Node `14.17.6` (`mise.toml`), yarn `1.22.11` |
| SEO | `next-sitemap`, hand-written `public/robots.txt`, JSON-LD via `schema-dts` |
| Deploy | Vercel, `vercel.json` with a catch-all `Cache-Control` header |

Files that matter (everything under `src/` is ~11 small files):

```
src/pages/{_app,_document,index,github}.tsx
src/common/chakra.tsx            # Chakra SSR color-mode manager (the FOUC workaround)
src/common/theme.ts              # Chakra theme (initialColorMode: light)
src/common/graphql.ts            # Apollo client + auth-link facade
src/common/constants.ts          # DEFAULT_REVALIDATION_TIME = 1800
src/common/components/{layout,image}.tsx
src/common/components/navigation/{navigation,desktop-nav,mobile-nav,interfaces}.tsx
src/modules/profile/services/github.ts   # starredRepositories query
src/styles/globals.css
```

External contract to preserve: routes `/` and `/github`, GitHub avatar + starred-repo cards,
JSON-LD `Person`, sitemap/robots. Deliberately **not** preserving: light/dark toggle, ISR
freshness (deferred).

---

## 2. Recommended order (and why)

```
Phase 0  Safety net (branch, screenshots, baseline)
Phase 1  Runtime + tooling baseline (Node 26, mise)
Phase 2  Yarn 3 → pnpm                          <-- do this FIRST
Phase 3  Astro scaffold, static output
Phase 4  Port layout/pages; remove Chakra/React/dark-mode  <-- together
Phase 5  Data layer (fetch instead of Apollo)
Phase 6  Images, SEO, sitemap, 404
Phase 7  Interim deploy (plain static)
Phase 8  Cleanup, docs, optional lint
```

**Why pnpm before Astro:** the package-manager swap is mechanical and independent of the
rewrite. Doing it on the current, known-working app isolates tooling failures from framework
failures. The only cost is regenerating the lockfile twice (trivial).

**Why Chakra removal and the Astro port happen together:** Chakra requires React, and we're
going raw Astro with zero React. Rewriting Chakra components to CSS while still in Next.js
would be throwaway work. Port them once, directly to `.astro`.

---

## 3. Phase details

### Phase 0 — Safety net

- Create branch + tag: `git switch -c migrate/astro && git tag pre-migration`.
- Capture current behavior for parity checks: full-page screenshots of `/` and `/github` at
  mobile (~390px) and desktop (~1440px). Dark mode is being dropped, so only capture light.
- Save the live `sitemap.xml`, `robots.txt`, and the JSON-LD block from `/`.
- Note current Lighthouse numbers (the site is tiny; expect far fewer bytes after).
- Confirm `GITHUB_ACCESS_TOKEN` is available where the build runs, and locally in `.env`.

**Verify:** baseline artifacts stored somewhere you can diff against.

### Phase 1 — Runtime + tooling baseline

- `mise.toml`: replace the Node 14 + yarn entries with:

  ```toml
  [tools]
  nodejs = "26"
  pnpm = "12"
  ```

  (Bump `nodejs` to `27` once it ships; nothing else needs to change.)
- Confirm the committed `.tool-versions` deletion is intentional (already staged).
- Keep `.envrc` (direnv) as-is; it just sources `.env`.

### Phase 2 — Yarn 3 → pnpm

Delete / stop tracking Yarn-specific files:

```
.yarn/            # releases, plugins, sdks
.yarnrc.yml
yarn.lock
```

Edit:

- `package.json`: remove `"packageManager": "yarn@3.1.1"`; set it via `corepack use pnpm@12`
  (or let `pnpm` write it). Add the build-script allowlist below.
- `.gitattributes`: remove the two `/.yarn/** binary` lines.
- `.gitignore`: remove the `### yarn ###` block; keep the generic Node entries.
- `README.md`: update the development section (see Phase 8).

pnpm 10+ blocks lifecycle scripts by default. Astro's image service uses `sharp`, which needs
its install script:

```jsonc
// package.json
"pnpm": {
  "onlyBuiltDependencies": ["sharp"]
}
```

Or run `pnpm approve-builds` once after install.

**Verify:**

```bash
corepack enable
pnpm install
pnpm dev      # site loads on Next.js
pnpm build    # succeeds
```

**Rollback:** `git checkout -- . && yarn install` restores PnP.

### Phase 3 — Astro scaffold, static output

Scaffold in place (or scaffold in a temp dir and copy):

```bash
pnpm dlx create-astro@latest .
```

Dependencies to **remove**:

```
next  next-sitemap  eslint-config-next
@chakra-ui/icons  @chakra-ui/portal  @chakra-ui/react  @chakra-ui/react-env  @chakra-ui/system
@emotion/react  @emotion/styled  framer-motion
@apollo/client  graphql
react  react-dom  @types/react
@types/sharp  @types/node(16)  typescript(4.5)  eslint(7)
```

Dependencies to **add**:

```
astro@7
@astrojs/sitemap@3
tailwindcss@4  @tailwindcss/vite
# sharp is an optionalDependency of astro already; pin it if you prefer
# schema-dts (dev, optional) if you want JSON-LD typing
```

Note: **no adapter and no `@astrojs/vercel`.** Default `output: 'static'` keeps the build
portable to any host (Netlify, Cloudflare Pages, GitHub Pages, S3, a VPS).

`astro.config.mjs`:

```js
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://kevin.languas.co",
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
  image: {
    domains: ["avatars.githubusercontent.com", "repository-images.githubusercontent.com"],
  },
});
```

`tsconfig.json` (replace the Next base):

```jsonc
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

Delete `next.config.js`, `next-sitemap.js`, `next-env.d.ts`, `.eslintrc.json` (until Phase 8).

**Verify:** `pnpm astro sync && pnpm astro check` (add a `check` script) and
`pnpm build && pnpm preview` shows the Astro starter.

### Phase 4 — Port layout & pages; remove Chakra, React, and dark mode

New structure:

```
src/layouts/BaseLayout.astro          <- replaces _app.tsx + _document.tsx
src/components/Nav.astro              <- replaces navigation/*
src/components/RepositoryCard.astro   <- replaces the inline card in github.tsx
src/lib/{constants,github,types}.ts   <- replaces common/* + modules/*
src/pages/index.astro                 <- port of index.tsx
src/pages/github.astro                <- port of github.tsx
src/pages/404.astro
src/styles/global.css                 <- from styles/globals.css
```

Porting rules:

- Chakra layout props → Tailwind classes: `m={[45,50,100]}` → responsive `mx-*`,
  `Box`/`Flex`/`Stack`/`VStack`/`HStack` → `div`/`flex`.
- Chakra `Link` and `next/link` → plain `<a href>`. Astro's default `prefetch` can be enabled
  for near-instant navigation if desired.
- `<Head>` → markup directly in `BaseLayout.astro`'s `<head>`, fed by props
  (`title`, `description`, `keywords`) or a `<slot name="head">`.
- JSON-LD: `<script type="application/ld+json" set:html={JSON.stringify(ldSchema)} />`.
- **Delete `chakra.tsx`, `theme.ts`, `_document.tsx`'s ColorModeScript, and the CSS-variable
  theming.** No dark mode at all — one light palette in `global.css` / Tailwind theme.
- **Remove the theme toggle** and the `MoonIcon`/`SunIcon`/`useColorMode` logic from the nav.
- Icons (`StarIcon`, `HamburgerIcon`, etc.): use small inline SVGs. With dark mode and the
  mobile collapse gone, the nav barely needs any JS.

**Nav simplification opportunity:** the current nav has device-specific dynamic imports,
popovers, a collapse, and a color toggle — all for a *single* nav item ("GitHub Stars"). Replace
with a plain `<nav>` containing the site title and that one link. This is the main reason the
client bundle can shrink to ~0 KB.

**Verify:** `/` and `/github` match the Phase-0 light-mode screenshots at both breakpoints;
`view-source` shows server-rendered HTML; no client JS beyond Astro's defaults; nav works.

### Phase 5 — Data layer: Apollo → `fetch`

`getStarredRepositories()` keeps the same shape; only the transport changes. Delete
`src/common/graphql.ts` and the Apollo deps. The query runs **at build time**, so the token is
needed during build only.

```ts
// src/lib/github.ts
export async function getStarredRepositories() {
  const token = import.meta.env.GITHUB_ACCESS_TOKEN
    ?? process.env.GITHUB_ACCESS_TOKEN;
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "kevin.languas.co",
    },
    body: JSON.stringify({ query: STARRED_REPOSITORIES_QUERY }),
  });
  if (!res.ok) throw new Error(`GitHub GraphQL ${res.status}`);
  const { data } = await res.json();
  return data.viewer.starredRepositories.edges as RepositoryEdge[];
}
```

- Replace the `@octokit/graphql-schema` `User` type with a small local `types.ts`
  (or keep the dev dep if you value generated types).
- Consider Astro's `astro:env` schema to validate the secret at build start instead of ad-hoc
  `process.env` reads.
- Keep the existing null/empty handling and the "Couldn't load the repositories!" fallback so a
  bad token doesn't fail the whole build. Consider rendering the page even if the fetch fails.
- `DEFAULT_REVALIDATION_TIME` is no longer used by anything — drop it (or keep it as a marker
  for the deferred freshness work).

> **Deferred — GitHub freshness.** Today the list refreshes via ISR every 30 min. With static
> output it is frozen at build time. We are explicitly punting this: rebuild manually, add a
> scheduled rebuild (cron/CI) later, or move to on-demand rendering once the new host is
> chosen. No Vercel-specific ISR work now.

**Verify:** `/github` renders 30 starred repos; unset the token and confirm a graceful
fallback; confirm the token is **not** present in emitted HTML or client JS.

### Phase 6 — Images, SEO, sitemap, 404

- Use `astro:assets` for the avatar:

  ```astro
  ---
  import { Image } from "astro:assets";
  ---
  <Image src={avatarUrl} width={200} height={200} alt="Kevin Languasco" />
  ```

- **Repo preview images are the riskiest bit.** `openGraphImageUrl` is a dynamic remote URL
  and can 404 for some repos, which can fail a build. The cards render it in a fixed 5em box
  anyway, so use a plain `<img loading="lazy" width={80} height={80}>` for repo cards (no
  build-time fetch) and reserve `<Image>` for the avatar.
- `public/sitemap.xml` is stale (dated 2021) — **delete it**; `@astrojs/sitemap` generates
  `sitemap-index.xml` + `sitemap-0.xml`. Update `public/robots.txt`:
  `Sitemap: https://kevin.languas.co/sitemap-index.xml`.
- Move the JSON-LD `Person` block from `index.tsx` into `index.astro`.
- Add `src/pages/404.astro`.
- **Remove the catch-all `Cache-Control` header from `vercel.json`** (it predates Astro's
  hashed, immutable assets and would hurt caching). Since we're leaving Vercel, reduce
  `vercel.json` to the minimum or delete it entirely.

**Verify:** build output contains sitemap files and a 404; JSON-LD validates; images load
without layout shift; `pnpm preview` routes `/nope` to 404.

### Phase 7 — Interim deploy

- Keep deploying to Vercel for now, but as a **plain static site**: no adapter, no ISR, no
  custom cache headers. Commit `pnpm-lock.yaml`, ensure `yarn.lock` is gone so Vercel picks
  pnpm, and set `GITHUB_ACCESS_TOKEN` for the build environment.
- Because the output is plain static, switching hosts later is a non-event: point any static
  host at `dist/`, or add the appropriate adapter when you decide.

**Verify:** preview + production deploys; `/`, `/github`, sitemap, and 404 all correct.

### Phase 8 — Cleanup, docs, optional lint

- `README.md`: Astro + pnpm instructions; remove the ZipFS/VSCode PnP section; delete the
  "Chakra UI / Next.js" tech blurb.
- Remove leftover Yarn ignore rules and PnP docs.
- Optional: adopt Biome (or a flat `eslint-plugin-astro` config) to replace `.eslintrc.json`.
- Add scripts: `"check": "astro check"`, `"preview": "astro preview"`, and a `format` script
  if using Biome.
- Consider a lightweight CI workflow (`pnpm install && pnpm check && pnpm build`); there are
  no tests today.

---

## 4. File-by-file mapping

| Old | New |
| --- | --- |
| `src/pages/_app.tsx`, `_document.tsx` | `src/layouts/BaseLayout.astro` |
| `src/common/chakra.tsx`, `theme.ts` | **deleted** (no color mode) |
| `src/common/components/layout.tsx` | absorbed into `BaseLayout.astro` |
| `src/common/components/image.tsx` | `astro:assets` `<Image>` inline (no wrapper) |
| `src/common/components/navigation/*` | `src/components/Nav.astro` (no toggle) |
| `src/common/constants.ts` | `src/lib/constants.ts` (or dropped with the ISR constant) |
| `src/common/graphql.ts` | **deleted** (replaced by `src/lib/github.ts`) |
| `src/modules/profile/services/github.ts` | `src/lib/github.ts` |
| `src/pages/index.tsx` | `src/pages/index.astro` |
| `src/pages/github.tsx` | `src/pages/github.astro` + `RepositoryCard.astro` |
| `src/styles/globals.css` | `src/styles/global.css` |
| `next.config.js` | `astro.config.mjs` |
| `next-sitemap.js` | `@astrojs/sitemap` integration |
| `public/sitemap.xml` (stale) | generated `sitemap-index.xml` |
| `.yarn/`, `.yarnrc.yml`, `yarn.lock` | `pnpm-lock.yaml`, `.npmrc` |
| `vercel.json` | minimal / deleted |
| `.eslintrc.json` | Biome or `eslint-plugin-astro` (optional) |

---

## 5. Risk register

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Remote repo images 404 and fail the build | Medium | High | Plain `<img>` for repo cards with fixed dimensions |
| `GITHUB_ACCESS_TOKEN` missing/expired at build | Medium | Medium | Graceful fallback UI; validate with `astro:env`; document env |
| pnpm 10+ blocks `sharp` postinstall | Medium | Medium | `pnpm.onlyBuiltDependencies: ["sharp"]` / `pnpm approve-builds` |
| Yarn PnP phantom deps surface under pnpm | Low | Low | Tiny app; rewrite drops most deps anyway |
| SEO regression (canonical/trailing slash/sitemap path) | Medium | Medium | Set `site`; compare sitemap output; update `robots.txt` |
| Hosting picks the wrong package manager | Low | Medium | Commit `pnpm-lock.yaml`, delete `yarn.lock`, set commands if needed |
| Build-time data becomes stale (vs old ISR) | Certain | Low | **Accepted/deferred**; rebuild or add scheduling later |

---

## 6. Rough effort

| Phase | Estimate |
| --- | --- |
| 0–1 Safety net + runtime | 0.5–1 h |
| 2 pnpm migration | 1–2 h |
| 3 Astro scaffold | 1–2 h |
| 4 Layout/pages + Chakra/React/dark-mode removal | 3–6 h |
| 5 Data layer | 1–2 h |
| 6 Images/SEO/sitemap/404 | 1–3 h |
| 7 Interim deploy | 0.5–1 h |
| 8 Cleanup/docs | 1 h |
| **Total** | **~1–1.5 focused days** |

Removing dark mode and skipping the Vercel adapter trims roughly half a day versus the
original proposal.

---

## 7. Open questions

1. Keep `schema-dts` for JSON-LD typing, or inline the object untyped?
2. Adopt Biome now, or keep linting out of scope for this migration?
3. Strict 1:1 visual parity, or any tweaks while porting?

---

## 8. Implementation notes (what shipped)

This section records how the implementation differed from the plan above.

**Deviations from the plan**

- **pnpm 12 ignores the `pnpm` field in `package.json`.** The build-script allowlist
  (`onlyBuiltDependencies`) moved to `pnpm-workspace.yaml`, and pnpm 12's actual key is
  `allowBuilds`. The shipped file is:

  ```yaml
  allowBuilds:
    esbuild: true
    sharp: true
  ```

- **`sharp` had to become a direct devDependency.** Astro lists it as an optional dependency,
  but under pnpm's strict `node_modules` layout the build could not resolve it, so
  `astro:assets` failed with `MissingSharp`. Adding it explicitly fixed image optimization.
- **TypeScript pinned to `^6.0.3`, not 7.** `@astrojs/check` peers `typescript: ^5.0.0 || ^6.0.0`,
  so the current TypeScript 7 release is not yet supported by `astro check`.
- **No `.npmrc`** was needed; `pnpm-workspace.yaml` is the only new config file.
- **`vercel.json` was deleted entirely** rather than reduced, since the static build needs no
  host-specific configuration.

**Decisions resolved during implementation**

- Kept `schema-dts` for JSON-LD typing (open question 1).
- Did **not** add Biome; linting remains out of scope (open question 2).
- Avatar uses `astro:assets` `<Image loading="eager">` and is optimized to WebP at build time.
  Repo preview images deliberately use a plain `<img loading="lazy">` to avoid build failures on
  flaky `openGraphImageUrl` values.
- Added `src/env.d.ts` (typed `GITHUB_ACCESS_TOKEN`) and `.env.example`.

**Verification performed**

- `pnpm check` → 11 files, 0 errors, 0 warnings, 0 hints.
- `pnpm build` → 3 pages (`/`, `/github`, `/404`), avatar optimized 41 kB → 10 kB WebP,
  `sitemap-index.xml` + `sitemap-0.xml` generated.
- Verified `GITHUB_ACCESS_TOKEN` is read from the environment at build time (a dummy token
  produced a GitHub 401 instead of the "not set" fallback).
- `pnpm preview` routing → `/` 200, `/github` 200, `/github/` 200, `/nope` 404.
- `dist/` contains **no client JS** and no Chakra/Emotion/framer-motion/Next.js references.

---

## 9. Cloudflare hosting (follow-up)

Resolves decision 4: the host is **Cloudflare Workers static assets**, deployed with
**Wrangler** (not the `cf` CLI, which is still in open beta; revisit with `cf migrate`
once it is stable). No Astro adapter; the build stays fully static.

- `wrangler.jsonc`: assets from `./dist`, `drop-trailing-slash`, `404-page`, custom
  domain `kevin.languas.co` (the zone and registrar are on Cloudflare).
- Astro now uses `build.format: "file"` + `trailingSlash: "never"` so `/github` is served
  without a trailing slash, matching the old Next.js URLs; canonical tags and the sitemap
  follow.
- `public/_headers` marks `/_astro/*` as immutable.
- **Builds run on Workers Builds**, not GitHub Actions, so no Cloudflare API token exists
  outside Cloudflare (Cloudflare has no native GitHub OIDC trust yet, and community OIDC
  brokers still need a token-minting credential themselves).
- **Freshness:** `worker/index.ts` has a Cron Trigger (`0 */6 * * *`) that POSTs to a
  Workers Builds Deploy Hook (URL stored as the `DEPLOY_HOOK_URL` Worker secret). This
  replaces ISR and avoids GitHub disabling scheduled workflows in idle public repos. Its
  `fetch` handler only forwards unmatched requests to `env.ASSETS` for the 404 page.
- `getStarredRepositories()` throws when `GITHUB_FETCH_STRICT=true` (a build variable), so a
  failed scheduled rebuild never replaces a good `/github` with the fallback.
- The GitHub token is a fine-grained PAT (public repos read-only, "Starring" read), stored
  as a Workers Builds secret.
- `.node-version` pins Node 26 for Workers Builds; `pnpm` comes from `packageManager`.
  Keep it in sync with `mise.toml`.

## 10. Security hardening (follow-up)

- History scanned with gitleaks and trufflehog: no secrets (only false positives in the
  bundled Yarn release and `yarn.lock` integrity hashes).
- Dependencies updated (astro 7.4.2, sharp 0.35.5, @astrojs/check 0.9.12) and pnpm bumped
  to 12.15.0; `pnpm audit` is clean. An `overrides` entry patches the `undici` pinned by
  miniflare; remove it once wrangler ships a fixed version.
- `pnpm-workspace.yaml` adds `strictDepBuilds` and `trustPolicy: no-downgrade` on top of
  pnpm 12's defaults (`minimumReleaseAge` 1 day, `blockExoticSubdeps`).
- Workers Builds installs with `--frozen-lockfile` (`SKIP_DEPENDENCY_INSTALL=true` plus an
  explicit install in the build command).
- `public/_headers` sets a strict CSP (the site ships no JavaScript), `nosniff`,
  `Referrer-Policy`, and `Permissions-Policy`.
