import { createContext } from "react";

export type ThemeSetting = "system" | "light" | "dark";

export interface ThemeContextValue {
  theme: ThemeSetting;
  setTheme: (theme: ThemeSetting) => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  // v8 ignore next - unreachable default; always used within ThemeProvider
  setTheme: () => {},
});
