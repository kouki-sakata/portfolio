import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { getHomeDashboard } from "@/features/home/api/homeDashboard";
import { submitStamp } from "@/features/home/api/stamp";
import type { HomeDashboardResponse } from "@/features/home/types";
import { PageLoader } from "@/shared/components/layout/PageLoader";
import { NewsCard } from "./NewsCard";
import { StampCard } from "./StampCard";

const HOME_DASHBOARD_KEY = ["home", "overview"] as const;

const formatTimestamp = () => {
  const now = new Date();
  const isoString = now.toISOString();
  return isoString.slice(0, 19);
};

export const HomePage = () => {
  const queryClient = useQueryClient();
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const { data, isLoading } = useQuery<HomeDashboardResponse>({
    queryKey: HOME_DASHBOARD_KEY,
    queryFn: getHomeDashboard,
    staleTime: 60 * 1000,
  });

  const stampMutation = useMutation({
    mutationFn: submitStamp,
    onSuccess: (response) => {
      // TypeScriptベストプラクティス: 型ガードとnullチェック
      if (response && typeof response === "object" && "message" in response) {
        setResultMessage(response.message);
      } else {
        setResultMessage("打刻が完了しました");
      }

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

  const handleStamp = async (type: "1" | "2", nightWork: boolean) => {
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
    <section className="home container mx-auto px-4 py-6">
      <header className="home-hero mb-8">
        <h1 className="home-hero__title mb-2 font-bold text-2xl text-gray-900 md:text-3xl">
          おはようございます、{data.employee.lastName} {data.employee.firstName}{" "}
          さん
        </h1>
        <p className="home-hero__subtitle text-gray-600">
          今日も素敵な一日を過ごしましょう。
        </p>
      </header>

      <div className="home-grid grid grid-cols-1 gap-6 lg:grid-cols-2">
        <StampCard
          className="home-card"
          isLoading={stampMutation.isPending}
          message={resultMessage}
          onStamp={handleStamp}
        />

        <NewsCard
          className="home-card"
          isLoading={false}
          newsItems={newsItems}
        />
      </div>
    </section>
  );
};
