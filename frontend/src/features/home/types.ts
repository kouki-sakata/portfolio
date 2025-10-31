import type { EmployeeSummary } from "@/features/auth/types";
import type { NewsResponse } from "@/types";

export type HomeNewsItem = Pick<
  NewsResponse,
  "id" | "title" | "content" | "label" | "newsDate" | "releaseFlag" | "updateDate"
>;

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
};
