import type { CheckedState } from "@radix-ui/react-checkbox";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useBulkDeleteMutation,
  useBulkPublishMutation,
  useBulkUnpublishMutation,
  useNewsQuery,
} from "@/features/news/hooks/useNews";
import { useNewsSelection } from "@/features/news/hooks/useNewsSelection";
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

// チェックボックスの状態を決定するヘルパー関数
const getCheckboxState = (
  isAllSelected: boolean,
  isIndeterminate: boolean
): CheckedState => {
  if (isAllSelected) {
    return true;
  }
  if (isIndeterminate) {
    return "indeterminate";
  }
  return false;
};

export const NewsManagementPage = () => {
  const newsQuery = useNewsQuery();
  const bulkPublishMutation = useBulkPublishMutation();
  const bulkUnpublishMutation = useBulkUnpublishMutation();
  const bulkDeleteMutation = useBulkDeleteMutation();
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedNews, setSelectedNews] = useState<NewsResponse | undefined>();

  const newsItems = useMemo(() => newsQuery.data?.news ?? [], [newsQuery.data]);

  // カスタムフックを使用して選択状態を管理
  const {
    selectedIds,
    activeSelectedIds,
    selectedCount,
    isAllSelected,
    isIndeterminate,
    hasSelection,
    handleSelectToggle,
    handleToggleAll,
    clearSelection,
    syncSelectionAfterBulk,
  } = useNewsSelection(newsItems);

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

  const executeBulkPublish = async () => {
    if (activeSelectedIds.length === 0) {
      return;
    }
    const result = await bulkPublishMutation.mutateAsync({
      ids: activeSelectedIds,
    });
    syncSelectionAfterBulk(result);
  };

  const executeBulkUnpublish = async () => {
    if (activeSelectedIds.length === 0) {
      return;
    }
    const result = await bulkUnpublishMutation.mutateAsync({
      ids: activeSelectedIds,
    });
    syncSelectionAfterBulk(result);
  };

  const executeBulkDelete = async () => {
    if (activeSelectedIds.length === 0) {
      return;
    }
    const result = await bulkDeleteMutation.mutateAsync({
      ids: activeSelectedIds,
    });
    syncSelectionAfterBulk(result);
  };

  const totalCount = newsItems.length;
  const bulkPublishDisabled = !hasSelection || bulkPublishMutation.isPending;
  const bulkUnpublishDisabled =
    !hasSelection || bulkUnpublishMutation.isPending;
  const bulkDeleteDisabled = !hasSelection || bulkDeleteMutation.isPending;

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
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
          {totalCount > 0 ? (
            <div className="flex items-center gap-2">
              <Checkbox
                aria-label="全選択"
                checked={getCheckboxState(isAllSelected, isIndeterminate)}
                onCheckedChange={handleToggleAll}
              />
              <span className="text-muted-foreground text-sm">全選択</span>
              {hasSelection ? (
                <Button
                  onClick={clearSelection}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  選択解除
                </Button>
              ) : null}
            </div>
          ) : null}
          <Button onClick={handleOpenCreate} type="button">
            新規作成
          </Button>
        </div>
      </header>

      {hasSelection ? (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/40 p-3">
          <p className="font-medium">選択中: {selectedCount}件</p>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={bulkPublishDisabled}
              onClick={executeBulkPublish}
              size="sm"
              type="button"
              variant="secondary"
            >
              一括公開
            </Button>
            <Button
              disabled={bulkUnpublishDisabled}
              onClick={executeBulkUnpublish}
              size="sm"
              type="button"
              variant="secondary"
            >
              一括非公開
            </Button>
            <Button
              disabled={bulkDeleteDisabled}
              onClick={executeBulkDelete}
              size="sm"
              type="button"
              variant="destructive"
            >
              一括削除
            </Button>
          </div>
        </section>
      ) : null}

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
            <NewsCard
              key={item.id}
              news={item}
              onEdit={handleEdit}
              onSelectionChange={handleSelectToggle}
              selectable
              selected={selectedIds.has(item.id)}
            />
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
