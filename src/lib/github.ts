import { strictFetch } from "./strict";
import type { StarredRepository } from "./types";

/**
 * Fetches the viewer's starred repositories through the GitHub GraphQL API.
 *
 * This is called at build time. If no token is configured or the request
 * fails, `null` is returned so the page can render a fallback instead of
 * failing the whole build, unless strict fetching is enabled (see strict.ts).
 */
const STARRED_REPOSITORIES_QUERY = `
  query StarredRepositories($first: Int!) {
    viewer {
      starredRepositories(
        orderBy: { field: STARRED_AT, direction: DESC }
        first: $first
      ) {
        totalCount
        edges {
          starredAt
          node {
            name
            nameWithOwner
            createdAt
            description
            url
            stargazerCount
            primaryLanguage {
              name
              color
            }
          }
        }
      }
    }
  }
`;

interface GitHubGraphQLResponse {
  data?: {
    viewer?: {
      starredRepositories?: {
        edges?: StarredRepository[] | null;
      };
    };
  };
  errors?: Array<{ message: string }>;
}

export async function getStarredRepositories(
  first = 10,
): Promise<
  StarredRepository[] | null
> {
  const token = import.meta.env.GITHUB_ACCESS_TOKEN;

  if (!token) {
    if (strictFetch) {
      throw new Error("GITHUB_ACCESS_TOKEN must be set for strict builds.");
    }
    console.warn(
      "GITHUB_ACCESS_TOKEN is not set; skipping the GitHub repository fetch.",
    );
    return null;
  }

  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "kevin.languas.co",
      },
      body: JSON.stringify({
        query: STARRED_REPOSITORIES_QUERY,
        variables: { first },
      }),
    });

    if (!response.ok) {
      throw new Error(`request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as GitHubGraphQLResponse;

    if (payload.errors?.length) {
      throw new Error(payload.errors.map((error) => error.message).join(", "));
    }

    return payload.data?.viewer?.starredRepositories?.edges ?? null;
  } catch (error) {
    if (strictFetch) {
      throw error;
    }
    console.error("Failed to fetch starred repositories from GitHub:", error);
    return null;
  }
}
