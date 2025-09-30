import type {
  DeleteStampRequest,
  StampHistoryResponse,
  UpdateStampRequest,
} from "@/features/stampHistory/types";
import { httpClient } from "@/shared/api/httpClient";

export const fetchStampHistory = async (params: {
  year?: string;
  month?: string;
}) => {
  const url = new URLSearchParams();
  if (params.year) {
    url.set("year", params.year);
  }
  if (params.month) {
    url.set("month", params.month);
  }
  const query = url.toString();
  const path = query ? `/stamp-history?${query}` : "/stamp-history";
  return await httpClient<StampHistoryResponse>(path);
};

export const updateStamp = async (payload: UpdateStampRequest) =>
  httpClient<void>(`/stamp/${payload.id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const deleteStamp = async (payload: DeleteStampRequest) =>
  httpClient<void>(`/stamp/${payload.id}`, {
    method: "DELETE",
  });
