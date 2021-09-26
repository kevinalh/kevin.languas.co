import { callGraphQL, GraphQLProjects } from "common/graphql";
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
  const result = await callGraphQL(GraphQLProjects.GitHub, query);
  return result.data;
}
