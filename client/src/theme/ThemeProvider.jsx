
import { createContext, useEffect, useState } from "react";
import { themes } from "./theme";

export const ThemeContext = createContext(null);

export function ThemeProvider({
  children,
  storageKey = "wifi-theme",
  defaultTheme = "light",
}) {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem(storageKey);

    return savedTheme && themes[savedTheme]
      ? savedTheme
      : defaultTheme;
  });

  useEffect(() => {
    const root = document.documentElement;
    const selectedTheme = themes[theme];

    root.dataset.theme = theme;

    Object.entries(selectedTheme).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });

    root.style.colorScheme = theme;

    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey]);

  const toggleTheme = () => {
    setTheme((current) =>
      current === "light" ? "dark" : "light"
    );
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === "dark",
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
