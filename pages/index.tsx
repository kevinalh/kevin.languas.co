import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { Box, Text, Heading, Spacer, Link, Stack } from "@chakra-ui/react";

const Home: NextPage = () => {
  const bioFontSize = "1.5em";
  const bioStack = (
    <Stack>
      <Text fontSize={bioFontSize}>
        I'm a Peruvian engineer currently working at{" "}
        <Link href="https://www.haystack.tv/about-us" isExternal>
          Haystack News
        </Link>
        , a streaming news app for cord cutters with millions of users.
      </Text>
      <Text fontSize={bioFontSize}>
        I previously worked at{" "}
        <Link href="https://www.lapositiva.com.pe/wps/portal/corporativo/home">
          La Positiva Seguros
        </Link>
        , an insurance company, and got a Bachelors in Mathematics from the{" "}
        <Link href="https://www.pucp.edu.pe/">
          Pontifical Catholic University of Peru
        </Link>
        , doing an exchange semester at the{" "}
        <Link href="https://www.ou.edu/">University of Oklahoma</Link> and
        taking PhD-level classes in the Summer Program of the{" "}
        <Link href="https://impa.br/">
          Institute of Pure and Applied Mathematics (IMPA)
        </Link>{" "}
        in Rio de Janeiro.
      </Text>
      <Text fontSize={bioFontSize}>
        I'm passionate about learning new things, no matter the field. For
        pretty much my whole life I've been interested in music (a new obscure
        music genre I can casually bring up in a conversation? Yes please!),
        computer stuff (OK but <Text as="i">how</Text> does WiFi actually encode
        data in the air?) and{" "}
        <Link href="https://plato.stanford.edu/entries/platonism-mathematics/">
          philosophy
        </Link>
        .
      </Text>
      <Text fontSize={bioFontSize}>
        My programming language journey can be summarized as follows: I'm the
        Python guy who was happy to leave the complexities of C++ behind, only
        to end up using type hinting everywhere after a few years. Now I'm in
        the process of getting comfortable with Scala and Rust to get the full
        experience of a strict type system. On the way, learned some TypeScript
        too.
      </Text>
    </Stack>
  );
  return (
    <Box m={100} mt={20} mr={100}>
      <Head>
        <title>Kevin Languasco</title>
        <meta name="description" content="Kevin's personal website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <Heading>Hi! I&apos;m Kevin.</Heading>
        <Spacer m={5}></Spacer>
        {bioStack}
      </main>

      <footer></footer>
    </Box>
  );
};

export default Home;
