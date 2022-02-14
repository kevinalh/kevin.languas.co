/**
 * Adapted from https://chakra-templates.dev/navigation/navbar
 */
import dynamic from "next/dynamic";
import {
  Box,
  Button,
  Collapse,
  Flex,
  Link,
  IconButton,
  useBreakpointValue,
  useColorModeValue,
  useDisclosure,
  Stack,
  Text,
  useColorMode,
} from "@chakra-ui/react";
import { CloseIcon, MoonIcon, HamburgerIcon, SunIcon } from "@chakra-ui/icons";
import NextLink from "next/link";
import { NavItem } from "./interfaces";

const MobileNav = dynamic(() => import("./mobile-nav"));
const DesktopNav = dynamic(() => import("./desktop-nav"));

const NAV_ITEMS: [NavItem] = [
  {
    label: "GitHub Stars",
    href: "/github",
  },
];

export default function Nav() {
  const { isOpen, onToggle } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  const titleComponent = (
    <NextLink href="/" passHref>
      <Link>
        <Text
          textAlign={useBreakpointValue({ base: "center", md: "left" })}
          fontFamily={"heading"}
          color={useColorModeValue("gray.800", "white")}
        >
          Kevin L
        </Text>
      </Link>
    </NextLink>
  );
  // The following variable is used for dynamically loading device-specific navigation
  const deviceType = useBreakpointValue({ base: "mobile", md: "desktop" });
  return (
    <Box>
      <Flex
        bg={useColorModeValue("white", "gray.800")}
        color={useColorModeValue("gray.600", "white")}
        minH={"60px"}
        py={{ base: 2 }}
        px={{ base: 4 }}
        borderBottom={1}
        borderStyle={"solid"}
        borderColor={useColorModeValue("gray.200", "gray.900")}
        align={"center"}
      >
        <Flex
          flex={{ base: 1, md: "auto" }}
          ml={{ base: -2 }}
          display={{ base: "flex", md: "none" }}
        >
          <IconButton
            onClick={onToggle}
            icon={
              isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />
            }
            variant={"ghost"}
            aria-label={"Toggle Navigation"}
          />
        </Flex>
        <Flex flex={{ base: 1 }} justify={{ base: "center", md: "start" }}>
          {titleComponent}

          <Flex display={{ base: "none", md: "flex" }} ml={10}>
            {deviceType === "desktop" ? (
              <DesktopNav navItems={NAV_ITEMS} />
            ) : null}
          </Flex>
        </Flex>

        <Stack
          flex={{ base: 1, md: 0 }}
          justify={"flex-end"}
          direction={"row"}
          spacing={6}
        >
          <Button onClick={toggleColorMode} aria-label="Switch color mode">
            {colorMode === "light" ? <MoonIcon /> : <SunIcon />}
          </Button>
        </Stack>
      </Flex>

      <Collapse in={isOpen} animateOpacity>
        {deviceType === "mobile" ? <MobileNav navItems={NAV_ITEMS} /> : null}
      </Collapse>
    </Box>
  );
}
