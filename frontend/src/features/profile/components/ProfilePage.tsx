import type { PaginationState } from "@tanstack/react-table";
import { Pencil } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ProfileActivityTable } from "@/features/profile/components/ProfileActivityTable";
import { ProfileEditForm } from "@/features/profile/components/ProfileEditForm";
import { ProfileMonthlyDetailCard } from "@/features/profile/components/ProfileMonthlyDetailCard";
import { ProfileOverviewCard } from "@/features/profile/components/ProfileOverviewCard";
import { ProfileSummaryCard } from "@/features/profile/components/ProfileSummaryCard";
import type {
  ExtendedProfileOverviewViewModel,
  ProfileActivityEntryViewModel,
  ProfileMetadataFormValues,
  ProfileStatisticsData,
} from "@/features/profile/types";

export type ProfilePageProps = {
  overview: ExtendedProfileOverviewViewModel | null;
  metadata: ProfileMetadataFormValues;
  loadingOverview?: boolean;
  metadataSubmitting?: boolean;
  statistics: ProfileStatisticsData | null;
  loadingStatistics?: boolean;
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
  <div className="space-y-6" data-testid="profile-page-skeleton">
    <div className="h-8 w-40 animate-pulse rounded bg-muted/70" />
    {Array.from({ length: 3 }, (_, index) => (
      <div
        className="h-32 animate-pulse rounded-lg bg-muted/30"
        key={`page-skeleton-${index}`}
      />
    ))}
  </div>
);

export const ProfilePage = ({
  activity,
  loadingOverview = false,
  loadingStatistics = false,
  metadata,
  metadataSubmitting = false,
  onActivityPageChange,
  onMetadataSubmit,
  overview,
  statistics,
}: ProfilePageProps) => {
  const [editOpen, setEditOpen] = useState(false);

  const shouldRenderSkeleton = loadingOverview && !overview;

  const overviewCard = useMemo(() => {
    if (!overview) {
      return null;
    }

    return <ProfileOverviewCard overview={overview} />;
  }, [overview]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl text-foreground tracking-tight md:text-3xl">
            ユーザ情報
          </h1>
          <p className="text-muted-foreground text-sm">
            勤怠・プロフィールの管理
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="rounded-2xl"
            onClick={() => setEditOpen(true)}
            variant="default"
          >
            <Pencil className="mr-2 h-4 w-4" />
            編集
          </Button>
        </div>
      </div>

      {shouldRenderSkeleton ? (
        <ProfilePageSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {overviewCard}

          <ProfileSummaryCard
            loading={loadingStatistics}
            summary={statistics?.summary ?? null}
          />

          <ProfileMonthlyDetailCard
            loading={loadingStatistics}
            monthlyData={statistics?.monthly ?? []}
          />

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

      <Sheet onOpenChange={setEditOpen} open={editOpen}>
        <SheetContent className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>プロフィール編集</SheetTitle>
            <SheetDescription>
              基本情報・勤務体系を更新できます
            </SheetDescription>
          </SheetHeader>
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
        </SheetContent>
      </Sheet>
    </div>
  );
};
