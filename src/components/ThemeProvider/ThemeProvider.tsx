"use client";

import { useEffect, useState } from "react";
import { ThemeContext, type ThemeSetting } from "./context";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeSetting>("system");

  useEffect(() => {
    const stored = localStorage.getItem("theme") as ThemeSetting | null;
    if (stored === "light" || stored === "dark") {
      setThemeState(stored);
    }
  }, []);

  const setTheme = (newTheme: ThemeSetting) => {
    setThemeState(newTheme);
    if (newTheme === "system") {
      localStorage.removeItem("theme");
      document.documentElement.removeAttribute("data-theme");
    } else {
      localStorage.setItem("theme", newTheme);
      document.documentElement.setAttribute("data-theme", newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
