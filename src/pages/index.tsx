import type { NextPage } from "next";
import Head from "next/head";
import { Box, Text, Heading, Spacer, Link, Stack } from "@chakra-ui/react";
import { Person, WithContext } from "schema-dts";

import { Img } from "common/components/image";

const Home: NextPage = () => {
  const bioFontSize = ["1.2em", "1.5em"];
  const bioStack = (
    <Stack direction="column">
      <Text fontSize={bioFontSize}>
        I&apos;m a Peruvian engineer currently working at{" "}
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
        I&apos;m passionate about learning new things, no matter the field. For
        pretty much my whole life I&apos;ve been interested in music (a new
        obscure music genre I can casually bring up in a conversation? Yes
        please!), computer stuff (OK but <Text as="i">how</Text> does WiFi
        actually encode data in the air?) and{" "}
        <Link href="https://plato.stanford.edu/entries/platonism-mathematics/">
          philosophy
        </Link>
        .
      </Text>
      <Text fontSize={bioFontSize}>
        My programming language journey can be summarized as follows: I&apos;m
        the Python guy who was happy to leave the complexities of C++ behind,
        only to end up using type hinting everywhere after a few years. Now
        I&apos;m in the process of getting comfortable with Scala and Rust to
        get the full experience of a strict type system. On the way, learned
        some TypeScript too.
      </Text>
    </Stack>
  );
  const avatarPicture = "https://avatars.githubusercontent.com/u/3322228";
  const ldSchema: WithContext<Person> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Kevin Languasco",
    url: "https://kevin.languas.co",
    jobTitle: "Data Engineer",
    alumniOf: [
      {
        "@type": "CollegeOrUniversity",
        name: "Pontifical Catholic University of Peru",
        sameAs:
          "https://en.wikipedia.org/wiki/Pontifical_Catholic_University_of_Peru",
      },
    ],
    image: avatarPicture,
    email: "mailto:kevin+websiteschema@languas.co",
    givenName: "Kevin",
    sameAs: [
      "https://www.linkedin.com/in/kevinalh/",
      "https://stackoverflow.com/users/2616577/kevin-languasco/",
      "https://twitter.com/kevinalh",
    ],
  };
  return (
    <Box
      m={[45, 50, 100]}
      mt={[10, 20, 45]}
      ml={[5]}
      mr={[5, 50, 100]}
      maxW={1000}
    >
      <Head>
        <title>Kevin Languasco</title>
        <meta name="description" content="Kevin Languasco's personal website" />
        <meta
          name="keywords"
          content="data engineering, data science, python, software engineering, Kevin Languasco"
        />
        <link rel="icon" href="/favicon.ico" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ldSchema) }}
        ></script>
      </Head>

      <main>
        <Box textAlign={["center", "center", "left"]}>
          <Img
            src={avatarPicture}
            width={200}
            height={200}
            borderRadius="full"
          />
          <Spacer m={10} />
          <Heading>Hi! I&apos;m Kevin.</Heading>
        </Box>
        <Spacer m={5} />
        {bioStack}
      </main>

      <footer></footer>
    </Box>
  );
};

export default Home;
