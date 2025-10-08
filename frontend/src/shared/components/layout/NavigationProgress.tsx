import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigation } from "react-router-dom";

import { cn } from "@/shared/utils/cn";

const MIN_PROGRESS = 15;
const MAX_PROGRESS = 95;
const PROGRESS_INTERVAL = 200;
const COMPLETE_DELAY = 200;

export const NavigationProgress = ({ className }: { className?: string }) => {
  const navigation = useNavigation();
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  const isActive = useMemo(
    () => navigation.state !== "idle" || isFetching > 0 || isMutating > 0,
    [isFetching, isMutating, navigation.state]
  );

  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive) {
      setVisible(true);
      setProgress((prev) => (prev < MIN_PROGRESS ? MIN_PROGRESS : prev));

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = window.setInterval(() => {
        setProgress((prev) =>
          prev >= MAX_PROGRESS
            ? prev
            : Math.min(prev + Math.random() * 10 + 5, MAX_PROGRESS)
        );
      }, PROGRESS_INTERVAL);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }

    setProgress(100);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
      timeoutRef.current = null;
    }, COMPLETE_DELAY);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isActive]);

  useEffect(
    () => () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    []
  );

  if (!visible) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        "fixed inset-x-0 top-0 z-[1000] h-0.5 bg-transparent",
        className
      )}
      role="presentation"
    >
      <div
        className="h-full origin-left transform-gpu bg-primary/90 transition-[width,opacity] duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress > 0 ? 1 : 0,
        }}
      />
    </div>
  );
};
