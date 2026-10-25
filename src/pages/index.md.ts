import type { APIRoute } from "astro";
import { rawContent as bio } from "@/content/bio.md";
import { getPageData } from "@/lib/data";
import { formatPlays, LASTFM_PROFILE_URL } from "@/lib/lastfm";
import { EMAIL, GITHUB_STARS_URL, profileLinks } from "@/lib/links";
import { builtAtLabel, DESCRIPTION, NAME } from "@/lib/site";

/** Escapes text from the APIs so it can't be read as Markdown syntax. */
function escape(text: string): string {
  return text.replace(/\s+/g, " ").trim().replace(/[\\`*_[\]<>#|]/g, "\\$&");
}

/** Percent-encodes parentheses, which can end a Markdown link URL early. */
function href(url: string): string {
  return url.replaceAll("(", "%28").replaceAll(")", "%29");
}

/** The homepage as Markdown, for agents and other non-browser readers. */
export const GET: APIRoute = async () => {
  const { topAlbums, repositories } = await getPageData();
  const sections = [`# ${NAME}`, DESCRIPTION, bio().trim()];

  if (topAlbums) {
    sections.push(
      "## Recently listening",
      `My most played albums this week, via [Last.fm](${LASTFM_PROFILE_URL}).`,
      topAlbums
        .map(
          (album, index) =>
            `${index + 1}. [${escape(album.name)}](${href(album.wikipediaUrl ?? album.url)}) · ${escape(album.artist)} (${formatPlays(album.playcount)})${album.listenUrl ? ` · [listen](${href(album.listenUrl)})` : ""}`,
        )
        .join("\n"),
    );
  }

  if (repositories) {
    sections.push(
      "## Recently starred",
      `Repositories I've starred on GitHub lately. [See all](${GITHUB_STARS_URL}).`,
      repositories
        .map(({ node }) => {
          const details = [
            node.description && escape(node.description),
            node.primaryLanguage && escape(node.primaryLanguage.name),
            `★ ${node.stargazerCount}`,
          ].filter(Boolean);
          return `- [${escape(node.nameWithOwner)}](${href(node.url)}): ${details.join(" · ")}`;
        })
        .join("\n"),
    );
  }

  sections.push(
    "## Links",
    [
      ...profileLinks.map((link) => `- [${link.label}](${link.href})`),
      `- [Email](mailto:${EMAIL})`,
    ].join("\n"),
    `Last updated ${builtAtLabel}.`,
  );

  return new Response(`${sections.join("\n\n")}\n`, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
};
