import type { StampRequest, StampResponse } from "@/features/home/types";
import { httpClient } from "@/shared/api/httpClient";

export const submitStamp = async (payload: StampRequest) =>
  httpClient<StampResponse>("/home/stamps", {
    method: "POST",
    body: JSON.stringify(payload),
  });
