import type { NewsResponse } from "@/types";

const LABEL_DISPLAY_MAP: Record<NewsResponse["label"], string> = {
  IMPORTANT: "重要",
  SYSTEM: "システム",
  GENERAL: "一般",
};

const LINE_BREAK_PATTERN = /\r?\n/u;

const normalizeTitle = (title: string | undefined, content: string): string => {
  const trimmed = title?.trim();
  if (trimmed) {
    return trimmed;
  }
  const firstLine = content.split(LINE_BREAK_PATTERN)[0] ?? "";
  if (!firstLine) {
    return "お知らせ";
  }
  return firstLine.length > 60 ? `${firstLine.slice(0, 60)}…` : firstLine;
};

export type NewsViewModel = NewsResponse & {
  /** 日本語表示用のラベル */
  labelDisplay: string;
};

export const toNewsViewModel = (news: NewsResponse): NewsViewModel => {
  const labelCode: NewsResponse["label"] = news.label ?? "GENERAL";
  const labelDisplay = LABEL_DISPLAY_MAP[labelCode];
  const resolvedTitle = normalizeTitle(news.title, news.content);

  return {
    ...news,
    title: resolvedTitle,
    label: labelCode,
    labelDisplay,
  } satisfies NewsViewModel;
};

export const toNewsViewModelList = (
  newsList: NewsResponse[]
): NewsViewModel[] => newsList.map(toNewsViewModel);
