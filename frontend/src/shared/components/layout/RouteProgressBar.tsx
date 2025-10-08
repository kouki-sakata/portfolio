import { useIsFetching } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigation } from "react-router-dom";

import { cn } from "@/shared/utils/cn";

export const RouteProgressBar = () => {
  const navigation = useNavigation();
  const isQueryFetching = useIsFetching();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isNavigating = navigation.state !== "idle" || isQueryFetching > 0;

    if (isNavigating) {
      setVisible(true);
      return;
    }

    const timeout = window.setTimeout(() => {
      setVisible(false);
    }, 200);

    return () => window.clearTimeout(timeout);
  }, [navigation.state, isQueryFetching]);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-50 transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0"
      )}
    >
      <div className="route-progress h-1" />
    </div>
  );
};
