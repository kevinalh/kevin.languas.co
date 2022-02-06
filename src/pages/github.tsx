import { InferGetStaticPropsType } from "next";
import { DEFAULT_REVALIDATION_TIME } from "common/constants";
import { getStarredRepositories } from "modules/profile/services/github";
import {
  VStack,
  Text,
  Image,
  Heading,
  Box,
  Link,
  Circle,
  HStack,
  StackDivider,
} from "@chakra-ui/react";
import { StarIcon } from "@chakra-ui/icons";

export const getStaticProps = async () => {
  /**
   * Bug: You can't use the provided typings with GetStaticProps & InferGetStaticPropsType
   * at the same time.
   * https://github.com/vercel/next.js/discussions/18463
   */
  const starredRepositories = await getStarredRepositories();
  return {
    props: { repositories: starredRepositories },
    revalidate: DEFAULT_REVALIDATION_TIME,
  };
};

export default function Github({
  repositories,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  if (repositories == null) {
    return <div>Couldn&apos;t load the repositories!</div>;
  }
  return (
    <VStack>
      {repositories.map((repository) => {
        if (repository == null) {
          throw new Error("Null repository in the returned list");
        }
        return (
          <Box
            key={repository.node.nameWithOwner}
            w="80%"
            p={5}
            shadow="md"
            borderWidth="1px"
            borderRadius="md"
          >
            <Heading as="h4" size="md">
              <Link href={repository.node.url} isExternal>
                {repository.node.nameWithOwner}
              </Link>
            </Heading>
            <HStack alignItems="stretch">
              <Text marginRight="auto">{repository.node.description}</Text>
              <Image
                alt={repository.node.name}
                src={repository.node.openGraphImageUrl}
                boxSize="4em"
              ></Image>
            </HStack>
            <HStack>
              <Circle
                size="1em"
                bg={repository.node.primaryLanguage?.color ?? undefined}
              ></Circle>
              <Text>{repository.node.primaryLanguage?.name}</Text>
              <StarIcon></StarIcon>
              <Text>{repository.node.stargazerCount}</Text>
            </HStack>
          </Box>
        );
      })}
    </VStack>
  );
}
