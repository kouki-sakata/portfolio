import { httpClient } from "@/shared/api/httpClient";

import type { SessionResponse } from "../types";

export const fetchSession = async () =>
  httpClient<SessionResponse>("/auth/session");
