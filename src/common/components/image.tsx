import { chakra } from "@chakra-ui/react";
import NextImage from "next/image";

/**
 * Make Chakra responsiveness work with Next image, which gets optimized in the build.
 * https://github.com/chakra-ui/chakra-ui/discussions/2475#discussioncomment-229471
 */
export const Img = chakra(NextImage, {
  baseStyle: { maxH: 10, maxW: 10 },
  shouldForwardProp: (prop) =>
    ["layout", "src", "alt", "height", "width"].includes(prop),
});
