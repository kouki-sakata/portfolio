import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchProfile,
  fetchProfileActivity,
  type ProfileActivityQuery,
  type ProfileActivityResponse,
  type ProfileMetadataUpdatePayload,
  type ProfileResponse,
  updateProfileMetadata,
} from "@/features/profile/api/profileApi";
import {
  createActivityViewModel,
  createMetadataFormValues,
  createOverviewViewModel,
} from "@/features/profile/lib/profileViewModel";
import type {
  ExtendedProfileOverviewViewModel,
  ProfileActivityEntryViewModel,
  ProfileMetadataFormValues,
} from "@/features/profile/types";

const profileKeys = {
  all: ["profile"] as const,
  overview: () => [...profileKeys.all, "overview"] as const,
  activity: (params: ProfileActivityQuery) =>
    [
      ...profileKeys.all,
      "activity",
      params.page ?? 0,
      params.size ?? 20,
      params.from ?? null,
      params.to ?? null,
    ] as const,
};

type ProfileOverviewResult = {
  overview: ExtendedProfileOverviewViewModel | null;
  metadataForm: ProfileMetadataFormValues;
  raw: ProfileResponse | null;
};

type ProfileActivityResult = {
  entries: ProfileActivityEntryViewModel[];
  totalCount: number;
  page: number;
  size: number;
};

const toProfileOverviewResult = (
  response: ProfileResponse
): ProfileOverviewResult => ({
  overview: createOverviewViewModel(response),
  metadataForm: createMetadataFormValues(response.metadata),
  raw: response,
});

export const useProfileOverviewQuery = () =>
  useQuery<ProfileOverviewResult, Error>({
    queryKey: profileKeys.overview(),
    queryFn: async () => {
      const response = await fetchProfile();
      return toProfileOverviewResult(response);
    },
  });

export const useProfileActivityQuery = (params: ProfileActivityQuery) =>
  useQuery<ProfileActivityResponse, Error, ProfileActivityResult>({
    queryKey: profileKeys.activity(params),
    queryFn: () => fetchProfileActivity(params),
    placeholderData: (previous) => previous,
    select: (response): ProfileActivityResult => {
      const { entries, totalCount } = createActivityViewModel(response);
      return {
        entries,
        totalCount,
        page: response.page,
        size: response.size,
      };
    },
  });

export const useUpdateProfileMetadata = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProfileMetadataUpdatePayload) =>
      updateProfileMetadata(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(
        profileKeys.overview(),
        toProfileOverviewResult(data)
      );
    },
  });
};
