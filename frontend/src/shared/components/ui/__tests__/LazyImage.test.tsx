import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useOptimizedImage } from "@/shared/hooks/useOptimizedImage";
import { LazyImage } from "../LazyImage";

type MockObserver = {
  observe: ReturnType<typeof vi.fn>;
  unobserve: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
};

vi.mock("@/shared/hooks/useOptimizedImage", () => ({
  useOptimizedImage: vi.fn(),
}));

describe("LazyImage", () => {
  let intersectionCallback: IntersectionObserverCallback;
  let observerMock: MockObserver;

  beforeEach(() => {
    observerMock = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    };

    class TestIntersectionObserver implements IntersectionObserver {
      readonly root = null;

      readonly rootMargin = "0px";

      readonly thresholds = [] as number[];

      constructor(callback: IntersectionObserverCallback) {
        intersectionCallback = callback;
      }

      disconnect(): void {
        observerMock.disconnect();
      }

      observe(): void {
        observerMock.observe();
      }

      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }

      unobserve(): void {
        observerMock.unobserve();
      }
    }

    vi.stubGlobal("IntersectionObserver", TestIntersectionObserver);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("遅延読み込みでプレースホルダーから最適化済み画像に切り替える", async () => {
    const optimizedSrc = "data:image/webp;base64,optimized";

    (useOptimizedImage as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      src: optimizedSrc,
      isWebp: true,
      status: "ready",
    });

    render(
      <LazyImage
        alt="勤怠管理"
        placeholderSrc="/img/placeholder.png"
        src="/img/dashboard.png"
      />
    );

    const img = screen.getByRole("img", {
      name: "勤怠管理",
    }) as HTMLImageElement;

    expect(img.getAttribute("src")).toBe("/img/placeholder.png");
    expect(img.getAttribute("loading")).toBe("lazy");

    await act(async () => {
      intersectionCallback?.(
        [
          {
            isIntersecting: true,
            intersectionRatio: 1,
            target: img,
            time: performance.now(),
            boundingClientRect: img.getBoundingClientRect(),
            intersectionRect: img.getBoundingClientRect(),
            rootBounds: null,
          } satisfies IntersectionObserverEntry,
        ],
        new IntersectionObserver(() => {})
      );
    });

    expect(img.getAttribute("src")).toBe(optimizedSrc);
    expect(observerMock.disconnect).toHaveBeenCalled();
  });

  it("最適化できない場合は元の画像にフォールバックする", async () => {
    (useOptimizedImage as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      src: "/img/dashboard.png",
      isWebp: false,
      status: "ready",
    });

    render(
      <LazyImage
        alt="勤怠管理"
        placeholderSrc="/img/placeholder.png"
        src="/img/dashboard.png"
      />
    );

    const img = screen.getByRole("img", {
      name: "勤怠管理",
    }) as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("/img/placeholder.png");

    await act(async () => {
      intersectionCallback?.(
        [
          {
            isIntersecting: true,
            intersectionRatio: 1,
            target: img,
            time: performance.now(),
            boundingClientRect: img.getBoundingClientRect(),
            intersectionRect: img.getBoundingClientRect(),
            rootBounds: null,
          } satisfies IntersectionObserverEntry,
        ],
        new IntersectionObserver(() => {})
      );
    });

    expect(img.getAttribute("src")).toBe("/img/dashboard.png");
  });
});
