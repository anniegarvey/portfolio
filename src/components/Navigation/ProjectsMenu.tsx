"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { styled } from "next-yak";
import { useEffect, useId, useRef, useState } from "react";
import {
  CASE_STUDIES,
  CASE_STUDIES_TAGLINE,
  LIVE_APPS,
  PLAYGROUND_LABEL,
  PLAYGROUND_TAGLINE,
} from "./projects";

const CLOSE_DELAY_MS = 140;

export function ProjectsMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const playgroundId = useId();
  const caseStudiesId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const suppressNextFocusOpen = useRef(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const wrapperRef = useRef<HTMLLIElement>(null);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = undefined;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
        // Return focus to trigger when Escape is pressed from inside the panel.
        // Suppress the onFocusCapture re-open that would otherwise fire when
        // focus() returns to the trigger button.
        if (wrapperRef.current?.contains(document.activeElement)) {
          suppressNextFocusOpen.current = true;
          triggerRef.current?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <NavItem
      onBlurCapture={(e) => {
        if (!wrapperRef.current?.contains(e.relatedTarget as Node)) {
          scheduleClose();
        }
      }}
      onFocusCapture={() => {
        if (suppressNextFocusOpen.current) {
          suppressNextFocusOpen.current = false;
          return;
        }
        cancelClose();
        setOpen(true);
      }}
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
      ref={wrapperRef}
    >
      <TriggerButton
        aria-controls={panelId}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        ref={triggerRef}
        type="button"
      >
        <TriggerLabel>Projects</TriggerLabel>
        <ChevronDown
          aria-hidden="true"
          data-open={open || undefined}
          size={14}
        />
      </TriggerButton>

      <Mega data-open={open || undefined} id={panelId} inert={!open}>
        <Column>
          <Eyebrow>Live</Eyebrow>
          <Heading id={playgroundId}>{PLAYGROUND_LABEL}</Heading>
          <Tagline>{PLAYGROUND_TAGLINE}</Tagline>
          <LiveList aria-labelledby={playgroundId}>
            {LIVE_APPS.map((app) => (
              <li key={app.slug}>
                <LiveLink
                  aria-current={pathname === app.href ? "page" : undefined}
                  href={app.href}
                  onClick={() => setOpen(false)}
                  style={{ "--row-accent": app.accent } as React.CSSProperties}
                >
                  <Swatch
                    aria-hidden="true"
                    style={{ background: app.accent }}
                  />
                  <span>
                    <Name>{app.title}</Name>
                    <Blurb>{app.blurb}</Blurb>
                  </span>
                  <Cta>
                    Open <ArrowRight aria-hidden="true" size={14} />
                  </Cta>
                </LiveLink>
              </li>
            ))}
          </LiveList>
        </Column>

        <Column>
          <Eyebrow>Read</Eyebrow>
          <Heading id={caseStudiesId}>Case Studies</Heading>
          <Tagline>{CASE_STUDIES_TAGLINE}</Tagline>
          <CaseGrid aria-labelledby={caseStudiesId}>
            {CASE_STUDIES.map((cs) => (
              <li key={cs.slug}>
                <CaseCard
                  aria-current={pathname === cs.href ? "page" : undefined}
                  href={cs.href}
                  onClick={() => setOpen(false)}
                  style={{ "--row-accent": cs.accent } as React.CSSProperties}
                >
                  <CardStripe />
                  <Name>{cs.title}</Name>
                  <Blurb>{cs.blurb}</Blurb>
                </CaseCard>
              </li>
            ))}
          </CaseGrid>
        </Column>
      </Mega>
    </NavItem>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const NavItem = styled.li`
  position: relative;
  list-style: none;
`;

const TriggerLabel = styled.span``;

const TriggerButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 1.6rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: 0;
  cursor: pointer;
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

  & > svg {
    -webkit-text-fill-color: initial;
    color: light-dark(var(--color-grey-900), var(--color-grey-100));
    transition: transform 200ms var(--ease-out), color 200ms ease;
  }
  & > svg[data-open] {
    transform: rotate(180deg);
    color: var(--color-primary-400);
  }

  &:hover,
  &:focus-visible,
  &[aria-expanded="true"] {
    background-position: 0% 100%;
    transition: background-position var(--speed) var(--ease-out);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    & > svg { transition: none; }
    &:hover, &:focus-visible, &[aria-expanded="true"] { transition: none; }
  }
`;

const Mega = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 50%;
  width: min(720px, calc(100vw - 80px));
  background: light-dark(var(--color-grey-50), oklch(18% 0.008 286));
  border: 1px solid light-dark(var(--color-grey-200), oklch(40% 0.04 290 / 0.35));
  border-radius: 14px;
  padding: 20px;
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 24px;
  box-shadow: var(--elevation-md);
  opacity: 0;
  transform: translate(-50%, -6px);
  pointer-events: none;
  transition: opacity 220ms var(--ease-out), transform 220ms var(--ease-out);
  z-index: 20;

  &[data-open] {
    opacity: 1;
    transform: translate(-50%, 0);
    pointer-events: auto;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: opacity 60ms ease;
    transform: translate(-50%, 0);
  }
`;

const Column = styled.div`
  &:nth-child(2) {
    border-left: 1px solid light-dark(var(--color-grey-200), oklch(40% 0.01 286 / 0.3));
    padding-left: 24px;
  }
`;

const Eyebrow = styled.div`
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: light-dark(var(--color-primary-600), var(--color-primary-400));
  margin-bottom: 4px;
`;

const Heading = styled.div`
  font-family: var(--font-tangerine);
  font-size: 2.4rem;
  line-height: 1;
  color: light-dark(var(--color-grey-900), var(--color-grey-100));
  margin-bottom: 6px;
`;

const Tagline = styled.p`
  font-size: 0.85rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
  margin-bottom: 14px;
`;

const Name = styled.span`
  display: block;
  font-weight: 600;
  font-size: 1rem;
  line-height: 1.2;
  color: light-dark(var(--color-grey-900), var(--color-grey-100));
`;

const Blurb = styled.span`
  display: block;
  font-size: 0.8rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
  margin-top: 2px;
  line-height: 1.35;
`;

const Swatch = styled.span`
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  position: relative;
  box-shadow:
    inset 0 0 0 1px oklch(100% 0 0 / 0.12),
    0 1px 2px oklch(0% 0 0 / 0.35);

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 6px;
    background: linear-gradient(135deg, oklch(100% 0 0 / 0.18), transparent 50%);
  }
`;

const LiveList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 4px;
  list-style: none;
  padding: 0;
  margin: 0;
`;

const LiveLink = styled(Link)`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
  text-decoration: none;
  background: light-dark(var(--color-grey-100), oklch(22% 0.012 286 / 0.55));
  transition: background-color 180ms ease, transform 160ms var(--ease-out);

  &::before {
    content: "";
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: var(--row-accent);
  }

  &:hover,
  &:focus-visible {
    background: light-dark(var(--color-grey-200), oklch(28% 0.03 290 / 0.7));
    transform: translateX(2px);
  }

  &[aria-current="page"] {
    background: light-dark(var(--color-grey-200), oklch(28% 0.03 290 / 0.7));
  }
  &[aria-current="page"] ${Name} {
    color: light-dark(var(--color-primary-700), var(--color-primary-300));
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: background-color 120ms ease;
    &:hover, &:focus-visible { transform: none; }
  }
`;

const Cta = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: light-dark(var(--color-primary-600), var(--color-primary-400));
  font-weight: 600;
  opacity: 0;
  transition: opacity 160ms ease;

  ${LiveLink}:hover &,
  ${LiveLink}:focus-visible & {
    opacity: 1;
  }
`;

const CaseGrid = styled.ul`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  list-style: none;
  padding: 0;
  margin: 0;
`;

const CaseCard = styled(Link)`
  display: flex;
  flex-direction: column;
  padding: 12px 14px 14px;
  border-radius: 10px;
  position: relative;
  background: light-dark(var(--color-grey-100), oklch(22% 0.012 286 / 0.4));
  text-decoration: none;
  overflow: hidden;
  transition: background-color 180ms ease, transform 160ms var(--ease-out);

  &:hover,
  &:focus-visible {
    background: light-dark(var(--color-grey-200), oklch(28% 0.03 290 / 0.65));
    transform: translateY(-1px);
  }

  &[aria-current="page"] {
    background: light-dark(var(--color-grey-200), oklch(28% 0.03 290 / 0.65));
  }
  &[aria-current="page"] ${Name} {
    color: light-dark(var(--color-primary-700), var(--color-primary-300));
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
  }

  & ${Name} { margin-top: 6px; }

  @media (prefers-reduced-motion: reduce) {
    transition: background-color 120ms ease;
    &:hover, &:focus-visible { transform: none; }
  }
`;

const CardStripe = styled.span`
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--row-accent);
`;
