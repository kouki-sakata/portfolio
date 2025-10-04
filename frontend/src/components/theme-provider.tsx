import { useEffect, useMemo, useState } from "react";

import { type Theme, ThemeProviderContext } from "@/hooks/use-theme";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  disablePersistence?: boolean;
};

const getSystemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  disablePersistence = false,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return defaultTheme;
    }

    if (disablePersistence) {
      window.localStorage.removeItem(storageKey);
    } else {
      const storedTheme = window.localStorage.getItem(
        storageKey
      ) as Theme | null;
      if (storedTheme) {
        return storedTheme;
      }
    }

    return defaultTheme;
  });

  const resolvedTheme = useMemo(
    () =>
      theme === "system"
        ? typeof window === "undefined"
          ? "light"
          : getSystemTheme()
        : theme,
    [theme]
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    if (disablePersistence) {
      window.localStorage.removeItem(storageKey);
      return;
    }
    window.localStorage.setItem(storageKey, theme);
  }, [theme, disablePersistence, storageKey]);

  useEffect(() => {
    if (theme !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        const next = mediaQuery.matches ? "dark" : "light";
        window.document.documentElement.classList.remove("light", "dark");
        window.document.documentElement.classList.add(next);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const value = {
    theme,
    setTheme: (nextTheme: Theme) => {
      if (!disablePersistence) {
        window.localStorage.setItem(storageKey, nextTheme);
      }
      setTheme(nextTheme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

// useTheme has been moved to @/hooks/use-theme
