export type NewsStatus = "draft" | "published";

export type NewsListFilters = {
  category?: string;
  status?: NewsStatus;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type NewsItem = {
  id: number;
  title: string;
  content: string;
  category: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  authorId: number;
};

export type NewsListResponse = {
  items: NewsItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type CreateNewsInput = {
  title: string;
  content: string;
  category: string;
  publishAt?: string | null;
};

export type UpdateNewsInput = CreateNewsInput;

export type NewsPollerOptions = {
  intervalMs?: number;
  filters?: NewsListFilters;
  onUpdate: (response: NewsListResponse) => void | Promise<void>;
  onError?: (error: unknown) => void;
  immediate?: boolean;
};

export type NewsPoller = {
  stop: () => void;
};
