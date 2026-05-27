"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { styled } from "next-yak";
import { PointsDisplay } from "@/components/PointsDisplay";
import { QUERIES } from "@/lib/constants";
import { MobileDrawer } from "./MobileDrawer";
import { ProjectsMenu } from "./ProjectsMenu";
import { ThemeToggle } from "./ThemeToggle";

export function Navigation() {
  const pathname = usePathname();

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

      <MobileDrawer />

      <DesktopSide>
        <PointsDisplay />
        <ThemeToggle />
      </DesktopSide>
    </Header>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

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
  filter: drop-shadow(
    calc(var(--shadow-unit) * -0.75) calc(var(--shadow-unit) * 0.75)
      calc(var(--shadow-unit) * 1.5) oklch(20% 0.04 270 / 0.5)
  );
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
  transition: background-position calc(var(--speed) * 3)
    cubic-bezier(0.19, 1, 0.22, 1);

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
