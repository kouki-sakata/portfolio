// Test helper functions for home dashboard API
import type { HomeDashboardResponse } from "@/features/home/types";
import { getHomeDashboard } from "./homeDashboard";

// Wrapper function with the expected name for tests
export const getDashboardData = async (): Promise<HomeDashboardResponse> =>
  getHomeDashboard();
