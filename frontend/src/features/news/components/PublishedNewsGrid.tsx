import { useMemo } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  type NewsViewModel,
  toNewsViewModelList,
} from "@/features/news/lib/newsViewModel";
import type { NewsResponse } from "@/types";

import { PublishedNewsCard } from "./PublishedNewsCard";

type PublishedNewsGridProps = {
  news: NewsResponse[];
  isLoading?: boolean;
  onSelect?: (news: NewsViewModel) => void;
};

const PublishedNewsGridSkeleton = () => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    {Array.from({ length: 4 }).map((_, index) => (
      <div
        className="rounded-lg border p-4"
        // biome-ignore lint/suspicious/noArrayIndexKey: スケルトン要素は順序固定で再レンダリングで変更されない
        key={index}
      >
        <Skeleton className="mb-2 h-4 w-24" />
        <Skeleton className="mb-2 h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
    ))}
  </div>
);

export const PublishedNewsGrid = ({
  news,
  isLoading = false,
  onSelect,
}: PublishedNewsGridProps) => {
  // 公開中のお知らせのみフィルタリング（最大4件）
  const viewModelNews = useMemo<NewsViewModel[]>(
    () => toNewsViewModelList(news),
    [news]
  );

  const publishedNews = useMemo(
    () => viewModelNews.filter((item) => item.releaseFlag).slice(0, 4),
    [viewModelNews]
  );

  if (isLoading) {
    return (
      <section aria-label="公開中のお知らせ読み込み中" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">公開中のお知らせ</h2>
        </div>
        <PublishedNewsGridSkeleton />
      </section>
    );
  }

  if (publishedNews.length === 0) {
    return (
      <section aria-label="公開中のお知らせ" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">公開中のお知らせ</h2>
        </div>
        <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground text-sm">
            現在公開中のお知らせはありません
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="公開中のお知らせ" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">
          公開中のお知らせ
          <span className="ml-2 font-normal text-muted-foreground text-sm">
            （最大4件表示）
          </span>
        </h2>
      </div>

      {/* 2x2グリッドレイアウト */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {publishedNews.map((item) => (
          <PublishedNewsCard
            key={item.id}
            news={item}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
};
