import { buildTimeFetch, USER_AGENT } from "./strict";
import type { StarredRepository } from "./types";

/** How many starred repositories the homepage shows. */
const STARRED_REPOSITORIES_COUNT = 10;

const STARRED_REPOSITORIES_QUERY = `
  query StarredRepositories($first: Int!) {
    viewer {
      starredRepositories(
        orderBy: { field: STARRED_AT, direction: DESC }
        first: $first
      ) {
        edges {
          node {
            nameWithOwner
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

/** Fetches the viewer's most recently starred repositories from GitHub. */
export function getStarredRepositories(): Promise<StarredRepository[] | null> {
  return buildTimeFetch(
    "GitHub",
    "GITHUB_ACCESS_TOKEN",
    import.meta.env.GITHUB_ACCESS_TOKEN,
    async (token) => {
      const response = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          Authorization: `bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": USER_AGENT,
        },
        body: JSON.stringify({
          query: STARRED_REPOSITORIES_QUERY,
          variables: { first: STARRED_REPOSITORIES_COUNT },
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
    },
  );
}
