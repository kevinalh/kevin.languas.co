import "../styles/globals.css";
import type { NextPage } from "next";
import type { AppProps } from "next/app";
import { ReactElement, ReactNode } from "react";
import Layout from "../common/components/layout";
import { Chakra } from "../common/chakra";

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
    <Chakra cookies={pageProps.cookies}>
      <Layout>{getLayout(<Component {...pageProps} />)}</Layout>
    </Chakra>
  );
}

export default MyApp;
