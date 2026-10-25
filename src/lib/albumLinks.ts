import type { AlbumListenLink, TopAlbum } from "./lastfm";
import { USER_AGENT } from "./strict";

/**
 * Finds better destinations for each album than its Last.fm page: the English
 * Wikipedia article and the Spotify album, both through MusicBrainz (and
 * Wikidata), or else a song.link page found through the iTunes Search API.
 * The lookups are best-effort: an album without a match keeps its Last.fm
 * link, and failures never fail the build.
 */
export async function addAlbumLinks(albums: TopAlbum[]): Promise<TopAlbum[]> {
  // The two lookups use different services, so they run side by side. Each
  // looks up one album at a time to stay within its service's rate limits.
  const [musicBrainzLinks, songLinkUrls] = await Promise.all([
    findEach(albums, findMusicBrainzLinks),
    findEach(albums, findSongLinkUrl),
  ]);
  return albums.map((album, index) => {
    const { wikipediaUrl, spotifyUrl } = musicBrainzLinks[index] ?? {};
    const songLinkUrl = songLinkUrls[index];
    let listen: AlbumListenLink | undefined;
    if (spotifyUrl) {
      listen = { url: spotifyUrl, service: "Spotify" };
    } else if (songLinkUrl) {
      listen = { url: songLinkUrl, service: "your streaming service" };
    }
    return { ...album, wikipediaUrl, listen };
  });
}

async function findEach<T>(
  albums: TopAlbum[],
  find: (album: TopAlbum) => Promise<T | undefined>,
): Promise<Array<T | undefined>> {
  const results = [];
  for (const album of albums) {
    try {
      results.push(await find(album));
    } catch (error) {
      console.warn(
        `Album link lookup failed for "${album.name}":`,
        error instanceof Error ? error.message : error,
      );
      results.push(undefined);
    }
  }
  return results;
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

async function getJson<T>(url: URL): Promise<T> {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) {
    throw new Error(`${url.hostname} returned ${response.status}`);
  }
  return (await response.json()) as T;
}

// MusicBrainz asks for a contact URL in the user agent and at most one request
// per second.
const MUSICBRAINZ_USER_AGENT = `${USER_AGENT} ( https://kevin.languas.co )`;
const MUSICBRAINZ_INTERVAL_MS = 1100;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface UrlRelation {
  type: string;
  url?: { resource: string };
}

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

async function findMusicBrainzLinks(
  album: TopAlbum,
): Promise<{ wikipediaUrl?: string; spotifyUrl?: string }> {
  let releaseGroupId: string | undefined;
  let wikipediaTitle: string | undefined;

  if (album.mbid) {
    const release = await musicBrainz<{ "release-group"?: { id: string } }>(
      `release/${album.mbid}`,
      { inc: "release-groups" },
    );
    releaseGroupId = release?.["release-group"]?.id;
    if (releaseGroupId) {
      wikipediaTitle = await findWikipediaTitle(releaseGroupId);
    }
  }

  // Last.fm's ID can point at an edition without a Wikidata link, or be
  // missing, so fall back to an exact search.
  if (!wikipediaTitle) {
    const searchedId = await searchReleaseGroup(album);
    if (searchedId && searchedId !== releaseGroupId) {
      wikipediaTitle = await findWikipediaTitle(searchedId);
      releaseGroupId ??= searchedId;
    }
  }

  return {
    wikipediaUrl:
      wikipediaTitle &&
      `https://en.wikipedia.org/wiki/${encodeURIComponent(wikipediaTitle.replaceAll(" ", "_"))}`,
    spotifyUrl: releaseGroupId
      ? await findSpotifyUrl(releaseGroupId, album.mbid)
      : undefined,
  };
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
  const releaseGroup = await musicBrainz<{ relations?: UrlRelation[] }>(
    `release-group/${releaseGroupId}`,
    { inc: "url-rels" },
  );
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

/**
 * Finds a Spotify album link among the release group's releases, preferring
 * the release Last.fm reported.
 */
async function findSpotifyUrl(
  releaseGroupId: string,
  preferredReleaseId: string | undefined,
): Promise<string | undefined> {
  const result = await musicBrainz<{
    releases: Array<{ id: string; relations?: UrlRelation[] }>;
  }>("release", { "release-group": releaseGroupId, inc: "url-rels", limit: "100" });
  const releases = result?.releases ?? [];
  const spotifyUrlOf = (release: (typeof releases)[number]) =>
    release.relations
      ?.map((relation) => relation.url?.resource)
      .find((url) => url?.startsWith("https://open.spotify.com/album/"));

  const preferred = releases.find((release) => release.id === preferredReleaseId);
  return (
    (preferred && spotifyUrlOf(preferred)) ??
    releases.map(spotifyUrlOf).find(Boolean)
  );
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
 * reliably than a free-text album search, and links its song.link page.
 */
async function findSongLinkUrl(album: TopAlbum): Promise<string | undefined> {
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
