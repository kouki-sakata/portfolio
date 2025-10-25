import { api } from "@/shared/api/axiosClient";

export const logout = async () => {
  await api.post<void>("/auth/logout");
};
