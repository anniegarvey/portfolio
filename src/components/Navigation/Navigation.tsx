"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Menu, Monitor, Moon, Sun, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { styled } from "next-yak";
import { useState } from "react";
import { type ThemeSetting, useTheme } from "@/components/ThemeProvider";
import { QUERIES } from "@/lib/constants";

const THEME_META: Record<
  ThemeSetting,
  { icon: React.ReactNode; label: string; next: ThemeSetting }
> = {
  system: {
    icon: <Monitor size={20} />,
    label: "Theme: System (click for Light)",
    next: "light",
  },
  light: {
    icon: <Sun size={20} />,
    label: "Theme: Light (click for Dark)",
    next: "dark",
  },
  dark: {
    icon: <Moon size={20} />,
    label: "Theme: Dark (click for System)",
    next: "system",
  },
};

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const meta = THEME_META[theme];
  return (
    <ThemeToggleButton
      aria-label={meta.label}
      onClick={() => setTheme(meta.next)}
      title={meta.label}
      type="button"
    >
      {meta.icon}
    </ThemeToggleButton>
  );
}

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/colour-palette", label: "Colour Palette" },
  { href: "/energy-planner", label: "Energy Planner" },
] as const;

export function Navigation() {
  const [open, setOpen] = useState(false);

  const handleLinkClick = () => setOpen(false);

  return (
    <Header>
      <Side>
        <LogoLink aria-label="Home" href="/">
          <StyledImage
            alt="Annie Garvey Girl Coding"
            height={180}
            src="/AnnieGarveyLogo.png"
            width={320}
          />
        </LogoLink>
      </Side>

      {/* Desktop Navigation */}
      <DesktopNav aria-label="Main navigation">
        <NavList>
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.href}>
              <NavLink href={item.href}>{item.label}</NavLink>
            </NavItem>
          ))}
        </NavList>
      </DesktopNav>

      {/* Mobile Navigation */}
      <MobileNav>
        <Dialog.Root onOpenChange={setOpen} open={open}>
          <Dialog.Trigger asChild>
            <HamburgerButton aria-label="Toggle navigation menu">
              <Menu size={32} />
            </HamburgerButton>
          </Dialog.Trigger>
          <Dialog.Portal>
            <StyledOverlay />
            <Dialog.Content aria-describedby={undefined} asChild>
              <StyledContent>
                <VisuallyHidden>
                  <Dialog.Title>Navigation menu</Dialog.Title>
                </VisuallyHidden>
                <CloseButton aria-label="Close navigation menu">
                  <X size={32} />
                </CloseButton>
                <MobileNavList>
                  {NAV_ITEMS.map((item) => (
                    <MobileNavItem key={item.href}>
                      <MobileNavLink href={item.href} onClick={handleLinkClick}>
                        {item.label}
                      </MobileNavLink>
                    </MobileNavItem>
                  ))}
                </MobileNavList>
                <MobileThemeSection>
                  <MobileThemeLabel>Theme</MobileThemeLabel>
                  <ThemeToggle />
                </MobileThemeSection>
              </StyledContent>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </MobileNav>

      <DesktopSide>
        <ThemeToggle />
      </DesktopSide>
    </Header>
  );
}

const Header = styled.header`
  display: flex;
  padding: 0.2rem 1rem;
  background-color: var(--color-grey-950);
  border-bottom: 1px solid var(--color-grey-700);
  position: relative;
  align-items: center;
`;

const Side = styled.div`
  flex: 0;

  @media (${QUERIES.TABLET_UP}) {
    flex: 1;
  }
`;

const DesktopNav = styled.nav`
  display: none;

  @media (${QUERIES.TABLET_UP}) {
    display: flex;
    align-items: center;
  }
`;

const MobileNav = styled.div`
  display: flex;
  flex: 1;
  justify-content: flex-end;

  @media (${QUERIES.TABLET_UP}) {
    display: none;
  }
`;

const LogoLink = styled(Link)`
  transition: opacity 600ms ease;
  animation: fadeFromTransparent 600ms ease;

  &:hover {
    opacity: 0.8;
    transition-duration: 300ms;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transition: none;
  }
`;

const StyledImage = styled(Image)`
  height: 5rem;
  width: auto;
  margin-top: -5px;
  margin-bottom: -13px;
`;

const NavList = styled.ul`
  display: flex;
  gap: 1rem;
  list-style: none;
  padding-left: 1rem;
`;

const NavItem = styled.li``;

const NavLink = styled(Link)`
  color: var(--color-grey-100);
  font-weight: 700;
  font-size: 1.6rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-decoration: none;

  &:hover,
  &:focus-visible {
    background-color: var(--color-primary-700);
    color: var(--color-primary-100);
  }
`;

const HamburgerButton = styled.button`
  background: none;
  border: none;
  color: var(--color-grey-100);
  cursor: pointer;
  padding: 0.5rem;
  touch-action: manipulation;

  &:hover {
    color: var(--color-primary-400);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
    border-radius: 4px;
  }
`;

const StyledOverlay = styled(Dialog.Overlay)`
  background-color: rgba(0, 0, 0, 0.5);
  position: fixed;
  inset: 0;
  animation: fadeFromTransparent 300ms ease;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const StyledContent = styled.div`
  background-color: var(--color-grey-900);
  position: absolute;
  top: 0;
  right: -1.5rem;
  bottom: 0;
  width: 75%;
  padding: 2rem;
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.3);
  animation: slideInFromRight 300ms ease;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const CloseButton = styled(Dialog.Close)`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: none;
  border: none;
  color: var(--color-grey-100);
  cursor: pointer;
  touch-action: manipulation;

  &:hover {
    color: var(--color-primary-400);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
    border-radius: 4px;
  }
`;

const MobileNavList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  list-style: none;
  margin-top: 3rem;
`;

const MobileNavItem = styled.li`
  border-bottom: 1px solid var(--color-grey-800);
  padding-bottom: 0.5rem;
`;

const MobileNavLink = styled(Link)`
  color: var(--color-grey-100);
  font-weight: 700;
  font-size: 1.6rem;
  text-decoration: none;
  display: block;

  &:hover,
  &:focus-visible {
    color: var(--color-primary-400);
  }
`;

const DesktopSide = styled.div`
  display: none;
  flex: 1;
  justify-content: flex-end;
  align-items: center;

  @media (${QUERIES.TABLET_UP}) {
    display: flex;
  }
`;

const ThemeToggleButton = styled.button`
  background: none;
  border: 1px solid var(--color-grey-600);
  border-radius: 6px;
  color: var(--color-grey-100);
  cursor: pointer;
  padding: 0.4rem 0.6rem;
  display: flex;
  align-items: center;
  touch-action: manipulation;
  transition: background-color 200ms ease, color 200ms ease, border-color 200ms ease;

  &:hover {
    background-color: var(--color-primary-700);
    border-color: var(--color-primary-500);
    color: var(--color-primary-100);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const MobileThemeSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-grey-800);
`;

const MobileThemeLabel = styled.span`
  color: var(--color-grey-100);
  font-weight: 700;
  font-size: 1.6rem;
`;
