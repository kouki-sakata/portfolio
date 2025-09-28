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

export interface StampRequest {
  stampType: '1' | '2'
  stampTime: string
  nightWorkFlag: '0' | '1'
}

export interface StampResponse {
  message: string
  success: boolean
}
