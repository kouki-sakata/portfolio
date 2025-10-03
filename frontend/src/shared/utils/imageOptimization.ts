const DEFAULT_QUALITY = 0.82;

export type ConvertImageInput = {
  /** 元画像のURL */
  src: string;
  /** WebP変換時の画質 (0-1) */
  quality?: number;
  /** 最大横幅（省略時は元画像のサイズを維持） */
  maxWidth?: number;
  /** 最大縦幅（省略時は元画像のサイズを維持） */
  maxHeight?: number;
};

export type ConvertImageResult = {
  /** 表示に使用する画像URL（WebP or フォールバック） */
  src: string;
  /** WebP形式に変換済みかどうか */
  isWebp: boolean;
};

const isBrowserEnvironment = () =>
  typeof window !== "undefined" && typeof document !== "undefined";

const isSvgElement = (value: Element): value is SVGElement =>
  value instanceof SVGElement;

export const isWebpDataUrl = (value: string): boolean =>
  value.startsWith("data:image/webp");

const supportsCanvas = () => {
  if (!isBrowserEnvironment()) {
    return false;
  }

  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("2d"));
  } catch {
    return false;
  }
};

const scaleDimensions = (
  width: number,
  height: number,
  { maxWidth, maxHeight }: Pick<ConvertImageInput, "maxWidth" | "maxHeight">
) => {
  let nextWidth = width;
  let nextHeight = height;

  if (maxWidth && width > maxWidth) {
    const ratio = maxWidth / width;
    nextWidth = maxWidth;
    nextHeight = Math.round(height * ratio);
  }

  if (maxHeight && nextHeight > maxHeight) {
    const ratio = maxHeight / nextHeight;
    nextHeight = maxHeight;
    nextWidth = Math.round(nextWidth * ratio);
  }

  return { width: nextWidth, height: nextHeight };
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error(`画像の読み込みに失敗しました: ${String(src)}`));

    image.decoding = "async";
    image.src = src;
  });

export const convertImageToWebp = async ({
  src,
  quality = DEFAULT_QUALITY,
  maxWidth,
  maxHeight,
}: ConvertImageInput): Promise<ConvertImageResult> => {
  if (!supportsCanvas()) {
    return { src, isWebp: false };
  }

  let canvas: HTMLCanvasElement | null = null;

  try {
    const image = await loadImage(src);
    canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      return { src, isWebp: false };
    }

    const { width, height } = scaleDimensions(image.width, image.height, {
      maxWidth,
      maxHeight,
    });

    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/webp", quality);
    if (!isWebpDataUrl(dataUrl)) {
      return { src, isWebp: false };
    }

    return { src: dataUrl, isWebp: true };
  } catch {
    return { src, isWebp: false };
  } finally {
    if (canvas && !isSvgElement(canvas)) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
};
