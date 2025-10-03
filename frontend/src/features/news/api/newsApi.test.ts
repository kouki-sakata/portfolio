import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/api/axiosClient", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from "@/shared/api/axiosClient";
import type { NewsItem, NewsListResponse } from "@/features/news/types";

import {
  createNews,
  createNewsPoller,
  deleteNews,
  fetchNewsList,
  setNewsPublicationStatus,
  updateNews,
} from "./newsApi";

const mockedApi = vi.mocked(api);

const sampleNews = (overrides?: Partial<NewsItem>): NewsItem => ({
  id: 1,
  title: "System maintenance",
  content: "We will perform maintenance tonight.",
  category: "maintenance",
  published: true,
  publishedAt: "2025-01-01T00:00:00Z",
  createdAt: "2024-12-31T10:00:00Z",
  updatedAt: "2024-12-31T12:00:00Z",
  authorId: 42,
  ...overrides,
});

describe("newsApi", () => {
  beforeEach(() => {
    mockedApi.get.mockReset();
    mockedApi.post.mockReset();
    mockedApi.put.mockReset();
    mockedApi.patch.mockReset();
    mockedApi.delete.mockReset();
  });

  it("fetches news list with filters", async () => {
    const response: NewsListResponse = {
      items: [sampleNews()],
      page: 2,
      pageSize: 50,
      total: 120,
    };

    mockedApi.get.mockResolvedValue(response);

    const result = await fetchNewsList({
      category: "maintenance",
      status: "published",
      search: "system",
      page: 2,
      pageSize: 50,
    });

    expect(mockedApi.get).toHaveBeenCalledWith("/api/news", {
      params: {
        category: "maintenance",
        published: true,
        search: "system",
        page: 2,
        size: 50,
      },
    });
    expect(result).toStrictEqual(response);
  });

  it("creates a news entry", async () => {
    const payload = {
      title: "Outage notice",
      content: "Service will be unavailable.",
      category: "maintenance",
      publishAt: "2025-02-01T01:00:00Z",
    };
    const created = sampleNews({ id: 99, title: payload.title });
    mockedApi.post.mockResolvedValue(created);

    const result = await createNews(payload);

    expect(mockedApi.post).toHaveBeenCalledWith("/api/news", {
      data: payload,
    });
    expect(result).toBe(created);
  });

  it("updates an existing news entry", async () => {
    const updated = sampleNews({
      id: 7,
      title: "Updated title",
      content: "Updated content",
    });
    mockedApi.put.mockResolvedValue(updated);

    const result = await updateNews(7, {
      title: updated.title,
      content: updated.content,
      category: updated.category,
      publishAt: updated.publishedAt,
    });

    expect(mockedApi.put).toHaveBeenCalledWith("/api/news/7", {
      data: {
        title: updated.title,
        content: updated.content,
        category: updated.category,
        publishAt: updated.publishedAt,
      },
    });
    expect(result).toBe(updated);
  });

  it("deletes a news entry", async () => {
    mockedApi.delete.mockResolvedValue(undefined);

    await deleteNews(8);

    expect(mockedApi.delete).toHaveBeenCalledWith("/api/news/8");
  });

  it("updates publication status", async () => {
    mockedApi.patch.mockResolvedValue(undefined);

    await setNewsPublicationStatus(5, true);
    expect(mockedApi.patch).toHaveBeenCalledWith("/api/news/5/status", {
      data: { published: true },
    });

    mockedApi.patch.mockClear();

    await setNewsPublicationStatus(5, false);
    expect(mockedApi.patch).toHaveBeenCalledWith("/api/news/5/status", {
      data: { published: false },
    });
  });

  it("polls news updates at the configured interval", async () => {
    vi.useFakeTimers();

    const firstResponse: NewsListResponse = {
      items: [sampleNews({ id: 1 })],
      page: 1,
      pageSize: 20,
      total: 1,
    };
    const secondResponse: NewsListResponse = {
      items: [sampleNews({ id: 2 })],
      page: 1,
      pageSize: 20,
      total: 1,
    };

    mockedApi.get.mockResolvedValueOnce(firstResponse);
    mockedApi.get.mockResolvedValueOnce(secondResponse);

    const onUpdate = vi.fn();
    const poller = createNewsPoller({
      intervalMs: 1000,
      onUpdate,
      filters: { category: "maintenance" },
    });

    await vi.advanceTimersByTimeAsync(0);
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenLastCalledWith(firstResponse);

    await vi.advanceTimersByTimeAsync(1000);
    expect(onUpdate).toHaveBeenCalledTimes(2);
    expect(onUpdate).toHaveBeenLastCalledWith(secondResponse);

    poller.stop();

    await vi.advanceTimersByTimeAsync(2000);
    expect(onUpdate).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it("notifies via onError when polling fails", async () => {
    vi.useFakeTimers();

    const pollingError = new Error("fetch failed");
    const recoveryResponse: NewsListResponse = {
      items: [sampleNews({ id: 3 })],
      page: 1,
      pageSize: 20,
      total: 1,
    };

    mockedApi.get.mockRejectedValueOnce(pollingError);
    mockedApi.get.mockResolvedValueOnce(recoveryResponse);

    const onUpdate = vi.fn();
    const onError = vi.fn();

    createNewsPoller({
      intervalMs: 1000,
      onUpdate,
      onError,
    });

    await vi.advanceTimersByTimeAsync(0);
    expect(onError).toHaveBeenCalledWith(pollingError);

    await vi.advanceTimersByTimeAsync(1000);
    expect(onUpdate).toHaveBeenCalledWith(recoveryResponse);

    vi.useRealTimers();
  });
});
