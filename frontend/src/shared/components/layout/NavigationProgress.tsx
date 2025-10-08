import { useIsFetching } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigation } from "react-router-dom";

import { cn } from "@/shared/utils/cn";

const HIDE_DELAY = 250;

export const NavigationProgress = () => {
  const navigation = useNavigation();
  const isFetching = useIsFetching();
  const [isMounted, setIsMounted] = useState(false);

  const isActive = navigation.state === "loading" || isFetching > 0;

  useEffect(() => {
    if (isActive) {
      setIsMounted(true);
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsMounted(false);
    }, HIDE_DELAY);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isActive]);

  const wrapperClassName = useMemo(
    () =>
      cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[70] flex justify-center transition-opacity duration-300",
        isActive ? "opacity-100" : "opacity-0"
      ),
    [isActive]
  );

  if (!(isMounted || isActive)) {
    return null;
  }

  return (
    <div aria-hidden className={wrapperClassName}>
      <div className="mx-4 mt-2 h-1 w-full max-w-5xl overflow-hidden rounded-full bg-blue-100/80 shadow-sm">
        <div className="navigation-progress-bar h-full w-1/3 min-w-[120px] bg-blue-600" />
      </div>
    </div>
  );
};
