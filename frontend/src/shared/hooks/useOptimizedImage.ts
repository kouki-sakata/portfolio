import { useEffect, useMemo, useRef, useState } from "react";

import {
  type ConvertImageResult,
  convertImageToWebp,
} from "@/shared/utils/imageOptimization";

export type OptimizedImageStatus = "idle" | "converting" | "ready";

export type OptimizedImageResult = ConvertImageResult & {
  status: OptimizedImageStatus;
};

export type UseOptimizedImageOptions = {
  src: string;
  quality?: number;
  enabled?: boolean;
  maxWidth?: number;
  maxHeight?: number;
};

const createInitialState = (src: string): OptimizedImageResult => ({
  src,
  isWebp: false,
  status: src ? "converting" : "idle",
});

export const useOptimizedImage = ({
  src,
  quality,
  enabled = true,
  maxWidth,
  maxHeight,
}: UseOptimizedImageOptions): OptimizedImageResult => {
  const [result, setResult] = useState(() => createInitialState(src));
  const latestSrcRef = useRef(src);

  useEffect(() => {
    if (src === latestSrcRef.current) {
      return;
    }

    latestSrcRef.current = src;
    setResult(createInitialState(src));
  }, [src]);

  const conversionOptions = useMemo(
    () => ({ src, quality, maxWidth, maxHeight }),
    [src, quality, maxWidth, maxHeight]
  );

  useEffect(() => {
    if (!enabled) {
      setResult({
        src: conversionOptions.src,
        isWebp: false,
        status: "idle",
      });
      return;
    }

    let cancelled = false;

    const run = async () => {
      if (!conversionOptions.src) {
        setResult({ src: "", isWebp: false, status: "idle" });
        return;
      }

      setResult((previous) => ({
        src: previous.src || conversionOptions.src,
        isWebp: previous.isWebp,
        status: "converting",
      }));

      try {
        const converted = await convertImageToWebp(conversionOptions);

        if (cancelled) {
          return;
        }

        setResult({
          ...converted,
          status: "ready",
        });
      } catch {
        if (cancelled) {
          return;
        }

        setResult({
          src: conversionOptions.src,
          isWebp: false,
          status: "ready",
        });
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [conversionOptions, enabled]);

  return result;
};
