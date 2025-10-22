import { api } from "@/shared/api/axiosClient";
import type { SessionResponse } from "../types";

export const fetchSession = async () =>
  api.get<SessionResponse>("/auth/session");
