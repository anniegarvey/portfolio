"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { styled } from "next-yak";
import { useState } from "react";
import { PointsDisplay } from "@/components/PointsDisplay";
import { QUERIES } from "@/lib/constants";
import { CASE_STUDIES, LIVE_APPS, PLAYGROUND_LABEL } from "./projects";
import { ThemeToggle } from "./ThemeToggle";

export function MobileDrawer() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [playgroundOpen, setPlaygroundOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);

  const handleLinkClick = () => setOpen(false);

  return (
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
                  <MobileNavLink
                    aria-current={pathname === "/" ? "page" : undefined}
                    href="/"
                    onClick={handleLinkClick}
                  >
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
                            aria-current={
                              pathname === app.href ? "page" : undefined
                            }
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
                            aria-current={
                              pathname === cs.href ? "page" : undefined
                            }
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
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

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
  &:focus-visible,
  &[aria-current="page"] {
    background-position: 0% 100%;
    transition: background-position 400ms var(--ease-out);
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
    & > svg {
      transition: none;
    }
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
  &:focus-visible,
  &[aria-current="page"] {
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
