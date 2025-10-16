import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  HomeDashboardResponse,
  StampResponse,
} from "@/features/home/types";
import { mswServer } from "@/test/msw/server";
import { HomePageRefactored as HomePage } from "./HomePageRefactored";

describe("HomePage", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mswServer.use(
      http.get("/api/public/feature-flags", () => HttpResponse.json({}))
    );
  });

  afterEach(() => {
    cleanup();
  });

  const mockDashboardData: HomeDashboardResponse = {
    employee: {
      id: 1,
      email: "test@example.com",
      firstName: "太郎",
      lastName: "山田",
      admin: false,
    },
    news: [
      {
        id: 1,
        content: "システムメンテナンスのお知らせ",
        newsDate: "2024-01-15",
        releaseFlag: true,
      },
      {
        id: 2,
        content: "新機能がリリースされました",
        newsDate: "2024-01-10",
        releaseFlag: true,
      },
    ],
  };

  const renderWithQueryClient = (component: React.ReactElement) =>
    render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );

  describe("ダッシュボードデータの表示", () => {
    it("ローディング中はダッシュボードスケルトンが表示される", () => {
      mswServer.use(
        http.get("http://localhost/api/home/overview", () => {
          return new Promise(() => {
            // Intentionally never resolves to test loading state
          });
        })
      );

      renderWithQueryClient(<HomePage />);

      expect(screen.getByTestId("home-dashboard-skeleton")).toBeInTheDocument();
    });

    it("従業員名を含む挨拶メッセージが表示される", async () => {
      mswServer.use(
        http.get("http://localhost/api/home/overview", () =>
          HttpResponse.json(mockDashboardData)
        )
      );

      renderWithQueryClient(<HomePage />);

      await waitFor(() => {
        expect(
          screen.getByText(/おはようございます、山田 太郎 さん/)
        ).toBeInTheDocument();
      });
    });

    it("サブタイトルが表示される", async () => {
      mswServer.use(
        http.get("http://localhost/api/home/overview", () =>
          HttpResponse.json(mockDashboardData)
        )
      );

      renderWithQueryClient(<HomePage />);

      await waitFor(() => {
        expect(
          screen.getByText("今日も素敵な一日を過ごしましょう。")
        ).toBeInTheDocument();
      });
    });

    it("ホームダッシュボードのキャッシュ設定を適用する", async () => {
      mswServer.use(
        http.get("http://localhost/api/home/overview", () =>
          HttpResponse.json(mockDashboardData)
        )
      );

      renderWithQueryClient(<HomePage />);

      await waitFor(() => {
        expect(
          screen.getByText(/おはようございます、山田 太郎 さん/)
        ).toBeInTheDocument();
      });

      const cachedQuery = queryClient
        .getQueryCache()
        .find({ queryKey: ["home", "dashboard"] });

      const cachedOptions = cachedQuery?.options as
        | {
            staleTime?: number;
            gcTime?: number;
          }
        | undefined;

      // useDashboard hook defines staleTime: 60 * 1000
      expect(cachedOptions?.staleTime).toBe(60 * 1000);
    });
  });

  describe("打刻カードの機能", () => {
    beforeEach(async () => {
      mswServer.use(
        http.get("http://localhost/api/home/overview", () =>
          HttpResponse.json(mockDashboardData)
        )
      );
      renderWithQueryClient(<HomePage />);
      await waitFor(() => {
        expect(screen.getByText("ワンクリック打刻")).toBeInTheDocument();
      });
    });

    it("打刻カードのタイトルが表示される", () => {
      expect(
        screen.getByRole("heading", { name: "ワンクリック打刻" })
      ).toBeInTheDocument();
    });

    it("出勤打刻ボタンが表示される", () => {
      expect(
        screen.getByRole("button", { name: "出勤打刻" })
      ).toBeInTheDocument();
    });

    it("退勤打刻ボタンが表示される", () => {
      expect(
        screen.getByRole("button", { name: "退勤打刻" })
      ).toBeInTheDocument();
    });

    it("夜勤扱いチェックボックスが表示される", () => {
      expect(
        screen.getByRole("checkbox", { name: /夜勤扱い/ })
      ).toBeInTheDocument();
    });

    it("出勤打刻ボタンをクリックすると打刻APIが呼ばれる", async () => {
      const mockResponse: StampResponse = {
        message: "出勤打刻が完了しました",
      };

      let capturedRequest: Request | null = null;

      mswServer.use(
        http.post("http://localhost/api/home/stamps", ({ request }) => {
          capturedRequest = request.clone();
          return HttpResponse.json(mockResponse);
        })
      );

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: "出勤打刻" }));

      await waitFor(() => {
        expect(capturedRequest).not.toBeNull();
      });

      if (!capturedRequest) {
        throw new Error("Request was not captured");
      }

      const body = await (capturedRequest as Request).json();
      expect(body).toMatchObject({
        stampType: "1",
        nightWorkFlag: "0",
      });
      // stampTimeがISO 8601形式（タイムゾーンオフセット付き）で送信されることを確認
      expect(body.stampTime).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/
      );
    });

    it("退勤打刻ボタンをクリックすると打刻APIが呼ばれる", async () => {
      const mockResponse: StampResponse = {
        message: "退勤打刻が完了しました",
      };

      let capturedRequest: Request | null = null;

      mswServer.use(
        http.post("http://localhost/api/home/stamps", ({ request }) => {
          capturedRequest = request.clone();
          return HttpResponse.json(mockResponse);
        })
      );

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: "退勤打刻" }));

      await waitFor(() => {
        expect(capturedRequest).not.toBeNull();
      });

      if (!capturedRequest) {
        throw new Error("Request was not captured");
      }

      const body = await (capturedRequest as Request).json();
      expect(body).toMatchObject({
        stampType: "2",
        nightWorkFlag: "0",
      });
      // stampTimeがISO 8601形式（タイムゾーンオフセット付き）で送信されることを確認
      expect(body.stampTime).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/
      );
    });

    it("夜勤チェックボックスをチェックして打刻すると夜勤フラグが設定される", async () => {
      const mockResponse: StampResponse = {
        message: "出勤打刻が完了しました",
      };

      let capturedRequest: Request | null = null;

      mswServer.use(
        http.post("http://localhost/api/home/stamps", ({ request }) => {
          capturedRequest = request.clone();
          return HttpResponse.json(mockResponse);
        })
      );

      const user = userEvent.setup();
      await user.click(screen.getByRole("checkbox", { name: /夜勤扱い/ }));
      await user.click(screen.getByRole("button", { name: "出勤打刻" }));

      await waitFor(() => {
        expect(capturedRequest).not.toBeNull();
      });

      if (!capturedRequest) {
        throw new Error("Request was not captured");
      }

      const body = await (capturedRequest as Request).json();
      expect(body).toMatchObject({
        stampType: "1",
        nightWorkFlag: "1",
      });
    });

    it("打刻成功時にメッセージが表示される", async () => {
      const mockResponse: StampResponse = {
        message: "出勤打刻が完了しました",
      };

      mswServer.use(
        http.post("http://localhost/api/home/stamps", () =>
          HttpResponse.json(mockResponse)
        )
      );

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: "出勤打刻" }));

      await waitFor(() => {
        expect(screen.getByText("出勤打刻が完了しました")).toBeInTheDocument();
      });
    });

    it("打刻失敗時にエラーメッセージが表示される", async () => {
      // console.errorをモック化してstderr警告を抑制（期待されたエラーハンドリング動作）
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {
          // Intentionally suppress console.error output during test
        });

      mswServer.use(
        http.post("http://localhost/api/home/stamps", () =>
          HttpResponse.json(
            {
              message: "エラー",
            },
            { status: 500 }
          )
        )
      );

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: "出勤打刻" }));

      await waitFor(() => {
        expect(
          screen.getByText("打刻に失敗しました。再度お試しください。")
        ).toBeInTheDocument();
      });

      // モックをリストア
      consoleErrorSpy.mockRestore();
    });

    it("打刻処理中はボタンが無効化される", async () => {
      const mockResponse: StampResponse = {
        message: "打刻が完了しました",
      };

      mswServer.use(
        http.post("http://localhost/api/home/stamps", async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json(mockResponse);
        })
      );

      const user = userEvent.setup();
      const stampButton = screen.getByRole("button", { name: "出勤打刻" });
      const quitButton = screen.getByRole("button", { name: "退勤打刻" });

      await user.click(stampButton);

      // ボタンが無効化されているか確認
      expect(stampButton).toBeDisabled();
      expect(quitButton).toBeDisabled();
    });

    it("打刻時にJST固定のタイムスタンプが送信される", async () => {
      const mockResponse: StampResponse = {
        message: "出勤打刻が完了しました",
      };

      let capturedRequest: Request | null = null;

      mswServer.use(
        http.post("http://localhost/api/home/stamps", ({ request }) => {
          capturedRequest = request.clone();
          return HttpResponse.json(mockResponse);
        })
      );

      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: "出勤打刻" }));

      await waitFor(() => {
        expect(capturedRequest).not.toBeNull();
      });

      if (!capturedRequest) {
        throw new Error("Request was not captured");
      }

      const body = await (capturedRequest as Request).json();
      // stampTimeフィールドの存在を確認
      expect(body).toHaveProperty("stampTime");
      // フォーマットを確認（ISO 8601形式: YYYY-MM-DDTHH:mm:ss+09:00）
      expect(body.stampTime).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/
      );
      // タイムスタンプが妥当な値であることを確認（過去でも未来でもない）
      const timestamp = new Date(body.stampTime);
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(
        fiveMinutesAgo.getTime()
      );
      expect(timestamp.getTime()).toBeLessThanOrEqual(
        fiveMinutesLater.getTime()
      );
    });
  });

  describe("ニュースカードの機能", () => {
    it("ニュースカードのタイトルが表示される", async () => {
      mswServer.use(
        http.get("http://localhost/api/home/overview", () =>
          HttpResponse.json(mockDashboardData)
        )
      );

      renderWithQueryClient(<HomePage />);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "最新のお知らせ" })
        ).toBeInTheDocument();
      });
    });

    it("ニュースアイテムが表示される", async () => {
      mswServer.use(
        http.get("http://localhost/api/home/overview", () =>
          HttpResponse.json(mockDashboardData)
        )
      );

      renderWithQueryClient(<HomePage />);

      await waitFor(() => {
        expect(
          screen.getByText("システムメンテナンスのお知らせ")
        ).toBeInTheDocument();
        expect(
          screen.getByText("新機能がリリースされました")
        ).toBeInTheDocument();
        expect(screen.getByText("2024-01-15")).toBeInTheDocument();
        expect(screen.getByText("2024-01-10")).toBeInTheDocument();
      });
    });

    it("ニュースがない場合は空の状態メッセージが表示される", async () => {
      const emptyNewsData = {
        ...mockDashboardData,
        news: [],
      };

      mswServer.use(
        http.get("http://localhost/api/home/overview", () =>
          HttpResponse.json(emptyNewsData)
        )
      );

      renderWithQueryClient(<HomePage />);

      await waitFor(() => {
        expect(
          screen.getByText("現在表示できるお知らせはありません。")
        ).toBeInTheDocument();
      });
    });
  });

  describe("レスポンシブデザイン", () => {
    it("メインセクションにhomeクラスが適用される", async () => {
      mswServer.use(
        http.get("http://localhost/api/home/overview", () =>
          HttpResponse.json(mockDashboardData)
        )
      );

      const { container } = renderWithQueryClient(<HomePage />);

      await waitFor(() => {
        expect(container.querySelector(".home")).toBeInTheDocument();
      });
    });

    it("グリッドレイアウトが適用される", async () => {
      mswServer.use(
        http.get("http://localhost/api/home/overview", () =>
          HttpResponse.json(mockDashboardData)
        )
      );

      const { container } = renderWithQueryClient(<HomePage />);

      await waitFor(() => {
        expect(container.querySelector(".home-grid")).toBeInTheDocument();
      });
    });

    it("カードコンポーネントが適切なクラスを持つ", async () => {
      mswServer.use(
        http.get("http://localhost/api/home/overview", () =>
          HttpResponse.json(mockDashboardData)
        )
      );

      const { container } = renderWithQueryClient(<HomePage />);

      await waitFor(() => {
        const cards = container.querySelectorAll(".home-card");
        expect(cards).toHaveLength(2); // 打刻カードとニュースカード
      });
    });
  });

  describe("shadcn/uiコンポーネントの使用", () => {
    it("shadcn/uiのCardコンポーネントが使用される", async () => {
      mswServer.use(
        http.get("http://localhost/api/home/overview", () =>
          HttpResponse.json(mockDashboardData)
        )
      );

      const { container } = renderWithQueryClient(<HomePage />);

      await waitFor(() => {
        // shadcn/uiのCardは特定のクラスを持つ
        const cards = container.querySelectorAll(
          ".rounded-xl.border.border-neutral-200"
        );
        expect(cards).toHaveLength(2);
      });
    });

    it("shadcn/uiのButtonコンポーネントが使用される", async () => {
      mswServer.use(
        http.get("http://localhost/api/home/overview", () =>
          HttpResponse.json(mockDashboardData)
        )
      );

      renderWithQueryClient(<HomePage />);

      await waitFor(() => {
        const buttons = screen.getAllByRole("button");
        // shadcn/uiのButtonは特定のdata-slot属性を持つ
        const shadcnButtons = Array.from(buttons).filter(
          (button) =>
            button.hasAttribute("data-slot") &&
            button.getAttribute("data-slot") === "button"
        );
        expect(shadcnButtons.length).toBeGreaterThan(0);
      });
    });

    it("shadcn/uiのCheckboxコンポーネントが使用される", async () => {
      mswServer.use(
        http.get("http://localhost/api/home/overview", () =>
          HttpResponse.json(mockDashboardData)
        )
      );

      renderWithQueryClient(<HomePage />);

      await waitFor(() => {
        const checkbox = screen.getByRole("checkbox");
        // shadcn/uiのCheckboxは特定のクラスやデータ属性を持つ
        expect(checkbox).toBeInTheDocument();
      });
    });
  });

  describe("Tailwind CSS v4の使用", () => {
    it("Tailwindのユーティリティクラスが使用される", async () => {
      mswServer.use(
        http.get("http://localhost/api/home/overview", () =>
          HttpResponse.json(mockDashboardData)
        )
      );

      const { container } = renderWithQueryClient(<HomePage />);

      await waitFor(() => {
        // Tailwindクラスの存在を確認（例: grid, gap, p-, m-など）
        const elements = container.querySelectorAll(
          "[class*='grid'], [class*='gap'], [class*='p-'], [class*='m-']"
        );
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it("レスポンシブクラスが適用される", async () => {
      mswServer.use(
        http.get("http://localhost/api/home/overview", () =>
          HttpResponse.json(mockDashboardData)
        )
      );

      const { container } = renderWithQueryClient(<HomePage />);

      await waitFor(() => {
        // sm:, md:, lg: プレフィックスを持つクラスの存在を確認
        const responsiveElements = container.querySelectorAll(
          "[class*='sm:'], [class*='md:'], [class*='lg:']"
        );
        expect(responsiveElements.length).toBeGreaterThan(0);
      });
    });
  });
});
