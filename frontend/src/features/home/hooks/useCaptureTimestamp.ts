import { useCallback, useRef, useState } from "react";
import { formatLocalTimestamp } from "@/shared/utils/date";

export type CaptureTimestampState = {
  captureTimestamp: () => string;
  lastCaptured?: string;
};

/**
 * タイムスタンプをキャプチャするためのフック
 *
 * このフックは安定した参照を持つcaptureTimestamp関数を提供し、
 * 親コンポーネントの不要な再レンダリングを防ぎます。
 */
export const useCaptureTimestamp = (): CaptureTimestampState => {
  const [lastCaptured, setLastCaptured] = useState<string | undefined>();
  const latestIsoRef = useRef<string | undefined>(undefined);

  const captureTimestamp = useCallback((): string => {
    try {
      const iso = formatLocalTimestamp();
      latestIsoRef.current = iso;
      setLastCaptured(iso);
      return iso;
    } catch {
      // フォールバック: Date.now() を使用
      const iso = new Date().toISOString();
      latestIsoRef.current = iso;
      setLastCaptured(iso);
      return iso;
    }
  }, []);

  return {
    captureTimestamp,
    lastCaptured,
  };
};
