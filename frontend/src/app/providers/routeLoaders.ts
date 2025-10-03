import type { QueryClient } from "@tanstack/react-query";

import { QUERY_CONFIG } from "@/app/config/queryClient";
import { fetchEmployees } from "@/features/employees/api";
import { getHomeDashboard } from "@/features/home/api/homeDashboard";
import { fetchStampHistory } from "@/features/stampHistory/api";
import { queryKeys } from "@/shared/utils/queryUtils";

export const homeRouteLoader = async (queryClient: QueryClient) =>
  queryClient.prefetchQuery({
    queryKey: queryKeys.home.dashboard(),
    queryFn: getHomeDashboard,
    staleTime: QUERY_CONFIG.homeDashboard.staleTime,
    gcTime: QUERY_CONFIG.homeDashboard.gcTime,
  });

export const employeeAdminRouteLoader = async (queryClient: QueryClient) =>
  queryClient.prefetchQuery({
    queryKey: queryKeys.employees.list(),
    queryFn: () => fetchEmployees(false),
    staleTime: QUERY_CONFIG.employees.staleTime,
    gcTime: QUERY_CONFIG.employees.gcTime,
  });

export const stampHistoryRouteLoader = async (queryClient: QueryClient) =>
  queryClient.prefetchQuery({
    queryKey: queryKeys.stampHistory.list(),
    queryFn: () => fetchStampHistory({}),
    staleTime: QUERY_CONFIG.stampHistory.staleTime,
    gcTime: QUERY_CONFIG.stampHistory.gcTime,
  });
