/**
 * GraphQL-handling functions. GraphQL tooling isn't that mature yet, so it's a
 * particularly good idea to keep direct interaction with it behind a facade.
 *
 * Note that these could be memoized for better performance using a library like
 * memoizee, but given Next.js already does ISR, it's probably not that big of a deal,
 * at least for now.
 */
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  TypedDocumentNode,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

export enum GraphQLProjects {
  GitHub = "github",
}

const GraphQLConfig = Object.freeze({
  [GraphQLProjects.GitHub]: {
    schema: "https://api.github.com/graphql",
    headers: {
      Authorization: `bearer ${process.env.GITHUB_ACCESS_TOKEN}`,
    },
  },
});

/**
 * Get a GraphQL client given a project name and a query.
 * @param project Project for which to get the client.
 */
async function loadGraphQLClient(project: GraphQLProjects) {
  const config = GraphQLConfig[project];
  /**
   * This next part follows the Apollo docs boilerplate for authentication
   * https://www.apollographql.com/docs/react/networking/authentication/#header
   */
  const httpLink = createHttpLink({ uri: config.schema });
  const authLink = setContext((_, { headers }) => {
    return { headers: { ...headers, ...config.headers } };
  });
  const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
  });
  return client;
}

/**
 * Call a GraphQL endpoint for a specified project.
 * @param project Project enum from which to load the configuration.
 * @param query A GraphQL query using the gql template literal tag.
 */
export async function callGraphQL<TopSchemaType>(
  project: GraphQLProjects,
  query: TypedDocumentNode
): Promise<TopSchemaType> {
  const client = await loadGraphQLClient(project);
  const result = await client.query({ query: query });
  if (result.error) {
    throw new Error(
      `There was an issue with the Apollo query: ${result.error.message}`
    );
  }
  return result.data as TopSchemaType;
}
