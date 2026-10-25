// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://kevin.languas.co",
  // Emit `github.html` instead of `github/index.html` so pages are served
  // without a trailing slash, matching the URLs of the old Next.js site.
  trailingSlash: "never",
  build: {
    format: "file",
  },
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  image: {
    domains: [
      "avatars.githubusercontent.com",
      "repository-images.githubusercontent.com",
    ],
  },
});
