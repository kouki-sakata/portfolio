import { httpClient } from "@/shared/api/httpClient";

type StampRequest = {
  stampType: string;
  stampTime: string;
  nightWorkFlag: string;
};

type StampResponse = {
  message: string;
};

export const submitStamp = async (payload: StampRequest) =>
  httpClient<StampResponse>("/home/stamps", {
    method: "POST",
    body: JSON.stringify(payload),
  });
