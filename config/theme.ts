/**
 * Chakra configuration for setting up the light/dark mode
 * https://chakra-ui.com/docs/features/color-mode
 */
import { extendTheme, ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: true,
};

const theme = extendTheme({ config });

export default theme;
