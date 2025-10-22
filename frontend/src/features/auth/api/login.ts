import { api } from "@/shared/api/axiosClient";
import type { LoginRequest, LoginResponse } from "../types";

export const login = async (payload: LoginRequest) =>
  api.post<LoginResponse>("/auth/login", payload);
