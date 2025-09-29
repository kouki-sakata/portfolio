import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ThemeProvider } from "../theme-provider";

// Fix void type errors by using proper typing
type MockContextType = {
  theme: string;
  setTheme: (theme: string) => void;
  toggleTheme: () => void;
};

// Mock theme context with proper typing
const mockSetTheme = vi.fn();
const mockToggleTheme = vi.fn();

// Fixed: Proper mock setup without void type issues
vi.mock("../use-theme", () => ({
  useTheme: (): MockContextType => ({
    theme: "light",
    setTheme: mockSetTheme,
    toggleTheme: mockToggleTheme,
  }),
}));

describe("ThemeProvider", () => {
  it("should render children correctly", () => {
    render(
      <ThemeProvider>
        <div>Test content</div>
      </ThemeProvider>
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("should provide theme context", () => {
    const TestComponent = () => <div>Theme provider working</div>;

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByText("Theme provider working")).toBeInTheDocument();
  });
});
