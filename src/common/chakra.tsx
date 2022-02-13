/**
 * This file was created to removed the "flashing" issue for color modes.
 * https://chakra-ui.com/docs/features/color-mode#add-colormodemanager-optional-for-ssr
 */
import React from "react";
import {
  ChakraProvider,
  cookieStorageManager,
  localStorageManager,
} from "@chakra-ui/react";
import { GetServerSideProps } from "next";

export function Chakra({
  cookies,
  children,
}: {
  cookies: any;
  children: React.ReactNode;
}) {
  const colorModeManager =
    typeof cookies === "string"
      ? cookieStorageManager(cookies)
      : localStorageManager;
  return (
    <ChakraProvider colorModeManager={colorModeManager}>
      {children}
    </ChakraProvider>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: {
      cookies: context.req.headers.cookie ?? "",
    },
  };
};
