import type { TopAlbum } from "./lastfm";
import { USER_AGENT } from "./strict";

/**
 * Finds better destinations for each album than its Last.fm page: the English
 * Wikipedia article, through MusicBrainz and Wikidata, and a song.link page
 * that opens the album on any streaming service, through the iTunes Search
 * API. The lookups are best-effort: an album without a match keeps its Last.fm
 * link, and failures never fail the build.
 */
export async function addAlbumLinks(albums: TopAlbum[]): Promise<TopAlbum[]> {
  // The two lookups use different services, so they run side by side. Each
  // looks up one album at a time to stay within its service's rate limits.
  const [wikipediaUrls, listenUrls] = await Promise.all([
    findEach(albums, findWikipediaUrl),
    findEach(albums, findListenUrl),
  ]);
  return albums.map((album, index) => ({
    ...album,
    wikipediaUrl: wikipediaUrls[index],
    listenUrl: listenUrls[index],
  }));
}

async function findEach(
  albums: TopAlbum[],
  find: (album: TopAlbum) => Promise<string | undefined>,
): Promise<Array<string | undefined>> {
  const urls = [];
  for (const album of albums) {
    try {
      urls.push(await find(album));
    } catch (error) {
      console.warn(
        `Album link lookup failed for "${album.name}":`,
        error instanceof Error ? error.message : error,
      );
      urls.push(undefined);
    }
  }
  return urls;
}

/** Normalizes a title for comparison, ignoring case and edition suffixes. */
function normalize(title: string): string {
  return title
    .normalize("NFKC")
    .toLowerCase()
    .replaceAll("’", "'")
    .replace(/\s*[([][^)\]]*(deluxe|remaster|expanded|edition)[^)\]]*[)\]]/g, "")
    .replace(/ - (single|ep)$/, "")
    .trim();
}

// MusicBrainz asks for a contact URL in the user agent and at most one request
// per second.
const MUSICBRAINZ_USER_AGENT = `${USER_AGENT} ( https://kevin.languas.co )`;
const MUSICBRAINZ_INTERVAL_MS = 1100;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Calls the MusicBrainz API, retrying when it's busy. Returns null on 404. */
async function musicBrainz<T>(
  path: string,
  params: Record<string, string>,
): Promise<T | null> {
  const url = new URL(`https://musicbrainz.org/ws/2/${path}`);
  url.search = new URLSearchParams({ ...params, fmt: "json" }).toString();

  for (let attempt = 1; ; attempt++) {
    await sleep(MUSICBRAINZ_INTERVAL_MS);
    const response = await fetch(url, {
      headers: { "User-Agent": MUSICBRAINZ_USER_AGENT },
    });
    if (response.status === 503 && attempt < 3) {
      continue;
    }
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`MusicBrainz returned ${response.status}`);
    }
    return (await response.json()) as T;
  }
}

async function getJson<T>(url: URL): Promise<T> {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) {
    throw new Error(`${url.hostname} returned ${response.status}`);
  }
  return (await response.json()) as T;
}

async function findWikipediaUrl(album: TopAlbum): Promise<string | undefined> {
  let title: string | undefined;
  let releaseGroupId: string | undefined;

  if (album.mbid) {
    const release = await musicBrainz<{ "release-group"?: { id: string } }>(
      `release/${album.mbid}`,
      { inc: "release-groups" },
    );
    releaseGroupId = release?.["release-group"]?.id;
    if (releaseGroupId) {
      title = await findWikipediaTitle(releaseGroupId);
    }
  }

  // Last.fm's ID can point at an edition without a Wikidata link, or be
  // missing, so fall back to an exact search.
  if (!title) {
    const searchedId = await searchReleaseGroup(album);
    if (searchedId && searchedId !== releaseGroupId) {
      title = await findWikipediaTitle(searchedId);
    }
  }

  return (
    title &&
    `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(" ", "_"))}`
  );
}

async function searchReleaseGroup(album: TopAlbum): Promise<string | undefined> {
  const phrase = (text: string) => `"${text.replace(/["\\]/g, "")}"`;
  const result = await musicBrainz<{
    "release-groups"?: Array<{ id: string; title: string; score: number }>;
  }>("release-group", {
    query: `releasegroup:${phrase(album.name)} AND artist:${phrase(album.artist)}`,
    limit: "1",
  });
  const match = result?.["release-groups"]?.[0];
  return match?.score === 100 && normalize(match.title) === normalize(album.name)
    ? match.id
    : undefined;
}

async function findWikipediaTitle(
  releaseGroupId: string,
): Promise<string | undefined> {
  const releaseGroup = await musicBrainz<{
    relations?: Array<{ type: string; url?: { resource: string } }>;
  }>(`release-group/${releaseGroupId}`, { inc: "url-rels" });
  const wikidataUrl = releaseGroup?.relations?.find(
    (relation) => relation.type === "wikidata",
  )?.url?.resource;
  const entityId = wikidataUrl?.split("/").pop();
  if (!entityId) {
    return undefined;
  }

  const entity = await getJson<{
    entities: Record<string, { sitelinks?: { enwiki?: { title: string } } }>;
  }>(new URL(`https://www.wikidata.org/wiki/Special:EntityData/${entityId}.json`));
  return entity.entities[entityId]?.sitelinks?.enwiki?.title;
}

interface ITunesResult {
  wrapperType: string;
  artistId: number;
  artistName: string;
  collectionId?: number;
  collectionName?: string;
}

function iTunes(endpoint: "search" | "lookup", params: Record<string, string>): URL {
  const url = new URL(`https://itunes.apple.com/${endpoint}`);
  url.search = new URLSearchParams(params).toString();
  return url;
}

/**
 * Finds the album in the artist's iTunes catalog, which matches far more
 * reliably than a free-text album search.
 */
async function findListenUrl(album: TopAlbum): Promise<string | undefined> {
  const artists = await getJson<{ results: ITunesResult[] }>(
    iTunes("search", { term: album.artist, entity: "musicArtist", limit: "5" }),
  );
  const artist = artists.results.find(
    (result) => normalize(result.artistName) === normalize(album.artist),
  );
  if (!artist) {
    return undefined;
  }

  const catalog = await getJson<{ results: ITunesResult[] }>(
    iTunes("lookup", { id: String(artist.artistId), entity: "album", limit: "200" }),
  );
  const match = catalog.results.find(
    (result) =>
      result.wrapperType === "collection" &&
      result.collectionName &&
      normalize(result.collectionName) === normalize(album.name),
  );
  return match?.collectionId
    ? `https://album.link/i/${match.collectionId}`
    : undefined;
}
