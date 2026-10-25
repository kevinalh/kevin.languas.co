/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly GITHUB_ACCESS_TOKEN?: string;
  readonly LASTFM_API_KEY?: string;
  readonly STRICT_FETCH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
