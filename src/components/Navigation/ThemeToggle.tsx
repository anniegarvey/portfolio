"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { type ThemeSetting, useTheme } from "@/components/ThemeProvider";
import { NavIconButton } from "./NavIconButton";

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
    <NavIconButton
      aria-label={meta.label}
      onClick={() => setTheme(meta.next)}
      title={meta.label}
      type="button"
    >
      {meta.icon}
    </NavIconButton>
  );
}
