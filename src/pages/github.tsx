import { InferGetStaticPropsType } from "next";
import {
  VStack,
  Text,
  Heading,
  Box,
  Link,
  Circle,
  HStack,
} from "@chakra-ui/react";
import { StarIcon } from "@chakra-ui/icons";

import { DEFAULT_REVALIDATION_TIME } from "common/constants";
import { Img } from "common/components/image";
import { getStarredRepositories } from "modules/profile/services/github";

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
              <Text marginRight="auto" maxWidth={["60%", "80%"]}>
                {repository.node.description}
              </Text>
              <Box
                marginRight="auto"
                position="relative"
                width="5em"
                height="5em"
              >
                <Img
                  alt={repository.node.name}
                  src={repository.node.openGraphImageUrl}
                  layout="fill"
                ></Img>
              </Box>
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
