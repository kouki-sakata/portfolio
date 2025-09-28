import { AlertTriangle, Clock, LogOut, RefreshCw, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SessionTimeoutWarningProps {
  /** 残り時間（秒） */
  timeRemaining: number
  /** セッション延長処理 */
  onExtend: () => void
  /** ログアウト処理 */
  onLogout: () => void
  /** 閉じる処理 */
  onDismiss?: () => void
  /** 表示フラグ */
  show?: boolean
  /** 緊急フラグ（残り時間が少ない場合） */
  urgent?: boolean
}

/**
 * 時間をフォーマット（秒 → 分:秒）
 */
const formatTime = (seconds: number): string => {
  if (seconds <= 0) return '0秒'

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes > 0) {
    return `${minutes.toString()}分${remainingSeconds.toString()}秒`
  }
  return `${seconds.toString()}秒`
}

/**
 * セッションタイムアウト警告コンポーネント
 * セッション期限が近づいたときにユーザーに警告を表示
 */
export const SessionTimeoutWarning = ({
  timeRemaining,
  onExtend,
  onLogout,
  onDismiss,
  show = true,
  urgent = false,
}: SessionTimeoutWarningProps) => {
  const [displayTime, setDisplayTime] = useState(timeRemaining)

  // タイマーの更新
  useEffect(() => {
    setDisplayTime(timeRemaining)
  }, [timeRemaining])

  // 緊急度の判定（1分以下で緊急）
  const isUrgent = urgent || displayTime <= 60

  // 表示しない場合
  if (!show) return null

  return (
    <Alert
      role="alert"
      aria-live={isUrgent ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={cn(
        'fixed bottom-4 right-4 z-50 max-w-md shadow-lg',
        isUrgent ? 'border-red-500 bg-red-50 dark:bg-red-950' : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className={cn(
            'h-5 w-5 flex-shrink-0',
            isUrgent ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'
          )}
        />

        <div className="flex-1">
          <AlertTitle className="mb-2">
            セッションの有効期限が近づいています
          </AlertTitle>

          <AlertDescription>
            <div className="mb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-semibold">
                  残り時間: {formatTime(displayTime)}
                </span>
              </div>
              <p className="mt-1 text-sm">
                セッションを延長するか、作業内容を保存してログアウトしてください。
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={isUrgent ? 'destructive' : 'default'}
                onClick={onExtend}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                セッションを延長
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={onLogout}
                className="flex items-center gap-1"
              >
                <LogOut className="h-3 w-3" />
                ログアウト
              </Button>

              {onDismiss && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDismiss}
                  className="flex items-center gap-1"
                  aria-label="閉じる"
                >
                  <X className="h-3 w-3" />
                  閉じる
                </Button>
              )}
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  )
}