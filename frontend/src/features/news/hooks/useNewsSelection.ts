import type { CheckedState } from "@radix-ui/react-checkbox";
import { useEffect, useMemo, useState } from "react";
import type { NewsResponse } from "@/types";
import type { BulkMutationResult } from "./useNews";

// 二つのSetが同一かどうかを判定するヘルパー関数
const areSetsEqual = (set1: Set<number>, set2: Set<number>): boolean => {
  if (set1.size !== set2.size) {
    return false;
  }
  for (const id of set1) {
    if (!set2.has(id)) {
      return false;
    }
  }
  return true;
};

// 選択IDを同期するヘルパー関数
const syncSelectedIds = (
  current: Set<number>,
  newsItems: NewsResponse[]
): Set<number> => {
  if (current.size === 0) {
    return current;
  }
  const next = new Set(
    newsItems.filter((item) => current.has(item.id)).map((item) => item.id)
  );

  return areSetsEqual(current, next) ? current : next;
};

export const useNewsSelection = (newsItems: NewsResponse[]) => {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // 実際に存在するニュースアイテムの選択IDのみを保持
  const activeSelectedIds = useMemo(
    () =>
      newsItems
        .filter((item) => selectedIds.has(item.id))
        .map((item) => item.id),
    [newsItems, selectedIds]
  );

  // ニュースアイテムが更新されたときに選択状態を同期
  useEffect(() => {
    setSelectedIds((current) => syncSelectedIds(current, newsItems));
  }, [newsItems]);

  const handleSelectToggle = (news: NewsResponse, next: boolean) => {
    setSelectedIds((current) => {
      const nextSet = new Set(current);
      if (next) {
        nextSet.add(news.id);
      } else {
        nextSet.delete(news.id);
      }
      return nextSet;
    });
  };

  const handleToggleAll = (state: CheckedState) => {
    if (state === true) {
      setSelectedIds(new Set(newsItems.map((item) => item.id)));
      return;
    }
    if (state === "indeterminate") {
      return;
    }
    setSelectedIds(new Set());
  };

  const syncSelectionAfterBulk = (result: BulkMutationResult) => {
    if (result.failedIds.length === 0) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(result.failedIds));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const selectedCount = activeSelectedIds.length;
  const totalCount = newsItems.length;
  const isAllSelected = totalCount > 0 && selectedCount === totalCount;
  const isIndeterminate = selectedCount > 0 && !isAllSelected;
  const hasSelection = selectedCount > 0;

  return {
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
  };
};
