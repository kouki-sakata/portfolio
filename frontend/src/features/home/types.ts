import type { EmployeeSummary } from '@/features/auth/types'

export interface HomeNewsItem {
  id: number
  content: string
  newsDate: string
  released: boolean
}

export interface HomeDashboardResponse {
  employee: EmployeeSummary
  news: HomeNewsItem[]
}
