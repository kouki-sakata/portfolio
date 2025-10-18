import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type BulkMutationResult,
  useBulkPublishMutation,
  useBulkUnpublishMutation,
  useNewsQuery,
} from "@/features/news/hooks/useNews";
import { useNewsColumns } from "@/features/news/hooks/useNewsColumns";
import { DataTable } from "@/shared/components/data-table";
import type { NewsResponse } from "@/types";

import { BulkActionBar } from "./BulkActionBar";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { NewsFormModal } from "./NewsFormModal";
import { PublishedNewsGrid } from "./PublishedNewsGrid";

const NewsListSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-4">
      <Skeleton className="h-6 w-48" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card
            className="flex h-full flex-col"
            data-testid="news-card-skeleton"
            key={`skeleton-${
              // biome-ignore lint/suspicious/noArrayIndexKey: スケルトン要素は順序固定で再レンダリングで変更されない
              index
            }`}
          >
            <Skeleton className="m-4 h-4 w-24" />
            <Skeleton className="mx-4 mb-4 h-3 w-full" />
          </Card>
        ))}
      </div>
    </div>
    <Skeleton className="h-96 w-full" />
  </div>
);

export const NewsManagementPage = () => {
  const newsQuery = useNewsQuery();
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedNews, setSelectedNews] = useState<NewsResponse | undefined>();
  const [selectedNewsIds, setSelectedNewsIds] = useState<number[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<NewsResponse | undefined>();
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  const newsItems = useMemo(() => newsQuery.data?.news ?? [], [newsQuery.data]);
  const bulkPublishMutation = useBulkPublishMutation();
  const bulkUnpublishMutation = useBulkUnpublishMutation();

  const handleEdit = useCallback((news: NewsResponse) => {
    setSelectedNews(news);
    setFormMode("edit");
    setFormOpen(true);
  }, []);

  const handleDeleteClick = useCallback((news: NewsResponse) => {
    setDeleteTarget(news);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteSuccess = useCallback(() => {
    setDeleteTarget(undefined);
    setDeleteDialogOpen(false);
  }, []);

  const handleBulkDeleteSuccess = useCallback(() => {
    setSelectedNewsIds([]);
    setBulkDeleteDialogOpen(false);
  }, []);

  const handleBulkMutationResult = useCallback(
    ({ failedIds }: BulkMutationResult) => {
      // 失敗したIDのみ選択を保持（成功したものは選択解除）
      // 全成功の場合は選択状態を保持して連続操作を可能に
      if (failedIds.length > 0) {
        setSelectedNewsIds((prev) =>
          prev.filter((id) => failedIds.includes(id))
        );
      }
    },
    []
  );

  const columns = useNewsColumns({
    onEdit: handleEdit,
    onDeleteClick: handleDeleteClick,
  });

  const handleRowSelectionChange = useCallback(
    (selection: Record<string, boolean>) => {
      const selectedIds = Object.keys(selection)
        .filter((key) => selection[key])
        .map((key) => newsItems[Number.parseInt(key, 10)]?.id)
        .filter((id): id is number => id !== undefined);
      setSelectedNewsIds(selectedIds);
    },
    [newsItems]
  );

  const handleOpenCreate = () => {
    setSelectedNews(undefined);
    setFormMode("create");
    setFormOpen(true);
  };

  // カスタムイベントで編集を処理
  useEffect(() => {
    const handleEditEvent = (event: Event) => {
      const customEvent = event as CustomEvent<NewsResponse>;
      handleEdit(customEvent.detail);
    };

    document.addEventListener("news:edit", handleEditEvent);
    return () => {
      document.removeEventListener("news:edit", handleEditEvent);
    };
  }, [handleEdit]);

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
    <div className="space-y-8">
      {/* ヘッダー */}
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
        <>
          {/* 上部セクション: 公開中のお知らせグリッド */}
          <PublishedNewsGrid isLoading={newsQuery.isLoading} news={newsItems} />

          {/* 下部セクション: 全データテーブル */}
          <section
            aria-label="お知らせ一覧テーブル"
            className="space-y-4"
            ref={tableRef}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-semibold text-lg">全お知らせ一覧</h2>
              <BulkActionBar
                onBulkDeleteClick={() => setBulkDeleteDialogOpen(true)}
                onPublishSuccess={handleBulkMutationResult}
                onUnpublishSuccess={handleBulkMutationResult}
                publishMutation={bulkPublishMutation}
                selectedIds={selectedNewsIds}
                unpublishMutation={bulkUnpublishMutation}
              />
            </div>
            <DataTable
              columns={columns}
              data={newsItems}
              emptyMessage="お知らせが見つかりませんでした"
              enableColumnVisibility
              enableGlobalFilter
              enableRowSelection
              loading={newsQuery.isLoading}
              onRowSelectionChange={handleRowSelectionChange}
            />
          </section>
        </>
      )}

      {/* 単一削除ダイアログ */}
      {deleteTarget && (
        <DeleteConfirmDialog
          news={deleteTarget}
          onConfirm={handleDeleteSuccess}
          onOpenChange={setDeleteDialogOpen}
          open={deleteDialogOpen}
          type="single"
        />
      )}

      {/* 一括削除ダイアログ */}
      <DeleteConfirmDialog
        newsIds={selectedNewsIds}
        onConfirm={handleBulkDeleteSuccess}
        onOpenChange={setBulkDeleteDialogOpen}
        open={bulkDeleteDialogOpen}
        type="bulk"
      />

      <NewsFormModal
        mode={formMode}
        news={selectedNews}
        onClose={handleCloseForm}
        open={formOpen}
      />
    </div>
  );
};
