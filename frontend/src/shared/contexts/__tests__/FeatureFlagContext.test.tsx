import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useFeatureFlag } from "../../hooks/use-feature-flag";
import { FeatureFlagProvider } from "../FeatureFlagContext";

type FetchMock = ReturnType<typeof vi.fn<typeof fetch>>;

let activeFetchMock: FetchMock;

describe("FeatureFlagContext", () => {
  beforeEach(() => {
    // Clear localStorage before each test to ensure isolation
    localStorage.clear();
    vi.resetAllMocks();
    const defaultResponse: Pick<Response, "ok" | "json"> = {
      ok: true,
      json: async () => ({ useShadcnUI: false }),
    };
    const defaultFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValue(defaultResponse as Response);

    vi.stubGlobal("fetch", defaultFetch);
    activeFetchMock = defaultFetch;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("FeatureFlagProvider", () => {
    it("should provide default feature flags", async () => {
      const { result } = renderHook(() => useFeatureFlag(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <FeatureFlagProvider>{children}</FeatureFlagProvider>
        ),
      });

      await waitFor(() => {
        expect(activeFetchMock).toHaveBeenCalled();
      });

      expect(result.current.flags).toEqual({
        useShadcnUI: false,
      });
    });

    it("should allow custom initial flags", async () => {
      const customFlags = { useShadcnUI: true };
      const { result } = renderHook(() => useFeatureFlag(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <FeatureFlagProvider initialFlags={customFlags}>
            {children}
          </FeatureFlagProvider>
        ),
      });

      await waitFor(() => {
        expect(activeFetchMock).toHaveBeenCalled();
      });

      expect(result.current.flags.useShadcnUI).toBe(true);
    });
  });

  describe("server synchronization", () => {
    it("should fetch server feature flags on mount and merge them", async () => {
      const fetchResponse: Pick<Response, "ok" | "json"> = {
        ok: true,
        json: async () => ({ useShadcnUI: true }),
      };
      const fetchMock = vi
        .fn<typeof fetch>()
        .mockResolvedValue(fetchResponse as Response);

      vi.stubGlobal("fetch", fetchMock);
      activeFetchMock = fetchMock;

      const { result } = renderHook(() => useFeatureFlag(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <FeatureFlagProvider>{children}</FeatureFlagProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.flags.useShadcnUI).toBe(true);
      });

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/public/feature-flags",
        expect.objectContaining({ credentials: "include" })
      );
    });

    it("should fall back to existing flags when server sync fails", async () => {
      const fetchMock = vi
        .fn<typeof fetch>()
        .mockRejectedValue(new Error("network error"));

      vi.stubGlobal("fetch", fetchMock);
      activeFetchMock = fetchMock;

      const { result } = renderHook(() => useFeatureFlag(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <FeatureFlagProvider>{children}</FeatureFlagProvider>
        ),
      });

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalled();
      });

      expect(result.current.flags.useShadcnUI).toBe(false);
    });
  });

  describe("useFeatureFlag hook", () => {
    it("should toggle a feature flag", async () => {
      const { result } = renderHook(() => useFeatureFlag(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <FeatureFlagProvider>{children}</FeatureFlagProvider>
        ),
      });

      await waitFor(() => {
        expect(activeFetchMock).toHaveBeenCalled();
      });

      expect(result.current.flags.useShadcnUI).toBe(false);

      act(() => {
        result.current.toggleFlag("useShadcnUI");
      });

      expect(result.current.flags.useShadcnUI).toBe(true);

      act(() => {
        result.current.toggleFlag("useShadcnUI");
      });

      expect(result.current.flags.useShadcnUI).toBe(false);
    });

    it("should set a specific feature flag value", async () => {
      const { result } = renderHook(() => useFeatureFlag(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <FeatureFlagProvider>{children}</FeatureFlagProvider>
        ),
      });

      await waitFor(() => {
        expect(activeFetchMock).toHaveBeenCalled();
      });

      act(() => {
        result.current.setFlag("useShadcnUI", true);
      });

      expect(result.current.flags.useShadcnUI).toBe(true);

      act(() => {
        result.current.setFlag("useShadcnUI", false);
      });

      expect(result.current.flags.useShadcnUI).toBe(false);
    });

    it("should check if a feature is enabled", async () => {
      const { result } = renderHook(() => useFeatureFlag(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <FeatureFlagProvider>{children}</FeatureFlagProvider>
        ),
      });

      await waitFor(() => {
        expect(activeFetchMock).toHaveBeenCalled();
      });

      expect(result.current.isEnabled("useShadcnUI")).toBe(false);

      act(() => {
        result.current.setFlag("useShadcnUI", true);
      });

      expect(result.current.isEnabled("useShadcnUI")).toBe(true);
    });

    it("should throw error when used outside provider", () => {
      // This test expects the hook to throw an error
      const consoleError = console.error;
      console.error = () => {
        // Suppress error output in test
      };

      expect(() => {
        renderHook(() => useFeatureFlag());
      }).toThrow("useFeatureFlag must be used within a FeatureFlagProvider");

      console.error = consoleError; // Restore console.error
    });
  });

  describe("localStorage persistence", () => {
    it("should persist feature flags to localStorage", async () => {
      const { result } = renderHook(() => useFeatureFlag(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <FeatureFlagProvider>{children}</FeatureFlagProvider>
        ),
      });

      await waitFor(() => {
        expect(activeFetchMock).toHaveBeenCalled();
      });

      act(() => {
        result.current.setFlag("useShadcnUI", true);
      });

      const stored = localStorage.getItem("featureFlags");
      expect(stored).toBeTruthy();
      if (stored) {
        const parsed = JSON.parse(stored) as { useShadcnUI: boolean };
        expect(parsed.useShadcnUI).toBe(true);
      }
    });

    it("should load feature flags from localStorage on mount", async () => {
      localStorage.setItem(
        "featureFlags",
        JSON.stringify({ useShadcnUI: true })
      );

      const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
        ok: true,
        json: async () => ({ useShadcnUI: true }),
      } as Response);

      vi.stubGlobal("fetch", fetchMock);
      activeFetchMock = fetchMock;

      const { result } = renderHook(() => useFeatureFlag(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <FeatureFlagProvider>{children}</FeatureFlagProvider>
        ),
      });

      await waitFor(() => {
        expect(activeFetchMock).toHaveBeenCalled();
      });

      expect(result.current.flags.useShadcnUI).toBe(true);
    });
  });
});
