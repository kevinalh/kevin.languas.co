import { addAlbumLinks } from "./albumLinks";
import { getStarredRepositories } from "./github";
import { getListeningStats, getTopAlbums } from "./lastfm";

let pageData: ReturnType<typeof load> | undefined;

async function load() {
  const [topAlbums, listeningStats, repositories] = await Promise.all([
    getTopAlbums(),
    getListeningStats(),
    getStarredRepositories(),
  ]);
  // Treat empty lists like missing data, so callers only check for null.
  return {
    topAlbums: topAlbums?.length ? await addAlbumLinks(topAlbums) : null,
    listeningStats,
    repositories: repositories?.length ? repositories : null,
  };
}

/**
 * The Last.fm and GitHub data shown on the homepage. Fetched once per build
 * and shared by the HTML page and its Markdown version. A section without
 * data is `null` and is left out.
 */
export function getPageData() {
  return (pageData ??= load());
}
