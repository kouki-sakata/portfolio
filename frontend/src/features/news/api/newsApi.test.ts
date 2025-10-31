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
import type {
  NewsCreateRequest,
  NewsListResponse,
  NewsResponse,
  NewsUpdateRequest,
} from "@/types";

import {
  createNews,
  deleteNews,
  fetchNewsList,
  fetchPublishedNews,
  toggleNewsPublish,
  updateNews,
} from "./newsApi";

const mockedApi = vi.mocked(api);

const sampleNews = (overrides?: Partial<NewsResponse>): NewsResponse => {
  const base: NewsResponse = {
    id: 1,
    newsDate: "2025-10-01",
    title: "システムメンテナンスのお知らせ",
    content: "本日18時よりシステムメンテナンスを実施します。",
    label: "GENERAL",
    releaseFlag: true,
    updateDate: "2025-10-01T09:00:00Z",
  };

  return { ...base, ...overrides };
};

describe("newsApi", () => {
  beforeEach(() => {
    mockedApi.get.mockReset();
    mockedApi.post.mockReset();
    mockedApi.put.mockReset();
    mockedApi.patch.mockReset();
    mockedApi.delete.mockReset();
  });

  it("fetches all news", async () => {
    const response: NewsListResponse = {
      news: [sampleNews()],
    };

    mockedApi.get.mockResolvedValue(response);

    const result = await fetchNewsList();

    expect(mockedApi.get).toHaveBeenCalledWith("/news", undefined);
    expect(result).toStrictEqual(response);
  });

  it("fetches published news", async () => {
    const response: NewsListResponse = {
      news: [sampleNews({ id: 2, releaseFlag: true })],
    };

    mockedApi.get.mockResolvedValue(response);

    const result = await fetchPublishedNews();

    expect(mockedApi.get).toHaveBeenCalledWith("/news/published", undefined);
    expect(result).toStrictEqual(response);
  });

  it("creates a news entry", async () => {
    const payload: NewsCreateRequest = {
      newsDate: "2025-10-02",
      title: "臨時メンテナンス",
      content: "臨時システムメンテナンスのお知らせ",
      releaseFlag: true,
      label: "GENERAL",
    };
    const created = sampleNews({ id: 99, newsDate: payload.newsDate });
    mockedApi.post.mockResolvedValue(created);

    const result = await createNews(payload);

    expect(mockedApi.post).toHaveBeenCalledWith("/news", payload, undefined);
    expect(result).toBe(created);
  });

  it("updates an existing news entry", async () => {
    const payload: NewsUpdateRequest = {
      newsDate: "2025-10-05",
      title: "更新済みメンテナンス",
      content: "更新されたお知らせ内容",
      releaseFlag: true,
      label: "SYSTEM",
    };
    const updated = sampleNews({ id: 7, ...payload });
    mockedApi.put.mockResolvedValue(updated);

    const result = await updateNews(7, payload);

    expect(mockedApi.put).toHaveBeenCalledWith("/news/7", payload, undefined);
    expect(result).toBe(updated);
  });

  it("deletes a news entry", async () => {
    mockedApi.delete.mockResolvedValue(undefined);

    await deleteNews(8);

    expect(mockedApi.delete).toHaveBeenCalledWith("/news/8", undefined);
  });

  it("toggles publication state", async () => {
    mockedApi.patch.mockResolvedValue(undefined);

    await toggleNewsPublish(5, true);
    expect(mockedApi.patch).toHaveBeenCalledWith(
      "/news/5/publish",
      { releaseFlag: true },
      undefined
    );

    mockedApi.patch.mockClear();

    await toggleNewsPublish(5, false);
    expect(mockedApi.patch).toHaveBeenCalledWith(
      "/news/5/publish",
      { releaseFlag: false },
      undefined
    );
  });
});
