import { describe, expect, it, vi } from "vitest";

import { HomeRepository } from "@/features/home/repositories/HomeRepository";
import type { IHttpClient } from "@/shared/repositories/types";

const createHttpClient = (overrides: Partial<IHttpClient>): IHttpClient => ({
  get: vi.fn(),
  post: vi.fn(),
  ...overrides,
});

describe("HomeRepository", () => {
  it("/home/overview のレスポンスをreleaseFlag付きでパースする", async () => {
    const httpClient = createHttpClient({
      get: vi.fn().mockResolvedValue({
        employee: {
          id: 1,
          firstName: "山田",
          lastName: "太郎",
          email: "taro@example.com",
          admin: false,
        },
        news: [
          {
            id: 10,
            newsDate: "2025/10/01",
            content: "休暇のお知らせ",
            releaseFlag: true,
          },
        ],
      }),
    });

    const repository = new HomeRepository(httpClient);

    await expect(repository.getDashboard()).resolves.toMatchObject({
      news: [
        {
          id: 10,
          releaseFlag: true,
        },
      ],
    });
  });

  it("releaseFlag が欠けている場合は検証エラーを送出する", async () => {
    const httpClient = createHttpClient({
      get: vi.fn().mockResolvedValue({
        employee: {
          id: 1,
          firstName: "山田",
          lastName: "太郎",
          email: "taro@example.com",
          admin: false,
        },
        news: [
          {
            id: 10,
            newsDate: "2025/10/01",
            content: "休暇のお知らせ",
          },
        ],
      }),
    });

    const repository = new HomeRepository(httpClient);

    await expect(repository.getDashboard()).rejects.toThrowError();
  });
});
