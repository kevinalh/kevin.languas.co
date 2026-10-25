/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly GITHUB_ACCESS_TOKEN?: string;
  readonly GITHUB_FETCH_STRICT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
