import { callGraphQL, GraphQLProjects } from "common/graphql";
import { User } from "@octokit/graphql-schema";
import { gql } from "@apollo/client";

/**
 * Gets the most recent repositories from Github.
 * @returns Data from the Github repository.
 */
export async function getStarredRepositories() {
  const query = gql`
    {
      viewer {
        starredRepositories(
          orderBy: { field: STARRED_AT, direction: DESC }
          first: 30
        ) {
          totalCount
          edges {
            starredAt
            node {
              name
              createdAt
              shortDescriptionHTML
              url
              stargazerCount
              openGraphImageUrl
            }
          }
        }
      }
    }
  `;
  const { viewer } = await callGraphQL<{ viewer: User }>(
    GraphQLProjects.GitHub,
    query
  );
  return viewer.starredRepositories.edges;
}
