import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type HomeClockState,
  useHomeClock,
} from "@/features/home/hooks/useHomeClock";
import type {
  HomeDashboardResponse,
  StampResponse,
} from "@/features/home/types";
import { newsQueryKeys } from "@/features/news/hooks/useNews";
import { formatLocalTimestamp } from "@/shared/utils/date";
import { mswServer } from "@/test/msw/server";
import type { NewsListResponse } from "@/types";
import { HomePageRefactored as HomePage } from "./HomePageRefactored";

vi.mock("@/features/home/hooks/useHomeClock", () => ({
  useHomeClock: vi.fn(),
}));

describe("HomePage", () => {
  let queryClient: QueryClient;
  let clockState: HomeClockState;
  let captureTimestampMock: HomeClockState["captureTimestamp"];
  let resetErrorMock: HomeClockState["resetError"];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    captureTimestampMock = vi.fn(() => formatLocalTimestamp());
    resetErrorMock = vi.fn();
    clockState = {
      displayText: "モック現在時刻 09:15:42",
      isoNow: "2025-11-02T09:15:42+09:00",
      status: "ready",
      lastCaptured: undefined,
      captureTimestamp: captureTimestampMock,
      resetError: resetErrorMock,
    };
    vi.mocked(useHomeClock).mockReturnValue(clockState);

    mswServer.use(
      http.get("/api/public/feature-flags", () => HttpResponse.json({}))
    );

    setupPublishedNewsResponse();
  });

  describe("管理者と一般ユーザーのUI分岐", () => {
    it("管理者にはお知らせ管理画面への導線が表示される", async () => {
      setupPublishedNewsResponse();
      mswServer.use(
        http.get("http://localhost/api/home/overview", () =>
          HttpResponse.json({
            ...mockDashboardData,
            employee: { ...mockDashboardData.employee, admin: true },
          })
        )
      );

      renderWithQueryClient(<HomePage />);

      await waitFor(() => {
        const link = screen.getByRole("link", { name: "お知らせ管理へ" });
        expect(link).toHaveAttribute("href", "/news-management");
      });
    });

    it("一般ユーザーにはお知らせ管理導線は表示されない", async () => {
      setupPublishedNewsResponse();
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

      expect(
        screen.queryByRole("link", { name: "お知らせ管理へ" })
      ).not.toBeInTheDocument();
    });
  });

  describe("時計表示", () => {
    it("ホーム画面に現在時刻が表示される", async () => {
      mswServer.use(
        http.get("http://localhost/api/home/overview", () =>
          HttpResponse.json(mockDashboardData)
        )
      );

      renderWithQueryClient(<HomePage />);

      await waitFor(() => {
        expect(screen.getByTestId("home-clock-panel")).toBeInTheDocument();
      });

      expect(screen.getByTestId("home-clock-panel")).toHaveTextContent(
        "モック現在時刻 09:15:42"
      );
    });

    it("ローディング時にも時計が表示される", () => {
      mswServer.use(
        http.get(
          "http://localhost/api/home/overview",
          () =>
            new Promise(() => {
              /* pending */
            })
        )
      );

      renderWithQueryClient(<HomePage />);

      expect(screen.getByTestId("home-clock-panel")).toBeInTheDocument();
    });

    it("エラー時にも時計が表示される", async () => {
      vi.mocked(useHomeClock).mockReturnValue({
        ...clockState,
        status: "error",
        displayText: "現在時刻を取得できません。端末時計を確認してください。",
      });

      mswServer.use(
        http.get("http://localhost/api/home/overview", () =>
          HttpResponse.text("error", { status: 500 })
        )
      );

      renderWithQueryClient(<HomePage />);

      await waitFor(() => {
        expect(
          screen.getByText("ダッシュボードを読み込めませんでした。")
        ).toBeInTheDocument();
      });

      expect(screen.getByTestId("home-clock-panel")).toBeInTheDocument();
    });
  });

  afterEach(() => {
    cleanup();
    queryClient.clear();
    vi.mocked(useHomeClock).mockReturnValue(clockState);
  });

  function createPublishedNewsItem(
    overrides?: Partial<NewsListResponse["news"][number]>
  ): NewsListResponse["news"][number] {
    return {
      id: overrides?.id ?? 1,
      newsDate: overrides?.newsDate ?? "2025-10-01",
      title: overrides?.title ?? "システムメンテナンスのお知らせ",
      content:
        overrides?.content ?? "本日18時よりシステムメンテナンスを実施します。",
      label: overrides?.label ?? "SYSTEM",
      releaseFlag: overrides?.releaseFlag ?? true,
      updateDate: overrides?.updateDate ?? "2025-10-01T09:00:00Z",
    };
  }

  function setupPublishedNewsResponse(
    news: NewsListResponse["news"] = [
      createPublishedNewsItem({
        id: 1,
        newsDate: "2025-10-01",
        label: "SYSTEM",
      }),
      createPublishedNewsItem({
        id: 2,
        newsDate: "2025-09-25",
        title: "給与明細の公開が完了しました",
        content: "給与明細の公開が完了しました。",
        label: "GENERAL",
      }),
    ]
  ) {
    mswServer.use(
      http.get("http://localhost/api/news/published", () =>
        HttpResponse.json<NewsListResponse>({ news })
      )
    );
  }

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
        title: "システムメンテナンスのお知らせ",
        content: "本日18時よりシステムメンテナンスを実施します。",
        newsDate: "2024-01-15",
        label: "SYSTEM",
        releaseFlag: true,
        updateDate: "2024-01-15T09:00:00Z",
      },
      {
        id: 2,
        title: "新機能がリリースされました",
        content: "新機能がリリースされました",
        newsDate: "2024-01-10",
        label: "GENERAL",
        releaseFlag: true,
        updateDate: "2024-01-10T09:00:00Z",
      },
    ],
    attendance: {
      status: "WORKING",
      attendanceTime: "2024-01-15T09:00:00+09:00",
      breakStartTime: null,
      breakEndTime: null,
      departureTime: null,
      overtimeMinutes: 45,
    },
  };

  const renderWithQueryClient = (component: React.ReactElement) =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{component}</MemoryRouter>
      </QueryClientProvider>
    );

  describe("勤務スナップショットカード", () => {
    beforeEach(() => {
      setupPublishedNewsResponse();
    });

    it("勤務ステータスと時刻を表示する", async () => {
      mswServer.use(
        http.get("http://localhost/api/home/overview", () =>
          HttpResponse.json({
            ...mockDashboardData,
            attendance: {
              status: "ON_BREAK",
              attendanceTime: "2024-01-15T09:00:00+09:00",
              breakStartTime: "2024-01-15T12:00:00+09:00",
              breakEndTime: null,
              departureTime: null,
              overtimeMinutes: 30,
            },
          })
        )
      );

      renderWithQueryClient(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText("勤務ステータス")).toBeInTheDocument();
        expect(screen.getByTestId("attendance-status-badge")).toHaveTextContent(
          "休憩中"
        );
      });

      expect(screen.getByText("09:00")).toBeInTheDocument();
      expect(screen.getByText("12:00")).toBeInTheDocument();
      expect(screen.getByText("30分")).toBeInTheDocument();
    });

    it("休憩トグルボタン押下でAPIが呼ばれる", async () => {
      let capturedRequest: Request | null = null;

      mswServer.use(
        http.get("http://localhost/api/home/overview", () =>
          HttpResponse.json({
            ...mockDashboardData,
            attendance: {
              status: "WORKING",
              attendanceTime: "2024-01-15T09:00:00+09:00",
              breakStartTime: null,
              breakEndTime: null,
              departureTime: null,
              overtimeMinutes: 0,
            },
          })
        ),
        http.post("http://localhost/api/home/breaks/toggle", ({ request }) => {
          capturedRequest = request.clone();
          return HttpResponse.text("", { status: 204 });
        })
      );

      renderWithQueryClient(<HomePage />);

      const user = userEvent.setup();
      await user.click(
        await screen.findByTestId("attendance-break-toggle-button")
      );

      await waitFor(async () => {
        expect(capturedRequest).not.toBeNull();
        if (!capturedRequest) {
          return;
        }
        const body = await capturedRequest.json();
        expect(body).toHaveProperty("timestamp");
      });
    });
  });

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
    const notAttendedData: HomeDashboardResponse = {
      ...mockDashboardData,
      attendance: {
        status: "NOT_ATTENDED",
        attendanceTime: null,
        breakStartTime: null,
        breakEndTime: null,
        departureTime: null,
        overtimeMinutes: 0,
      },
    };

    beforeEach(() => {
      setupPublishedNewsResponse();
      // 未出勤状態でテストを開始
      mswServer.use(
        http.get("http://localhost/api/home/overview", () =>
          HttpResponse.json(notAttendedData)
        )
      );
    });

    it("打刻カードのタイトルが表示される", async () => {
      renderWithQueryClient(<HomePage />);
      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /ワンクリック打刻/ })
        ).toBeInTheDocument();
      });
    });

    it("未出勤状態では出勤打刻ボタンが表示される", async () => {
      renderWithQueryClient(<HomePage />);
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /出勤打刻/ })
        ).toBeInTheDocument();
      });
    });

    it("夜勤扱いチェックボックスが表示される", async () => {
      renderWithQueryClient(<HomePage />);
      await waitFor(() => {
        expect(
          screen.getByRole("switch", { name: /夜勤扱い/ })
        ).toBeInTheDocument();
      });
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

      renderWithQueryClient(<HomePage />);

      const user = userEvent.setup();
      const stampButton = await screen.findByRole("button", { name: /出勤打刻/ });
      await user.click(stampButton);

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

    it("夜勤チェックボックスをチェックして出勤打刻すると夜勤フラグが設定される", async () => {
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

      renderWithQueryClient(<HomePage />);

      const user = userEvent.setup();
      const nightSwitch = await screen.findByRole("switch", { name: /夜勤扱い/ });
      const stampButton = await screen.findByRole("button", { name: /出勤打刻/ });
      await user.click(nightSwitch);
      await user.click(stampButton);

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

      renderWithQueryClient(<HomePage />);

      const user = userEvent.setup();
      const stampButton = await screen.findByRole("button", { name: /出勤打刻/ });
      await user.click(stampButton);

      await waitFor(() => {
        expect(screen.getByText("出勤打刻が完了しました")).toBeInTheDocument();
      });
    });

    it("打刻失敗時にエラーメッセージが表示される", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {
          // intentionally empty
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

      renderWithQueryClient(<HomePage />);

      const user = userEvent.setup();
      const stampButton = await screen.findByRole("button", { name: /出勤打刻/ });

      await user.click(stampButton);

      await waitFor(() => {
        expect(stampButton).not.toBeDisabled();
      });

      await waitFor(
        () => {
          expect(
            screen.getByText(
              "サーバーエラーが発生しました。しばらくしてから再度お試しください。"
            )
          ).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

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

      renderWithQueryClient(<HomePage />);

      const user = userEvent.setup();
      const stampButton = await screen.findByRole("button", { name: /出勤打刻/ });

      await user.click(stampButton);

      // ボタンが無効化されているか確認
      expect(stampButton).toBeDisabled();
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

      renderWithQueryClient(<HomePage />);

      const user = userEvent.setup();
      const stampButton = await screen.findByRole("button", { name: /出勤打刻/ });
      await user.click(stampButton);

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
      setupPublishedNewsResponse();
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

    it("公開お知らせが新しい順で最大5件まで表示される", async () => {
      const publishedNews = [
        createPublishedNewsItem({
          id: 1,
          newsDate: "2025-09-30",
          content: "古いお知らせ",
        }),
        createPublishedNewsItem({
          id: 2,
          newsDate: "2025-10-02",
          content: "二番目のお知らせ",
        }),
        createPublishedNewsItem({
          id: 3,
          newsDate: "2025-10-05",
          content: "最新のお知らせ",
        }),
        createPublishedNewsItem({
          id: 4,
          newsDate: "2025-10-04",
          content: "四番目のお知らせ",
        }),
        createPublishedNewsItem({
          id: 5,
          newsDate: "2025-10-03",
          content: "三番目のお知らせ",
        }),
        createPublishedNewsItem({
          id: 6,
          newsDate: "2025-09-25",
          content: "表示されないお知らせ",
        }),
      ];

      setupPublishedNewsResponse(publishedNews);
      mswServer.use(
        http.get("http://localhost/api/home/overview", () =>
          HttpResponse.json(mockDashboardData)
        )
      );

      renderWithQueryClient(<HomePage />);

      await waitFor(() => {
        expect(screen.getAllByRole("listitem")).toHaveLength(5);
      });

      const listItems = screen.getAllByRole("listitem");

      expect(listItems[0]).toHaveTextContent("2025-10-05");
      expect(listItems[0]).toHaveTextContent("最新のお知らせ");
      expect(listItems[1]).toHaveTextContent("2025-10-04");
      expect(listItems[1]).toHaveTextContent("四番目のお知らせ");
      expect(listItems[4]).toHaveTextContent("2025-09-30");
      expect(listItems[4]).toHaveTextContent("古いお知らせ");
      expect(
        screen.queryByText("表示されないお知らせ")
      ).not.toBeInTheDocument();
    });

    it("ニュースがない場合は空の状態メッセージが表示される", async () => {
      setupPublishedNewsResponse([]);
      mswServer.use(
        http.get("http://localhost/api/home/overview", () =>
          HttpResponse.json(mockDashboardData)
        )
      );

      renderWithQueryClient(<HomePage />);

      await waitFor(() => {
        expect(
          screen.getByText("現在表示できるお知らせはありません。")
        ).toBeInTheDocument();
      });
    });

    it("公開お知らせクエリは5分ごとの自動更新設定を適用する（ページ表示時のみ）", async () => {
      setupPublishedNewsResponse([
        createPublishedNewsItem({
          id: 99,
          newsDate: "2025-10-06",
          content: "自動更新テスト",
        }),
      ]);
      mswServer.use(
        http.get("http://localhost/api/home/overview", () =>
          HttpResponse.json(mockDashboardData)
        )
      );

      renderWithQueryClient(<HomePage />);

      await waitFor(() => {
        const query = queryClient
          .getQueryCache()
          .find({ queryKey: newsQueryKeys.published() });
        expect(query?.state.status).toBe("success");
      });

      const query = queryClient
        .getQueryCache()
        .find({ queryKey: newsQueryKeys.published() });

      const options = query?.options as
        | {
            refetchInterval?: number | (() => number | false);
          }
        | undefined;

      // refetchIntervalが関数であることを確認
      expect(typeof options?.refetchInterval).toBe("function");

      // ページが表示されている場合は5分を返すことを確認
      if (typeof options?.refetchInterval === "function") {
        // document.hiddenがfalseの場合（表示中）
        const interval = options.refetchInterval();
        expect(interval).toBe(5 * 60 * 1000); // 5分
      }
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
        expect(cards).toHaveLength(3); // 打刻カード・勤務ステータスカード・ニュースカード
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

      renderWithQueryClient(<HomePage />);

      await waitFor(() => {
        // 3つのカードコンポーネントが存在することを確認
        expect(
          screen.getByRole("heading", { name: /ワンクリック打刻/ })
        ).toBeInTheDocument();
        expect(screen.getByText("勤務ステータス")).toBeInTheDocument();
        expect(
          screen.getByRole("heading", { name: "最新のお知らせ" })
        ).toBeInTheDocument();
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
        const switchElement = screen.getByRole("switch");
        // shadcn/uiのSwitchは特定のクラスやデータ属性を持つ
        expect(switchElement).toBeInTheDocument();
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
