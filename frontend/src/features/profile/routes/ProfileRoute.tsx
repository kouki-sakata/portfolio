import type { PaginationState } from "@tanstack/react-table";
import { useState } from "react";

import { ProfilePage } from "@/features/profile/components/ProfilePage";
import {
  useProfileActivityQuery,
  useProfileOverviewQuery,
  useProfileStatisticsQuery,
  useUpdateProfileMetadata,
} from "@/features/profile/hooks/useProfile";
import type { ProfileMetadataFormValues } from "@/features/profile/types";

const DEFAULT_FORM: ProfileMetadataFormValues = {
  address: "",
  department: "",
  employeeNumber: "",
  activityNote: "",
  location: "",
  manager: "",
  workStyle: "onsite",
  scheduleStart: "09:00",
  scheduleEnd: "18:00",
  scheduleBreakMinutes: 60,
};

export const ProfileRoute = () => {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });

  const overviewQuery = useProfileOverviewQuery();
  const activityQuery = useProfileActivityQuery({
    page: pagination.pageIndex,
    size: pagination.pageSize,
  });
  const statisticsQuery = useProfileStatisticsQuery();
  const updateMutation = useUpdateProfileMetadata();

  const metadataForm = overviewQuery.data?.metadataForm ?? DEFAULT_FORM;

  return (
    <ProfilePage
      activity={{
        entries: activityQuery.data?.entries ?? [],
        loading: activityQuery.isLoading,
        page: pagination.pageIndex,
        pageSize: pagination.pageSize,
        totalCount: activityQuery.data?.totalCount ?? 0,
      }}
      loadingOverview={overviewQuery.isLoading}
      loadingStatistics={statisticsQuery.isLoading}
      metadata={metadataForm}
      metadataSubmitting={updateMutation.isPending}
      onActivityPageChange={(state) => {
        setPagination(state);
      }}
      onMetadataSubmit={async (values) => {
        await updateMutation.mutateAsync({
          address: values.address,
          department: values.department,
          employeeNumber: values.employeeNumber,
          activityNote: values.activityNote,
          location: values.location,
          manager: values.manager,
          workStyle: values.workStyle,
          scheduleStart: values.scheduleStart,
          scheduleEnd: values.scheduleEnd,
          scheduleBreakMinutes: values.scheduleBreakMinutes,
        });
        await overviewQuery.refetch();
        await activityQuery.refetch();
      }}
      overview={overviewQuery.data?.overview ?? null}
      statistics={statisticsQuery.data ?? null}
    />
  );
};
