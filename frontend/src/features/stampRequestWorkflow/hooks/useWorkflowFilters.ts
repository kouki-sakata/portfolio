import { useCallback, useState } from "react";

import type { MyRequestFilters } from "@/features/stampRequestWorkflow/hooks/useStampRequests";

const DEFAULT_FILTERS: MyRequestFilters = {
  status: "ALL",
  page: 0,
  pageSize: 20,
  search: "",
  sort: "recent",
};

export const useWorkflowFilters = (initial?: Partial<MyRequestFilters>) => {
  const [filters, setFilters] = useState<MyRequestFilters>({
    ...DEFAULT_FILTERS,
    ...initial,
  });

  const setStatus = useCallback((status: string) => {
    setFilters((prev) => ({ ...prev, status, page: 0 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 0 }));
  }, []);

  const setSort = useCallback((sort: string) => {
    setFilters((prev) => ({ ...prev, sort, page: 0 }));
  }, []);

  const reset = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS, ...initial });
  }, [initial]);

  return {
    filters,
    setStatus,
    setPage,
    setSearch,
    setSort,
    reset,
  };
};
