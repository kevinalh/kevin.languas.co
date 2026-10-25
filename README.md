# Personal website

This is a small personal website made after I realized I could buy a cool domain name.
Pretty standard in terms of content.

The first version was made by hand many years ago using Next.js. It got out of date so
one day I got Claude to re-make it using [Astro](https://astro.build/), since doing
that is trivial now.

Fair warning: The rest of this README is AI slop.

## Development

Dependencies are managed with [pnpm](https://pnpm.io/), and the Node.js/pnpm
versions are pinned in `mise.toml`. After installing dependencies:

```bash
pnpm install
pnpm dev
```

Other useful scripts:

```bash
pnpm build       # build the static site into dist/
pnpm preview     # preview the production build locally
pnpm cf:preview  # build and serve dist/ with Wrangler, as Cloudflare would
pnpm check       # type-check .astro files
```

The site is a single page. Two of its sections are filled with data fetched at
build time (see `.env.example`), and each is left out when its key is missing:

- "Recently listening" shows the week's top albums from Last.fm, using
  `LASTFM_API_KEY`.
- "Recently starred" shows the latest starred repositories from the GitHub
  GraphQL API, using `GITHUB_ACCESS_TOKEN`. The old `/github` page redirects to
  the homepage (see `public/_redirects`).

The bio is written in Markdown in `src/content/bio.md`. Besides the HTML page,
the build writes a Markdown version of the whole page to `/index.md` (see
`src/pages/index.md.ts`) for agents and other non-browser readers.

The link preview image, `public/og.png`, is static. Regenerate it with
`node scripts/og-image.mjs` when the name, role, or avatar changes.

The site is hosted on [Cloudflare Workers](https://developers.cloudflare.com/workers/static-assets/)
as static assets (see `wrangler.jsonc`), built and deployed by
[Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) on every
push to `main`, with preview builds for other branches. No Cloudflare API token
is stored anywhere outside Cloudflare.

To keep that data fresh, the small Worker in `worker/index.ts` runs on a cron
every 6 hours and calls a Workers Builds
[Deploy Hook](https://developers.cloudflare.com/workers/ci-cd/builds/deploy-hooks/),
which rebuilds the site. Builds set `STRICT_FETCH=true`, so a failed fetch
fails the build and the last good deploy stays live.

Configuration that lives in the Cloudflare dashboard:

| Where | Setting | Value |
| --- | --- | --- |
| Settings → Build | Build command | `pnpm install --frozen-lockfile && pnpm check && pnpm build` |
| Settings → Build | Deploy command | `pnpm exec wrangler deploy` |
| Settings → Build → Variables and secrets | `GITHUB_ACCESS_TOKEN` (secret) | Fine-grained GitHub PAT: public repositories read-only, "Starring" read |
| Settings → Build → Variables and secrets | `LASTFM_API_KEY` (secret) | Last.fm API key |
| Settings → Build → Variables and secrets | `STRICT_FETCH` | `true` |
| Settings → Build → Variables and secrets | `SKIP_DEPENDENCY_INSTALL` | `true` (the build command installs strictly from the lockfile instead) |
| Settings → Variables & Secrets (runtime) | `DEPLOY_HOOK_URL` (secret) | The Deploy Hook URL for `main` |
