import { useCallback, useState } from 'react'

import { SessionTimeoutWarning } from '@/features/auth/components/SessionTimeoutWarning'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useSessionTimeout } from '@/features/auth/hooks/useSessionTimeout'
import { useToast } from '@/hooks/use-toast'

/**
 * セッションタイムアウト通知コンポーネント
 * AuthContextと連携してセッションタイムアウト警告を管理
 */
export const SessionTimeoutNotification = () => {
  const { sessionInfo, refreshSession, logout, sessionTimeoutWarning } = useAuth()
  const { toast } = useToast()
  const [isDismissed, setIsDismissed] = useState(false)

  // 警告表示のコールバック
  const handleWarning = useCallback(() => {
    toast({
      title: 'セッション期限警告',
      description: 'セッションの有効期限が近づいています。',
      variant: 'default',
    })
  }, [toast])

  // セッション期限切れのコールバック
  const handleExpired = useCallback(() => {
    toast({
      title: 'セッション期限切れ',
      description: 'セッションの有効期限が切れました。再度ログインしてください。',
      variant: 'destructive',
    })
    void logout()
  }, [logout, toast])

  // セッション延長のコールバック
  const handleExtend = useCallback(() => {
    void refreshSession().then(() => {
      setIsDismissed(false) // 延長したら再度警告を表示可能にする
      toast({
        title: 'セッション延長完了',
        description: 'セッションが延長されました。',
        variant: 'default',
      })
    }).catch((error: unknown) => {
      toast({
        title: 'セッション延長エラー',
        description: 'セッションの延長に失敗しました。',
        variant: 'destructive',
      })
      console.error('Session extension failed:', error)
    })
  }, [refreshSession, toast])

  // セッションタイムアウトフックを使用
  const { timeRemaining, showWarning, snoozeWarning } = useSessionTimeout(
    sessionInfo,
    handleWarning,
    handleExpired,
    handleExtend
  )

  // ログアウト処理
  const handleLogout = useCallback(() => {
    void logout().then(() => {
      toast({
        title: 'ログアウト完了',
        description: 'ログアウトしました。',
        variant: 'default',
      })
    })
  }, [logout, toast])

  // 警告を閉じる処理（5分間スヌーズ）
  const handleDismiss = useCallback(() => {
    setIsDismissed(true)
    snoozeWarning(5)
  }, [snoozeWarning])

  // 警告を表示するかの判定
  const shouldShowWarning =
    showWarning &&
    sessionTimeoutWarning &&
    !isDismissed &&
    timeRemaining !== null &&
    timeRemaining > 0

  return (
    <SessionTimeoutWarning
      show={shouldShowWarning}
      timeRemaining={Math.floor((timeRemaining ?? 0) / 1000)} // ミリ秒を秒に変換
      onExtend={handleExtend}
      onLogout={handleLogout}
      onDismiss={handleDismiss}
      urgent={timeRemaining !== null && timeRemaining <= 60000} // 1分以下で緊急
    />
  )
}