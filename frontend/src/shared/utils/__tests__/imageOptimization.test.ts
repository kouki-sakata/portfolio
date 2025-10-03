import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { convertImageToWebp, isWebpDataUrl } from "../imageOptimization";

type MockCanvas = {
  getContext: ReturnType<typeof vi.fn>;
  toDataURL: ReturnType<typeof vi.fn>;
  width: number;
  height: number;
};

const originalImageConstructor = globalThis.Image;
const imageConstructorKey = "Image" as const;

describe("imageOptimization utilities", () => {
  let canvasMock: MockCanvas;

  beforeEach(() => {
    canvasMock = {
      getContext: vi.fn(() => ({ drawImage: vi.fn(), clearRect: vi.fn() })),
      toDataURL: vi.fn(() => "data:image/webp;base64,optimized"),
      width: 0,
      height: 0,
    };

    const originalCreateElement = document.createElement.bind(document);

    vi.spyOn(document, "createElement").mockImplementation(
      (tagName: string) => {
        if (tagName === "canvas") {
          return canvasMock as unknown as HTMLCanvasElement;
        }
        return originalCreateElement(tagName);
      }
    );

    class MockImage {
      declare onload: (() => void) | null;

      declare onerror: ((error: ErrorEvent) => void) | null;

      declare _src: string;

      declare width: number;

      declare height: number;

      constructor() {
        this.onload = null;
        this.onerror = null;
        this._src = "";
        this.width = 1200;
        this.height = 800;
      }

      get src(): string {
        return this._src;
      }

      set src(value: string) {
        this._src = value;
        queueMicrotask(() => {
          this.onload?.();
        });
      }
    }

    const mockImageConstructor = MockImage as unknown as typeof Image;
    Reflect.set(globalThis, imageConstructorKey, mockImageConstructor);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalImageConstructor) {
      Reflect.set(globalThis, imageConstructorKey, originalImageConstructor);
    } else {
      Reflect.deleteProperty(globalThis, imageConstructorKey);
    }
  });

  it("detects WebP data URLs", () => {
    expect(isWebpDataUrl("data:image/webp;base64,foo")).toBe(true);
    expect(isWebpDataUrl("data:image/png;base64,foo")).toBe(false);
  });

  it("converts a PNG source into WebP data URL when supported", async () => {
    const result = await convertImageToWebp({
      src: "/img/photo.png",
      quality: 0.82,
    });

    expect(result).toMatchObject({
      src: "data:image/webp;base64,optimized",
      isWebp: true,
    });
    expect(canvasMock.toDataURL).toHaveBeenCalledWith("image/webp", 0.82);
  });

  it("falls back when canvas cannot encode WebP", async () => {
    canvasMock.toDataURL.mockReturnValueOnce("data:image/png;base64,noop");

    const result = await convertImageToWebp({
      src: "/img/photo.png",
      quality: 0.8,
    });

    expect(result).toMatchObject({
      src: "/img/photo.png",
      isWebp: false,
    });
  });

  it("handles conversion errors gracefully", async () => {
    canvasMock.toDataURL.mockImplementationOnce(() => {
      throw new Error("conversion failed");
    });

    const result = await convertImageToWebp({
      src: "/img/photo.png",
    });

    expect(result).toMatchObject({
      src: "/img/photo.png",
      isWebp: false,
    });
  });
});
