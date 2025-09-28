import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback,useState } from 'react'

import { createHomeRepository, type IHomeRepository } from '@/features/home/repositories/HomeRepository'
import type { StampRequest, StampResponse } from '@/features/home/types'

const HOME_DASHBOARD_KEY = ['home', 'overview'] as const

/**
 * 打刻用カスタムフック
 * Single Responsibility: 打刻ロジックのみを管理
 */
export const useStamp = (repository: IHomeRepository = createHomeRepository()) => {
  const queryClient = useQueryClient()
  const [message, setMessage] = useState<string | null>(null)

  const stampMutation = useMutation<StampResponse, Error, StampRequest>({
    mutationFn: (request: StampRequest) => repository.submitStamp(request),
    onSuccess: (response: StampResponse) => {
      setMessage(response.message)
      void queryClient.invalidateQueries({ queryKey: HOME_DASHBOARD_KEY })
    },
    onError: () => {
      setMessage('打刻に失敗しました。再度お試しください。')
    },
  })

  const handleStamp = useCallback(async (type: '1' | '2', nightWork: boolean) => {
    setMessage(null)
    const timestamp = new Date().toISOString().slice(0, 19)

    await stampMutation.mutateAsync({
      stampType: type,
      stampTime: timestamp,
      nightWorkFlag: nightWork ? '1' : '0',
    })
  }, [stampMutation])

  const clearMessage = useCallback(() => {
    setMessage(null)
  }, [])

  return {
    handleStamp,
    isLoading: stampMutation.isPending,
    message,
    clearMessage,
  }
}