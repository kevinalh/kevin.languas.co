import "../styles/globals.css";
import { ChakraProvider } from "@chakra-ui/react";
import type { NextPage } from "next";
import type { AppProps } from "next/app";
import theme from "common/theme";
import { ReactElement, ReactNode } from "react";
import Layout from "../common/components/layout";

// Following boilerplate for layouts: https://nextjs.org/docs/basic-features/layouts
type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  // Use layout defined at the page level, if available
  const getLayout = Component.getLayout ?? ((page) => page);
  return (
    <ChakraProvider theme={theme}>
      <Layout>{getLayout(<Component {...pageProps} />)}</Layout>
    </ChakraProvider>
  );
}

export default MyApp;
