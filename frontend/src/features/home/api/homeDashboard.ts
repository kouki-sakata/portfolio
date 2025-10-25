import type { HomeDashboardResponse } from "@/features/home/types";
import { api } from "@/shared/api/axiosClient";

export const getHomeDashboard = async () =>
  api.get<HomeDashboardResponse>("/home/overview");
