import type { NewsResponse } from "@/types";

export type NewsViewModel = NewsResponse & {
  /** 表示用タイトル（本文先頭行から生成） */
  title: string;
  /** 表示用カテゴリ（先頭の【カテゴリ】ラベルから生成） */
  category: string;
};

const CATEGORY_PATTERN = /^【(?<category>[^】]+)】/u;

const deriveCategory = (content: string): {
  category: string;
  normalizedContent: string;
} => {
  const match = content.match(CATEGORY_PATTERN);
  if (!match || !match.groups) {
    return { category: "一般", normalizedContent: content };
  }

  const { category } = match.groups;
  const normalizedContent = content.slice(match[0].length).trimStart();
  return {
    category: category || "一般",
    normalizedContent,
  };
};

const deriveTitle = (content: string): string => {
  const firstLine = content.split(/\r?\n/u)[0] ?? "";
  if (!firstLine) {
    return "お知らせ";
  }
  return firstLine.length > 60 ? `${firstLine.slice(0, 60)}…` : firstLine;
};

export const toNewsViewModel = (news: NewsResponse): NewsViewModel => {
  const { category, normalizedContent } = deriveCategory(news.content);
  const title = deriveTitle(normalizedContent);

  return {
    ...news,
    title,
    category,
  };
};

export const toNewsViewModelList = (
  newsList: NewsResponse[]
): NewsViewModel[] => newsList.map(toNewsViewModel);
