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
as static assets (see `wrangler.jsonc`). The `Deploy` GitHub Actions workflow
deploys on every push to `main` and every 6 hours, so `/github` stays fresh, and
uploads a preview version for each pull request. In CI, a failed GitHub fetch
fails the build, so the last good deploy stays live.

The workflow needs these repository secrets:

| Secret | Purpose |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | API token with the "Edit Cloudflare Workers" template permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `GH_STARS_TOKEN` | GitHub token passed to the build as `GITHUB_ACCESS_TOKEN` |
