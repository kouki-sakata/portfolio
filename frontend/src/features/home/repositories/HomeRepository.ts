import { z } from 'zod'

import type { HomeDashboardResponse, StampRequest, StampResponse } from '@/features/home/types'
import { defaultHttpClient } from '@/shared/repositories/httpClientAdapter'
import type { IHttpClient } from '@/shared/repositories/types'

/**
 * Zodスキーマ定義
 */
const NewsItemSchema = z.object({
  id: z.number(),
  newsDate: z.string(),
  content: z.string(),
  released: z.boolean(),
})

const EmployeeSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  admin: z.boolean(),
})

const HomeDashboardResponseSchema = z.object({
  employee: EmployeeSchema,
  news: z.array(NewsItemSchema),
})

const StampResponseSchema = z.object({
  message: z.string(),
  success: z.boolean(),
})

/**
 * ホーム画面用リポジトリインターフェース
 * Single Responsibility: ホーム画面関連のデータアクセスのみを担当
 */
export interface IHomeRepository {
  getDashboard(): Promise<HomeDashboardResponse>
  submitStamp(request: StampRequest): Promise<StampResponse>
}

/**
 * ホーム画面用リポジトリ実装
 */
export class HomeRepository implements IHomeRepository {
  constructor(private readonly httpClient: IHttpClient = defaultHttpClient) {}

  async getDashboard(): Promise<HomeDashboardResponse> {
    const response = await this.httpClient.get<unknown>('/home/dashboard')
    return HomeDashboardResponseSchema.parse(response)
  }

  async submitStamp(request: StampRequest): Promise<StampResponse> {
    const response = await this.httpClient.post<unknown>('/home/stamp', request)
    return StampResponseSchema.parse(response)
  }
}

/**
 * Factory関数
 */
export const createHomeRepository = (httpClient?: IHttpClient): IHomeRepository => {
  return new HomeRepository(httpClient)
}

/**
 * デフォルトインスタンス
 */
export const homeRepository = createHomeRepository()