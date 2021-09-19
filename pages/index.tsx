import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { Box } from "@chakra-ui/react";

const Home: NextPage = () => {
  return (
    <Box>
      <Head>
        <title>Kevin Languasco</title>
        <meta name="description" content="Kevin's personal website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <Box>Hi! I&apos;m Kevin</Box>
      </main>

      <footer></footer>
    </Box>
  );
};

export default Home;
