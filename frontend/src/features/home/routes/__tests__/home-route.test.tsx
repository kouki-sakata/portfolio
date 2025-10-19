import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HomeRoute } from "@/features/home/routes/HomeRoute";
import { newsQueryKeys } from "@/features/news/hooks/useNews";
import { queryKeys } from "@/shared/utils/queryUtils";

describe("HomeRoute", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders call to action", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    queryClient.setQueryData(queryKeys.home.dashboard(), {
      employee: {
        id: 1,
        firstName: "太郎",
        lastName: "山田",
        email: "taro@example.com",
        admin: false,
      },
      news: [],
    });

    queryClient.setQueryData(newsQueryKeys.published(), { news: [] });

    render(
      <QueryClientProvider client={queryClient}>
        <HomeRoute />
      </QueryClientProvider>
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "おはようございます、山田 太郎 さん",
      })
    ).toBeInTheDocument();
  });
});
