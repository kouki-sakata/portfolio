import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

import { mswServer } from "@/test/msw/server";

const DEFAULT_API_BASE_URL = "http://localhost/api";

vi.stubEnv("VITE_API_BASE_URL", DEFAULT_API_BASE_URL);

// Mock ResizeObserver for Recharts（テスト実行時に幅/高さを確保する）
global.ResizeObserver = vi
  .fn()
  .mockImplementation((callback: ResizeObserverCallback) => {
    const observer = {
      observe: vi.fn().mockImplementation((target: Element) => {
        const width = (target as HTMLElement).clientWidth || 800;
        const height = (target as HTMLElement).clientHeight || 320;
        const rectValues = {
          width,
          height,
          x: 0,
          y: 0,
          top: 0,
          left: 0,
          bottom: height,
          right: width,
        } as const;
        const entry: ResizeObserverEntry = {
          target,
          contentRect: {
            ...rectValues,
            toJSON() {
              return rectValues;
            },
          } as DOMRectReadOnly,
          borderBoxSize: [
            {
              blockSize: height,
              inlineSize: width,
            },
          ] as readonly ResizeObserverSize[],
          contentBoxSize: [
            {
              blockSize: height,
              inlineSize: width,
            },
          ] as readonly ResizeObserverSize[],
          devicePixelContentBoxSize: [] as readonly ResizeObserverSize[],
        };

        callback([entry], observer as unknown as ResizeObserver);
      }),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    } as unknown as ResizeObserver;

    return observer;
  });

// jsdomではレイアウト計算が行われず幅/高さが0になるため、チャート用に擬似的な矩形サイズを返す
Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
  configurable: true,
  value() {
    return {
      width: 800,
      height: 320,
      top: 0,
      left: 0,
      right: 800,
      bottom: 320,
      x: 0,
      y: 0,
      toJSON() {
        return this;
      },
    };
  },
});

Object.defineProperty(HTMLElement.prototype, "clientWidth", {
  configurable: true,
  get() {
    return 800;
  },
});

Object.defineProperty(HTMLElement.prototype, "clientHeight", {
  configurable: true,
  get() {
    return 320;
  },
});

beforeAll(() => {
  mswServer.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  mswServer.resetHandlers();
  cleanup();
});

afterAll(() => {
  mswServer.close();
  vi.unstubAllEnvs();
});

// Unhandled promise rejectionsのハンドリング
if (typeof process !== "undefined") {
  process.on("unhandledRejection", (reason) => {
    // biome-ignore lint/suspicious/noConsole: Test environment error visibility required
    console.error("Unhandled promise rejection:", reason);
  });
}
