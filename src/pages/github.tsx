import { InferGetStaticPropsType } from "next";
import { DEFAULT_REVALIDATION_TIME } from "common/constants";
import { getStarredRepositories } from "modules/profile/services/github";
import { VStack, Text, Image, Heading } from "@chakra-ui/react";

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
          <div key={repository.node.name}>
            <Heading as="h4">{repository.node.name}</Heading>
            <Text>{repository.node.shortDescriptionHTML}</Text>
            <Image
              alt={repository.node.name}
              src={repository.node.openGraphImageUrl}
              boxSize="50px"
            ></Image>
          </div>
        );
      })}
    </VStack>
  );
}
