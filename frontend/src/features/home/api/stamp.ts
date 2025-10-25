import type { StampRequest, StampResponse } from "@/features/home/types";
import { api } from "@/shared/api/axiosClient";

export const submitStamp = async (payload: StampRequest) =>
  api.post<StampResponse>("/home/stamps", payload);
