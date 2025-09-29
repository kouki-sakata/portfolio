import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { getHomeDashboard } from "@/features/home/api/homeDashboard";
import { submitStamp } from "@/features/home/api/stamp";
import type { HomeDashboardResponse } from "@/features/home/types";
import { PageLoader } from "@/shared/components/layout/PageLoader";

const HOME_DASHBOARD_KEY = ["home", "overview"] as const;

const formatTimestamp = () => {
  const now = new Date();
  const isoString = now.toISOString();
  return isoString.slice(0, 19);
};

export const HomePage = () => {
  const queryClient = useQueryClient();
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [nightWork, setNightWork] = useState(false);

  const { data, isLoading } = useQuery<HomeDashboardResponse>({
    queryKey: HOME_DASHBOARD_KEY,
    queryFn: getHomeDashboard,
    staleTime: 60 * 1000,
  });

  const stampMutation = useMutation({
    mutationFn: submitStamp,
    onSuccess: (response) => {
      setResultMessage(response.message);
      queryClient
        .invalidateQueries({ queryKey: HOME_DASHBOARD_KEY })
        .catch(() => {
          // エラーハンドリングは不要（キャッシュ無効化の失敗は次回フェッチで解決）
        });
    },
    onError: () => {
      setResultMessage("打刻に失敗しました。再度お試しください。");
    },
  });

  const newsItems = useMemo(() => data?.news ?? [], [data]);

  const handleStamp = async (type: "1" | "2") => {
    setResultMessage(null);
    await stampMutation.mutateAsync({
      stampType: type,
      stampTime: formatTimestamp(),
      nightWorkFlag: nightWork ? "1" : "0",
    });
  };

  if (isLoading || !data) {
    return <PageLoader label="ダッシュボードを読み込み中" />;
  }

  return (
    <section className="home">
      <header className="home-hero">
        <h1 className="home-hero__title">
          おはようございます、{data.employee.lastName} {data.employee.firstName}{" "}
          さん
        </h1>
        <p className="home-hero__subtitle">
          今日も素敵な一日を過ごしましょう。
        </p>
      </header>

      <div className="home-grid">
        <article className="home-card">
          <header className="home-card__header">
            <h2 className="home-card__title">ワンクリック打刻</h2>
            <label className="home-card__nightwork">
              <input
                checked={nightWork}
                onChange={(event) => {
                  setNightWork(event.target.checked);
                }}
                type="checkbox"
              />
              夜勤扱い
            </label>
          </header>
          <div className="home-card__actions">
            <button
              className="button"
              disabled={stampMutation.isPending}
              onClick={() => {
                handleStamp("1").catch(() => {
                  // エラーハンドリングはonErrorで処理済み
                });
              }}
              type="button"
            >
              出勤打刻
            </button>
            <button
              className="button"
              disabled={stampMutation.isPending}
              onClick={() => {
                handleStamp("2").catch(() => {
                  // エラーハンドリングはonErrorで処理済み
                });
              }}
              type="button"
            >
              退勤打刻
            </button>
          </div>
          {resultMessage ? (
            <p className="home-card__result">{resultMessage}</p>
          ) : null}
        </article>

        <article className="home-card">
          <header className="home-card__header">
            <h2 className="home-card__title">最新のお知らせ</h2>
          </header>
          <ul className="home-news-list">
            {newsItems.length === 0 ? (
              <li className="home-news-list__empty">
                現在表示できるお知らせはありません。
              </li>
            ) : (
              newsItems.map((news) => (
                <li className="home-news-list__item" key={news.id}>
                  <time className="home-news-list__date">{news.newsDate}</time>
                  <p className="home-news-list__content">{news.content}</p>
                </li>
              ))
            )}
          </ul>
        </article>
      </div>
    </section>
  );
};
