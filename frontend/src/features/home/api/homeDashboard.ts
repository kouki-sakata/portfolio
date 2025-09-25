import type { HomeDashboardResponse } from '@/features/home/types'
import { httpClient } from '@/shared/api/httpClient'

export const getHomeDashboard = async () => httpClient<HomeDashboardResponse>('/home/overview')
