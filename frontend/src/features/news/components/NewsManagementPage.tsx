import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNewsQuery } from "@/features/news/hooks/useNews";
import type { NewsResponse } from "@/types";

import { NewsCard } from "./NewsCard";
import { NewsFormModal } from "./NewsFormModal";

const NewsListSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: 3 }).map((_, index) => (
      <Card
        className="flex h-full flex-col"
        data-testid="news-card-skeleton"
        key={`skeleton-${
          // biome-ignore lint/suspicious/noArrayIndexKey: スケルトン要素は順序固定で再レンダリングで変更されない
          index
        }`}
      >
        <CardHeader className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-40" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-4/6" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export const NewsManagementPage = () => {
  const newsQuery = useNewsQuery();
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedNews, setSelectedNews] = useState<NewsResponse | undefined>();

  const newsItems = useMemo(() => newsQuery.data?.news ?? [], [newsQuery.data]);

  const handleOpenCreate = () => {
    setSelectedNews(undefined);
    setFormMode("create");
    setFormOpen(true);
  };

  const handleEdit = (news: NewsResponse) => {
    setSelectedNews(news);
    setFormMode("edit");
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedNews(undefined);
  };

  if (newsQuery.isLoading) {
    return <NewsListSkeleton />;
  }

  if (newsQuery.isError) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center">
        <p className="font-semibold text-xl">お知らせを取得できませんでした</p>
        <p className="text-muted-foreground">
          ネットワーク状態を確認して再度お試しください。
        </p>
        <Button onClick={() => newsQuery.refetch()} variant="outline">
          再読み込み
        </Button>
      </div>
    );
  }

  const isEmpty = newsItems.length === 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">お知らせ管理</h1>
          <p className="text-muted-foreground">
            お知らせの作成・編集・公開管理を行います。
          </p>
        </div>
        <Button onClick={handleOpenCreate} type="button">
          新規作成
        </Button>
      </header>

      {isEmpty ? (
        <section className="flex h-[40vh] flex-col items-center justify-center space-y-3 rounded-xl border border-dashed p-8 text-center">
          <CardTitle className="font-semibold text-lg">
            現在表示できるお知らせはありません
          </CardTitle>
          <p className="text-muted-foreground">
            「新規作成」ボタンから最初のお知らせを登録してください。
          </p>
          <Button onClick={handleOpenCreate} type="button" variant="secondary">
            新規作成
          </Button>
        </section>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {newsItems.map((item) => (
            <NewsCard key={item.id} news={item} onEdit={handleEdit} />
          ))}
        </div>
      )}

      <NewsFormModal
        mode={formMode}
        news={selectedNews}
        onClose={handleCloseForm}
        open={formOpen}
      />
    </div>
  );
};
