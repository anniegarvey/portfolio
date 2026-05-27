"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { styled } from "next-yak";
import { type ThemeSetting, useTheme } from "@/components/ThemeProvider";

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

export function ThemeToggle() {
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
  transition: background-color 200ms ease, color 200ms ease,
    border-color 200ms ease;

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
