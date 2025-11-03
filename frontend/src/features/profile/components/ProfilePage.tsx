import type { PaginationState } from "@tanstack/react-table";
import { useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProfileActivityTable } from "@/features/profile/components/ProfileActivityTable";
import { ProfileEditForm } from "@/features/profile/components/ProfileEditForm";
import { ProfileOverviewCard } from "@/features/profile/components/ProfileOverviewCard";
import type {
  ProfileActivityEntryViewModel,
  ProfileMetadataFormValues,
  ProfileOverviewViewModel,
} from "@/features/profile/types";
import { cn } from "@/shared/utils/cn";

export type ProfilePageProps = {
  overview: ProfileOverviewViewModel | null;
  metadata: ProfileMetadataFormValues;
  loadingOverview?: boolean;
  metadataSubmitting?: boolean;
  activity: {
    entries: ProfileActivityEntryViewModel[];
    loading: boolean;
    page: number;
    pageSize: number;
    totalCount: number;
  };
  onMetadataSubmit: (values: ProfileMetadataFormValues) => Promise<void> | void;
  onActivityPageChange?: (state: PaginationState) => void;
};

const ProfilePageSkeleton = () => (
  <div
    className="grid gap-6 md:grid-cols-[2fr_3fr]"
    data-testid="profile-page-skeleton"
  >
    <div className="space-y-4">
      <div className="h-8 w-40 animate-pulse rounded bg-muted/70" />
      <div className="h-48 animate-pulse rounded-lg bg-muted/40" />
    </div>
    <div className="space-y-4">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          className="h-32 animate-pulse rounded-lg bg-muted/30"
          key={`page-skeleton-${index}`}
        />
      ))}
    </div>
  </div>
);

export const ProfilePage = ({
  overview,
  metadata,
  loadingOverview = false,
  metadataSubmitting = false,
  activity,
  onMetadataSubmit,
  onActivityPageChange,
}: ProfilePageProps) => {
  const [editOpen, setEditOpen] = useState(false);

  const shouldRenderSkeleton = loadingOverview && !overview;

  const overviewCard = useMemo(() => {
    if (!overview) {
      return null;
    }

    return (
      <ProfileOverviewCard
        onEdit={() => setEditOpen(true)}
        overview={overview}
        variant="standard"
      />
    );
  }, [overview]);

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-semibold text-2xl text-foreground md:text-3xl">
          プロフィール管理
        </h1>
        <p className="text-muted-foreground text-sm">
          基本情報の確認と更新、活動履歴の追跡ができます。
        </p>
      </header>

      {shouldRenderSkeleton ? (
        <ProfilePageSkeleton />
      ) : (
        <div className="grid gap-6 md:grid-cols-[2fr_3fr]">
          <div className="space-y-6">
            {overviewCard}
            <div
              className={cn(
                "rounded-lg border border-border/40 border-dashed bg-muted/10 p-4 text-muted-foreground text-xs",
                overview ? "block" : "hidden"
              )}
            >
              氏名・メールアドレスは認証情報と連動しており、管理者のみが変更可能です。
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="font-semibold text-foreground text-lg">活動履歴</h2>
            <ProfileActivityTable
              entries={activity.entries}
              loading={activity.loading}
              onPaginationChange={onActivityPageChange}
              page={activity.page}
              pageSize={activity.pageSize}
              totalCount={activity.totalCount}
            />
          </div>
        </div>
      )}

      <Dialog onOpenChange={setEditOpen} open={editOpen}>
        <DialogContent aria-label="プロフィール編集" className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>プロフィールを編集</DialogTitle>
            <DialogDescription>
              住所や部署、社員番号、活動メモを更新できます。入力内容は保存後すぐに反映されます。
            </DialogDescription>
          </DialogHeader>
          <ProfileEditForm
            defaultValues={metadata}
            onCancel={() => setEditOpen(false)}
            onSubmit={async (values) => {
              await onMetadataSubmit(values);
              setEditOpen(false);
            }}
          />
          {metadataSubmitting ? (
            <p className="text-muted-foreground text-xs">
              変更内容を保存しています…
            </p>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
};
