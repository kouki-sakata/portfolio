import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/hooks/use-theme";

const originalMatchMedia = window.matchMedia;

const setupMatchMedia = (matches: boolean) => {
  const mock = vi.fn<(query: string) => MediaQueryList>((query) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: mock,
  });

  return mock;
};

const restoreMatchMedia = () => {
  if (originalMatchMedia) {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: originalMatchMedia,
    });
  } else {
    Reflect.deleteProperty(window, "matchMedia");
  }
};

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  afterEach(() => {
    restoreMatchMedia();
    vi.restoreAllMocks();
  });

  test("restores persisted theme from localStorage", () => {
    const storageKey = "vite-ui-theme";
    localStorage.setItem(storageKey, "dark");
    const mock = setupMatchMedia(false);

    function ThemeConsumer() {
      const { theme } = useTheme();
      return <span data-testid="current-theme">{theme}</span>;
    }

    render(
      <ThemeProvider storageKey={storageKey}>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(mock).not.toHaveBeenCalled();
    expect(screen.getByTestId("current-theme")).toHaveTextContent("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  test("updates document root classes when theme changes", async () => {
    setupMatchMedia(false);

    function ThemeSetter() {
      const { theme, setTheme } = useTheme();
      return (
        <button
          onClick={() => {
            setTheme("dark");
          }}
          type="button"
        >
          toggle:{theme}
        </button>
      );
    }

    render(
      <ThemeProvider defaultTheme="light">
        <ThemeSetter />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains("light")).toBe(true);

    const button = screen.getByRole("button", { name: /toggle:light/i });
    await userEvent.click(button);

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);
    expect(localStorage.getItem("vite-ui-theme")).toBe("dark");
  });

  test("prefers system theme when configured", () => {
    const matchMedia = setupMatchMedia(true);

    render(
      <ThemeProvider defaultTheme="system">
        <div data-testid="child" />
      </ThemeProvider>
    );

    expect(matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
    setupMatchMedia(false);
  });

  afterEach(() => {
    restoreMatchMedia();
    vi.restoreAllMocks();
  });

  function ThemeValue() {
    const { theme } = useTheme();
    return <span data-testid="theme-value">{theme}</span>;
  }

  test("toggles between light and dark themes", async () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle />
        <ThemeValue />
      </ThemeProvider>
    );

    const button = screen.getByRole("button", { name: "Toggle theme" });
    const themeValue = screen.getByTestId("theme-value");

    expect(themeValue).toHaveTextContent("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);

    await userEvent.click(button);

    expect(themeValue).toHaveTextContent("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    await userEvent.click(button);

    expect(themeValue).toHaveTextContent("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });
});
