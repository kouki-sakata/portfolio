import { useCallback, useEffect, useRef, useState } from 'react'

import type { SessionInfo } from '@/features/auth/types/auth-context.types'

interface UseSessionTimeoutOptions {
  /** セッションタイムアウトチェック間隔（ミリ秒） */
  checkInterval?: number
}

interface UseSessionTimeoutReturn {
  /** セッション期限が近いか */
  isExpiring: boolean
  /** 残り時間（ミリ秒） */
  timeRemaining: number | null
  /** フォーマット済み残り時間 */
  formattedTimeRemaining: string
  /** 警告を表示するか */
  showWarning: boolean
  /** セッション延長 */
  extendSession: () => void
  /** 警告のスヌーズ */
  snoozeWarning: (minutes: number) => void
}

/**
 * 時間をフォーマット
 */
const formatTime = (milliseconds: number): string => {
  if (milliseconds <= 0) return '0秒'

  const totalSeconds = Math.floor(milliseconds / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const parts: string[] = []

  if (hours > 0) {
    parts.push(`${hours.toString()}時間`)
  }
  if (minutes > 0) {
    parts.push(`${minutes.toString()}分`)
  }
  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds.toString()}秒`)
  }

  return parts.join('')
}

/**
 * セッションタイムアウト管理フック
 * セッションの有効期限を監視し、警告表示とタイムアウト処理を管理
 */
export const useSessionTimeout = (
  sessionInfo: SessionInfo | null,
  onWarning: () => void,
  onExpired: () => void,
  onExtend?: () => void,
  options?: UseSessionTimeoutOptions
): UseSessionTimeoutReturn => {
  const { checkInterval = 1000 } = options ?? {}

  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isExpiring, setIsExpiring] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [snoozeUntil, setSnoozeUntil] = useState<Date | null>(null)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasWarned = useRef(false)
  const hasExpired = useRef(false)

  // 残り時間の計算
  const calculateTimeRemaining = useCallback(() => {
    if (!sessionInfo) return null

    const now = new Date()
    const remaining = sessionInfo.expiresAt.getTime() - now.getTime()

    return remaining > 0 ? remaining : 0
  }, [sessionInfo])

  // 警告閾値の計算
  const getWarningThreshold = useCallback(() => {
    if (!sessionInfo) return 0
    return sessionInfo.warningThreshold * 60 * 1000 // 分をミリ秒に変換
  }, [sessionInfo])

  // セッション延長
  const extendSession = useCallback(() => {
    if (onExtend) {
      onExtend()
      hasWarned.current = false
      hasExpired.current = false
      setShowWarning(false)
      setSnoozeUntil(null)
    }
  }, [onExtend])

  // 警告のスヌーズ
  const snoozeWarning = useCallback((minutes: number) => {
    const snoozeTime = new Date(Date.now() + minutes * 60 * 1000)
    setSnoozeUntil(snoozeTime)
    setShowWarning(false)
  }, [])

  // タイマーの更新処理
  useEffect(() => {
    if (!sessionInfo) {
      setTimeRemaining(null)
      setIsExpiring(false)
      setShowWarning(false)
      hasWarned.current = false
      hasExpired.current = false
      return
    }

    const updateTimer = () => {
      const remaining = calculateTimeRemaining()

      if (remaining === null) {
        return
      }

      setTimeRemaining(remaining)

      const warningThreshold = getWarningThreshold()

      // セッション期限切れチェック
      if (remaining <= 0 && !hasExpired.current) {
        hasExpired.current = true
        onExpired()
        setIsExpiring(false)
        setShowWarning(false)
        return
      }

      // 警告表示チェック
      const shouldWarn = remaining <= warningThreshold && remaining > 0

      setIsExpiring(shouldWarn)

      // 警告表示の判定（スヌーズ考慮）
      if (shouldWarn) {
        const now = new Date()
        const snoozed = snoozeUntil && now < snoozeUntil

        if (!snoozed) {
          setShowWarning(true)
          if (!hasWarned.current) {
            hasWarned.current = true
            onWarning()
          }
        } else {
          setShowWarning(false)
        }
      } else {
        setShowWarning(false)
        hasWarned.current = false
      }
    }

    // 初回実行
    updateTimer()

    // 定期更新
    intervalRef.current = setInterval(updateTimer, checkInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [
    sessionInfo,
    calculateTimeRemaining,
    getWarningThreshold,
    onWarning,
    onExpired,
    checkInterval,
    snoozeUntil,
  ])

  const formattedTimeRemaining = timeRemaining !== null ? formatTime(timeRemaining) : ''

  return {
    isExpiring,
    timeRemaining,
    formattedTimeRemaining,
    showWarning,
    extendSession,
    snoozeWarning,
  }
}