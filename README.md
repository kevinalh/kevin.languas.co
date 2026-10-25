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
pnpm build    # build the static site into dist/
pnpm preview  # preview the production build locally
pnpm check    # type-check .astro files
```

The `/github` page reads the viewer's starred repositories from the GitHub
GraphQL API at build time. Set `GITHUB_ACCESS_TOKEN` (see `.env.example`) to
enable it; without a token the page renders a fallback message instead.

Deployment is done by building the static output in `dist/` and serving it from
any static host. Each commit to the `main` branch currently triggers a deploy
process.
