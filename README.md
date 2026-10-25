# Personal website

This is a small personal website made after I realized I could buy a cool domain name. Pretty standard in terms of content.

The technologies used include [Astro](https://astro.build/) and [Tailwind CSS](https://tailwindcss.com/).

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

The `/github` page reads the viewer's starred repositories from the GitHub
GraphQL API at build time. Set `GITHUB_ACCESS_TOKEN` (see `.env.example`) to
enable it; without a token the page renders a fallback message instead.

The site is hosted on [Cloudflare Workers](https://developers.cloudflare.com/workers/static-assets/)
as static assets (see `wrangler.jsonc`), built and deployed by
[Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) on every
push to `main`, with preview builds for other branches. No Cloudflare API token
is stored anywhere outside Cloudflare.

To keep `/github` fresh, the small Worker in `worker/index.ts` runs on a cron
every 6 hours and calls a Workers Builds
[Deploy Hook](https://developers.cloudflare.com/workers/ci-cd/builds/deploy-hooks/),
which rebuilds the site. Builds set `GITHUB_FETCH_STRICT=true`, so a failed
GitHub fetch fails the build and the last good deploy stays live.

Configuration that lives in the Cloudflare dashboard:

| Where | Setting | Value |
| --- | --- | --- |
| Settings → Build | Build command | `pnpm install --frozen-lockfile && pnpm check && pnpm build` |
| Settings → Build | Deploy command | `pnpm exec wrangler deploy` |
| Settings → Build → Variables and secrets | `GITHUB_ACCESS_TOKEN` (secret) | Fine-grained GitHub PAT: public repositories read-only, "Starring" read |
| Settings → Build → Variables and secrets | `GITHUB_FETCH_STRICT` | `true` |
| Settings → Build → Variables and secrets | `SKIP_DEPENDENCY_INSTALL` | `true` (the build command installs strictly from the lockfile instead) |
| Settings → Variables & Secrets (runtime) | `DEPLOY_HOOK_URL` (secret) | The Deploy Hook URL for `main` |
