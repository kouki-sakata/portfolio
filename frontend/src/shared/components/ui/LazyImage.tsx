import {
  type ImgHTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useOptimizedImage } from "@/shared/hooks/useOptimizedImage";
import { cn } from "@/shared/utils/cn";

const DEFAULT_PLACEHOLDER_SRC =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

export type LazyImageProps = {
  /** 元画像のURL */
  src: string;
  /** アクセシビリティ向けの代替テキスト */
  alt: string;
  /** プレースホルダー画像 */
  placeholderSrc?: string;
  /** IntersectionObserverのrootMargin */
  rootMargin?: string;
  /** WebP変換時の品質 */
  quality?: number;
} & Pick<
  ImgHTMLAttributes<HTMLImageElement>,
  "className" | "width" | "height" | "onLoad" | "onError" | "sizes"
>;

const isBrowserEnvironment = () => typeof window !== "undefined";

export const LazyImage = ({
  src,
  alt,
  placeholderSrc = DEFAULT_PLACEHOLDER_SRC,
  className,
  rootMargin = "200px",
  quality,
  width,
  height,
  onLoad,
  onError,
  sizes,
}: LazyImageProps) => {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc);

  const optimizedImage = useOptimizedImage({
    src,
    quality,
    enabled: isVisible,
    maxWidth: typeof width === "number" ? width : undefined,
    maxHeight: typeof height === "number" ? height : undefined,
  });

  const handleIntersection = useCallback<IntersectionObserverCallback>(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      });
    },
    []
  );

  useEffect(() => {
    setCurrentSrc(placeholderSrc);
  }, [placeholderSrc]);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    setCurrentSrc(optimizedImage.src);
  }, [optimizedImage.src, isVisible]);

  useEffect(() => {
    if (!isBrowserEnvironment()) {
      return;
    }

    const node = imageRef.current;
    if (!node) {
      return;
    }

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(handleIntersection, {
        rootMargin,
      });
      observer.observe(node);

      return () => {
        observer.disconnect();
      };
    }

    setIsVisible(true);
    return;
  }, [handleIntersection, rootMargin]);

  const dataAttributes = useMemo(
    () => ({
      "data-loading-state": optimizedImage.status,
      "data-webp": optimizedImage.isWebp ? "true" : "false",
    }),
    [optimizedImage.isWebp, optimizedImage.status]
  );

  return (
    <img
      alt={alt}
      className={cn("transition-opacity duration-300", className)}
      decoding="async"
      height={height}
      loading="lazy"
      onError={onError}
      onLoad={onLoad}
      ref={imageRef}
      sizes={sizes}
      src={currentSrc}
      width={width}
      {...dataAttributes}
    />
  );
};
