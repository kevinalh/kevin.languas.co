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
import { loadConfig, GraphQLConfig } from "graphql-config";

interface GraphQLConfigSchema {
  [index: number]: {
    [key: string]: { headers: { [key: string]: string } };
  };
}

/**
 * Does an application-wide load of the GraphQL configuration file.
 */
const loadGraphQLConfig: Promise<GraphQLConfig> = (async () => {
  const gplConfig = await loadConfig({
    throwOnMissing: true,
    throwOnEmpty: true,
  });
  if (gplConfig === undefined) {
    throw new Error("Couldn't load GraphQL configuration file");
  }
  return gplConfig;
})();

/**
 * Loads data from graphql-config, encapsulating some buggy behavior.
 * @param project Project for which to get the configuration.
 */
async function loadGraphQLProjectConfig(project: GraphQLProjects): Promise<{
  schema: string;
  headers: { [index: string]: string };
}> {
  const config = await loadGraphQLConfig;
  const projectConfig = config.getProject(project);
  /**
   * See the following issues for context of this code:
   * - https://github.com/kamilkisiela/graphql-config/issues/765
   * - https://github.com/Urigo/graphql-cli/issues/1219#issuecomment-642699959
   */
  const schemaList = projectConfig.schema as GraphQLConfigSchema;
  const schema = Object.keys(schemaList[0])[0];
  const headers = schemaList[0][schema].headers;
  return { schema, headers };
}

/**
 * Get a GraphQL client given a project name and a query.
 * @param project Project for which to get the client.
 */
async function loadGraphQLClient(project: GraphQLProjects) {
  const config = await loadGraphQLProjectConfig(project);
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

export enum GraphQLProjects {
  GitHub = "github",
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
