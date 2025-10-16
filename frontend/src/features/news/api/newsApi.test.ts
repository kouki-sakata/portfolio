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
} from "@/types/types.gen";

import {
  createNews,
  deleteNews,
  fetchNewsList,
  fetchPublishedNewsList,
  toggleNewsPublish,
  updateNews,
} from "./newsApi";

const mockedApi = vi.mocked(api);

const sampleNews = (overrides?: Partial<NewsResponse>): NewsResponse => ({
  id: 1,
  newsDate: "2025-10-10",
  content: "メンテナンスのお知らせ",
  releaseFlag: true,
  updateDate: "2025-10-10T12:00:00Z",
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

  it("全お知らせ一覧を取得する", async () => {
    const response: NewsListResponse = {
      news: [sampleNews()],
    };

    mockedApi.get.mockResolvedValue(response);

    const result = await fetchNewsList();

    expect(mockedApi.get).toHaveBeenCalledWith("/news");
    expect(result).toStrictEqual(response);
  });

  it("公開済みお知らせ一覧を取得する", async () => {
    const response: NewsListResponse = {
      news: [sampleNews({ id: 2 })],
    };

    mockedApi.get.mockResolvedValue(response);

    const result = await fetchPublishedNewsList();

    expect(mockedApi.get).toHaveBeenCalledWith("/news/published");
    expect(result).toStrictEqual(response);
  });

  it("新規お知らせを作成する", async () => {
    const payload: NewsCreateRequest = {
      newsDate: "2025-11-01",
      content: "新機能をリリースしました",
    };
    const created = sampleNews({ id: 10, ...payload });
    mockedApi.post.mockResolvedValue(created);

    const result = await createNews(payload);

    expect(mockedApi.post).toHaveBeenCalledWith("/news", payload);
    expect(result).toBe(created);
  });

  it("既存お知らせを更新する", async () => {
    const payload: NewsUpdateRequest = {
      newsDate: "2025-11-02",
      content: "内容を更新しました",
    };
    const updated = sampleNews({ id: 7, ...payload });
    mockedApi.put.mockResolvedValue(updated);

    const result = await updateNews(7, payload);

    expect(mockedApi.put).toHaveBeenCalledWith("/news/7", payload);
    expect(result).toBe(updated);
  });

  it("お知らせを削除する", async () => {
    mockedApi.delete.mockResolvedValue(undefined);

    await deleteNews(5);

    expect(mockedApi.delete).toHaveBeenCalledWith("/news/5");
  });

  it("公開状態を切り替える", async () => {
    const toggled = sampleNews({ releaseFlag: false });
    mockedApi.patch.mockResolvedValue(toggled);

    const result = await toggleNewsPublish(3, false);

    expect(mockedApi.patch).toHaveBeenCalledWith("/news/3/publish", {
      releaseFlag: false,
    });
    expect(result).toBe(toggled);
  });
});
