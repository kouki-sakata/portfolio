import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  CLOCK_FALLBACK_MESSAGE,
  formatClockDisplay,
} from "@/features/home/lib/clockFormat";
import { formatLocalTimestamp } from "@/shared/utils/date";

export type HomeClockStatus = "ready" | "error";

export type HomeClockState = {
  displayText: string;
  isoNow: string;
  status: HomeClockStatus;
  captureTimestamp: () => string;
  lastCaptured?: string;
  resetError: () => void;
};

type ClockSnapshot = {
  state: Omit<HomeClockState, "captureTimestamp" | "resetError">;
  isoRef?: string;
};

const CLOCK_INTERVAL_MS = 1000;

const createInitialSnapshot = (): ClockSnapshot => {
  try {
    const iso = formatLocalTimestamp();
    const display = formatClockDisplay(iso);

    return {
      state: {
        displayText: display,
        isoNow: iso,
        status: "ready",
        lastCaptured: undefined,
      },
      isoRef: iso,
    } satisfies ClockSnapshot;
  } catch {
    return {
      state: {
        displayText: CLOCK_FALLBACK_MESSAGE,
        isoNow: "",
        status: "error",
        lastCaptured: undefined,
      },
      isoRef: undefined,
    } satisfies ClockSnapshot;
  }
};

export const useHomeClock = (): HomeClockState => {
  const initialSnapshot = useMemo(createInitialSnapshot, []);
  const [clock, setClock] = useState(initialSnapshot.state);
  const latestIsoRef = useRef<string | undefined>(initialSnapshot.isoRef);

  const updateClock = useCallback((): string | undefined => {
    try {
      const iso = formatLocalTimestamp();
      const display = formatClockDisplay(iso);

      latestIsoRef.current = iso;
      setClock((prev) => ({
        ...prev,
        displayText: display,
        isoNow: iso,
        status: "ready",
      }));

      return iso;
    } catch {
      setClock((prev) => ({
        ...prev,
        displayText: CLOCK_FALLBACK_MESSAGE,
        status: "error",
      }));
      return;
    }
  }, []);

  useEffect(() => {
    const id = window.setInterval(updateClock, CLOCK_INTERVAL_MS);

    return () => {
      window.clearInterval(id);
    };
  }, [updateClock]);

  const captureTimestamp = useCallback((): string => {
    let iso = latestIsoRef.current;

    if (!iso) {
      iso = updateClock();
    }

    if (!iso) {
      iso = new Date().toISOString();
      latestIsoRef.current = iso;
    }

    setClock((prev) => ({ ...prev, lastCaptured: iso }));

    return iso;
  }, [updateClock]);

  const resetError = useCallback(() => {
    updateClock();
  }, [updateClock]);

  return {
    displayText: clock.displayText,
    isoNow: clock.isoNow,
    status: clock.status,
    captureTimestamp,
    lastCaptured: clock.lastCaptured,
    resetError,
  };
};
