import { getStarredRepositories } from "./github";
import { getTopAlbums } from "./lastfm";

let pageData: ReturnType<typeof load> | undefined;

async function load() {
  const [topAlbums, repositories] = await Promise.all([
    getTopAlbums(),
    getStarredRepositories(),
  ]);
  return { topAlbums, repositories };
}

/**
 * The Last.fm and GitHub data shown on the homepage. Fetched once per build
 * and shared by the HTML page and its Markdown version.
 */
export function getPageData() {
  return (pageData ??= load());
}
