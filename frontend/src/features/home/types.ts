import type { EmployeeSummary } from "@/features/auth/types";

export type HomeNewsItem = {
  id: number;
  content: string;
  newsDate: string;
  released: boolean;
};

export type HomeDashboardResponse = {
  employee: EmployeeSummary;
  news: HomeNewsItem[];
};

export type StampRequest = {
  stampType: "1" | "2";
  stampTime: string;
  nightWorkFlag: "0" | "1";
};

export type StampResponse = {
  message: string;
  success: boolean;
};
