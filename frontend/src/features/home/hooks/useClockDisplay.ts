import { useCallback, useEffect, useMemo, useState } from "react";

import {
  CLOCK_FALLBACK_MESSAGE,
  formatClockDisplay,
} from "@/features/home/lib/clockFormat";
import { formatLocalTimestamp } from "@/shared/utils/date";

export type ClockDisplayStatus = "ready" | "error";

export type ClockDisplayState = {
  displayText: string;
  isoNow: string;
  status: ClockDisplayStatus;
  resetError: () => void;
};

type ClockSnapshot = {
  displayText: string;
  isoNow: string;
  status: ClockDisplayStatus;
};

const CLOCK_INTERVAL_MS = 1000;

const createInitialSnapshot = (): ClockSnapshot => {
  try {
    const iso = formatLocalTimestamp();
    const display = formatClockDisplay(iso);

    return {
      displayText: display,
      isoNow: iso,
      status: "ready",
    };
  } catch {
    return {
      displayText: CLOCK_FALLBACK_MESSAGE,
      isoNow: "",
      status: "error",
    };
  }
};

/**
 * 時計の表示状態を管理するフック
 * 1秒ごとに更新され、表示用のテキストとISO形式の日時を提供します。
 *
 * このフックは表示のみを担当し、タイムスタンプのキャプチャは
 * useCaptureTimestampフックで行います。
 */
export const useClockDisplay = (): ClockDisplayState => {
  const initialSnapshot = useMemo(createInitialSnapshot, []);
  const [clock, setClock] = useState(initialSnapshot);

  const updateClock = useCallback((): void => {
    try {
      const iso = formatLocalTimestamp();
      const display = formatClockDisplay(iso);

      setClock({
        displayText: display,
        isoNow: iso,
        status: "ready",
      });
    } catch {
      setClock((prev) => ({
        ...prev,
        displayText: CLOCK_FALLBACK_MESSAGE,
        status: "error",
      }));
    }
  }, []);

  useEffect(() => {
    // パフォーマンス最適化: Page Visibility APIで非表示時は更新を停止
    let id: number | undefined;

    const startInterval = () => {
      if (id !== undefined) {
        window.clearInterval(id);
      }
      id = window.setInterval(updateClock, CLOCK_INTERVAL_MS);
    };

    const stopInterval = () => {
      if (id !== undefined) {
        window.clearInterval(id);
        id = undefined;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopInterval();
      } else {
        updateClock(); // 即座に更新
        startInterval();
      }
    };

    // 初回起動
    startInterval();

    // Visibility変更イベントリスナー
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      stopInterval();
      if (typeof document !== "undefined") {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
      }
    };
  }, [updateClock]);

  const resetError = useCallback(() => {
    updateClock();
  }, [updateClock]);

  return {
    displayText: clock.displayText,
    isoNow: clock.isoNow,
    status: clock.status,
    resetError,
  };
};
