import { useQuery } from '@tanstack/react-query'
import { createHomeRepository, type IHomeRepository } from '@/features/home/repositories/HomeRepository'

const HOME_DASHBOARD_KEY = ['home', 'overview'] as const

/**
 * ダッシュボードデータ取得用カスタムフック
 * Single Responsibility: ダッシュボードデータの取得のみを管理
 */
export const useDashboard = (repository: IHomeRepository = createHomeRepository()) => {
  const query = useQuery({
    queryKey: HOME_DASHBOARD_KEY,
    queryFn: () => repository.getDashboard(),
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // 5分ごとに自動更新
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}