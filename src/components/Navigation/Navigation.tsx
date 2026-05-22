"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { ChevronDown, Menu, Monitor, Moon, Sun, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { styled } from "next-yak";
import { useState } from "react";
import { PointsDisplay } from "@/components/PointsDisplay";
import { type ThemeSetting, useTheme } from "@/components/ThemeProvider";
import { QUERIES } from "@/lib/constants";
import { ProjectsMenu } from "./ProjectsMenu";
import { CASE_STUDIES, LIVE_APPS, PLAYGROUND_LABEL } from "./projects";

const THEME_META: Record<
  ThemeSetting,
  { icon: React.ReactNode; label: string; next: ThemeSetting }
> = {
  system: {
    icon: <Monitor aria-hidden="true" size={20} />,
    label: "Theme: System (click for Light)",
    next: "light",
  },
  light: {
    icon: <Sun aria-hidden="true" size={20} />,
    label: "Theme: Light (click for Dark)",
    next: "dark",
  },
  dark: {
    icon: <Moon aria-hidden="true" size={20} />,
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

export function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [playgroundOpen, setPlaygroundOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);

  const handleLinkClick = () => setOpen(false);

  return (
    <Header>
      <Side>
        <LogoLink aria-label="Home" href="/">
          <StyledImage
            alt="Annie Garvey Girl Coding"
            height={512}
            src="/AG_Overlap_Logo_512.svg"
            width={512}
          />
        </LogoLink>
      </Side>

      {/* Desktop Navigation */}
      <DesktopNav aria-label="Main navigation">
        <NavList>
          <NavItem>
            <NavLink
              aria-current={pathname === "/" ? "page" : undefined}
              href="/"
            >
              Home
            </NavLink>
          </NavItem>
          <ProjectsMenu />
        </NavList>
      </DesktopNav>

      {/* Mobile Navigation */}
      <MobileNav>
        <PointsDisplay />
        <Dialog.Root onOpenChange={setOpen} open={open}>
          <Dialog.Trigger asChild>
            <HamburgerButton aria-label="Toggle navigation menu">
              <Menu aria-hidden="true" size={32} />
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
                  <X aria-hidden="true" size={32} />
                </CloseButton>

                <MobileNavList>
                  <MobileNavItem>
                    <MobileNavLink href="/" onClick={handleLinkClick}>
                      Home
                    </MobileNavLink>
                  </MobileNavItem>

                  <MobileSection>
                    <MobileToggle
                      aria-expanded={playgroundOpen}
                      onClick={() => setPlaygroundOpen((v) => !v)}
                      type="button"
                    >
                      {PLAYGROUND_LABEL}
                      <ChevronDown
                        aria-hidden="true"
                        data-open={playgroundOpen || undefined}
                        size={18}
                      />
                    </MobileToggle>
                    <MobileSub data-open={playgroundOpen || undefined}>
                      <MobileSubInner>
                        {LIVE_APPS.map((app) => (
                          <li key={app.slug}>
                            <MobileSubLink
                              href={app.href}
                              onClick={handleLinkClick}
                            >
                              <MobileSwatch
                                aria-hidden="true"
                                style={{ background: app.accent }}
                              />
                              {app.title}
                            </MobileSubLink>
                          </li>
                        ))}
                      </MobileSubInner>
                    </MobileSub>
                  </MobileSection>

                  <MobileSection>
                    <MobileToggle
                      aria-expanded={projectsOpen}
                      onClick={() => setProjectsOpen((v) => !v)}
                      type="button"
                    >
                      Case Studies
                      <ChevronDown
                        aria-hidden="true"
                        data-open={projectsOpen || undefined}
                        size={18}
                      />
                    </MobileToggle>
                    <MobileSub data-open={projectsOpen || undefined}>
                      <MobileSubInner>
                        {CASE_STUDIES.map((cs) => (
                          <li key={cs.slug}>
                            <MobileSubLink
                              href={cs.href}
                              onClick={handleLinkClick}
                            >
                              <MobileSwatch
                                aria-hidden="true"
                                style={{ background: cs.accent }}
                              />
                              {cs.title}
                            </MobileSubLink>
                          </li>
                        ))}
                      </MobileSubInner>
                    </MobileSub>
                  </MobileSection>
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
        <PointsDisplay />
        <ThemeToggle />
      </DesktopSide>
    </Header>
  );
}

const Header = styled.header`
  display: flex;
  padding: 0.2rem 1rem;
  background-color: light-dark(var(--color-grey-50), var(--color-grey-950));
  border-bottom: 1px solid light-dark(var(--color-grey-200), var(--color-grey-700));
  position: relative;
  align-items: center;

  /* Rainbow brand accent line along the top */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(
      90deg,
      var(--color-primary-400),
      var(--color-teal-400),
      var(--color-secondary-400),
      var(--color-orange-400),
      var(--color-rose-400)
    );
  }
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
    justify-content: center;
  }
`;

const MobileNav = styled.div`
  display: flex;
  flex: 1;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;

  @media (${QUERIES.TABLET_UP}) {
    display: none;
  }
`;

const LogoLink = styled(Link)`
  transition: opacity 600ms ease;
  animation: fadeFromTransparent 600ms ease;
  display: flex;
  align-items: center;
  justify-content: center;

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
  height: 4rem;
  width: auto;
  margin-top: 0.25rem;
  margin-left: -0.5rem;
  margin-bottom: -0.625rem;
  filter: drop-shadow(calc(var(--shadow-unit) * -0.75) calc(var(--shadow-unit) * 0.75) calc(var(--shadow-unit) * 1.5) oklch(20% 0.04 270 / 0.5));
`;

const NavList = styled.ul`
  display: flex;
  gap: 1rem;
  list-style: none;
  padding-left: 1rem;
`;

const NavItem = styled.li``;

const NavLink = styled(Link)`
  font-weight: 600;
  font-size: 1.6rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-decoration: none;

  background: linear-gradient(
    to top,
    light-dark(var(--color-primary-600), var(--color-primary-400)) 0%,
    light-dark(var(--color-primary-600), var(--color-primary-400)) 47%,
    light-dark(var(--color-grey-900), var(--color-grey-100)) 53%,
    light-dark(var(--color-grey-900), var(--color-grey-100)) 100%
  );
  background-size: 100% 200%;
  background-position: 0% 0%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  --speed: 1000ms;
  transition: background-position calc(var(--speed) * 3) cubic-bezier(0.19, 1, 0.22, 1);

  &:hover,
  &:focus-visible {
    background-position: 0% 100%;
    transition: background-position var(--speed) var(--ease-out);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:hover,
    &:focus-visible {
      transition: none;
    }
  }
`;

const HamburgerButton = styled.button`
  background: none;
  border: none;
  color: light-dark(var(--color-grey-700), var(--color-grey-100));
  cursor: pointer;
  padding-inline: 0.5rem;
  padding-top: 0.6rem;
  padding-bottom: 0.45rem;
  touch-action: manipulation;

  &:hover {
    color: var(--color-primary-500);
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
  background-color: light-dark(var(--color-grey-50), var(--color-grey-900));
  position: absolute;
  top: 0;
  right: -1.5rem;
  bottom: 0;
  height: 100vh;
  width: 75%;
  padding: 2rem;
  box-shadow: var(--elevation-lg);
  overscroll-behavior: contain;
  animation: slideInFromRight 300ms ease;
  display: flex;
  flex-direction: column;

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
  color: light-dark(var(--color-grey-700), var(--color-grey-100));
  cursor: pointer;
  touch-action: manipulation;

  &:hover {
    color: var(--color-primary-500);
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
  gap: 0.25rem;
  list-style: none;
  margin-top: 3rem;
`;

const MobileNavItem = styled.li`
  border-bottom: 1px solid light-dark(var(--color-grey-200), var(--color-grey-800));
  padding-bottom: 0.5rem;
`;

const MobileNavLink = styled(Link)`
  font-weight: 600;
  font-size: 1.6rem;
  text-decoration: none;
  display: block;
  padding: 0.5rem 0.5rem;
  border-radius: 4px;

  background: linear-gradient(
    to top,
    var(--color-primary-500) 0%,
    var(--color-primary-500) 47%,
    light-dark(var(--color-grey-900), var(--color-grey-100)) 53%,
    light-dark(var(--color-grey-900), var(--color-grey-100)) 100%
  );
  background-size: 100% 200%;
  background-position: 0% 0%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  transition: background-position 1200ms cubic-bezier(0.19, 1, 0.22, 1);

  &:hover,
  &:focus-visible {
    background-position: 0% 100%;
    transition: background-position 400ms var(--ease-out);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:hover, &:focus-visible { transition: none; }
  }
`;

const MobileSection = styled.li`
  border-bottom: 1px solid light-dark(var(--color-grey-200), var(--color-grey-800));
  padding-bottom: 0.25rem;
  list-style: none;
`;

const MobileToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  text-align: left;
  background: none;
  border: 0;
  cursor: pointer;
  padding: 0.5rem 0.5rem;
  font-family: inherit;
  font-weight: 600;
  font-size: 1.6rem;
  color: light-dark(var(--color-grey-900), var(--color-grey-100));
  border-radius: 4px;

  & > svg {
    color: light-dark(var(--color-grey-600), var(--color-grey-300));
    transition: transform 200ms var(--ease-out), color 200ms ease;
  }
  & > svg[data-open] {
    transform: rotate(180deg);
    color: var(--color-primary-400);
  }

  &[aria-expanded="true"] {
    color: var(--color-primary-400);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    & > svg { transition: none; }
  }
`;

const MobileSub = styled.div`
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 280ms var(--ease-out);

  &[data-open] {
    grid-template-rows: 1fr;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const MobileSubInner = styled.ul`
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.25rem 0 0.5rem 0.5rem;
  list-style: none;
`;

const MobileSubLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.4rem 0.5rem;
  font-size: 1.15rem;
  font-weight: 500;
  border-radius: 4px;
  color: light-dark(var(--color-grey-900), var(--color-grey-100));
  text-decoration: none;

  &:hover,
  &:focus-visible {
    color: var(--color-primary-400);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
  }
`;

const MobileSwatch = styled.span`
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  box-shadow:
    inset 0 0 0 1px oklch(100% 0 0 / 0.12),
    0 1px 2px oklch(0% 0 0 / 0.25);
`;

const DesktopSide = styled.div`
  display: none;
  flex: 1;
  justify-content: flex-end;
  align-items: center;
  gap: 1.5rem;

  @media (${QUERIES.TABLET_UP}) {
    display: flex;
  }
`;

const ThemeToggleButton = styled.button`
  background: none;
  border: 1px solid light-dark(var(--color-grey-300), var(--color-grey-600));
  border-radius: 6px;
  color: light-dark(var(--color-grey-700), var(--color-grey-100));
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
  margin-top: auto;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-top: 1.5rem;
`;

const MobileThemeLabel = styled.span`
  color: light-dark(var(--color-grey-700), var(--color-grey-100));
  font-size: 1.6rem;
`;
