import { act, renderHook } from '@testing-library/react'
import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest'

import { useSessionTimeout } from '@/features/auth/hooks/useSessionTimeout'
import type { SessionInfo } from '@/features/auth/types/auth-context.types'

describe('useSessionTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('セッション期限チェック', () => {
    it('セッションが有効な場合は警告を表示しない', () => {
      const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000) // 2時間後
      const sessionInfo: SessionInfo = {
        createdAt: new Date(),
        expiresAt: futureTime,
        lastActivity: new Date(),
        warningThreshold: 15, // 15分前に警告
      }

      const onWarning = vi.fn()
      const onExpired = vi.fn()

      const { result } = renderHook(() =>
        useSessionTimeout(sessionInfo, onWarning, onExpired)
      )

      expect(result.current.isExpiring).toBe(false)
      expect(result.current.timeRemaining).toBeGreaterThan(60 * 60 * 1000)
      expect(onWarning).not.toHaveBeenCalled()
      expect(onExpired).not.toHaveBeenCalled()
    })

    it('警告閾値に達した場合に警告を表示する', () => {
      const futureTime = new Date(Date.now() + 10 * 60 * 1000) // 10分後
      const sessionInfo: SessionInfo = {
        createdAt: new Date(),
        expiresAt: futureTime,
        lastActivity: new Date(),
        warningThreshold: 15, // 15分前に警告
      }

      const onWarning = vi.fn()
      const onExpired = vi.fn()

      const { result } = renderHook(() =>
        useSessionTimeout(sessionInfo, onWarning, onExpired)
      )

      expect(result.current.isExpiring).toBe(true)
      expect(result.current.timeRemaining).toBeLessThanOrEqual(10 * 60 * 1000)
      expect(onWarning).toHaveBeenCalledTimes(1)
      expect(onExpired).not.toHaveBeenCalled()
    })

    it('セッションが期限切れの場合にonExpiredを呼ぶ', () => {
      const pastTime = new Date(Date.now() - 1000) // 1秒前（期限切れ）
      const sessionInfo: SessionInfo = {
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
        expiresAt: pastTime,
        lastActivity: new Date(Date.now() - 5 * 60 * 1000),
        warningThreshold: 15,
      }

      const onWarning = vi.fn()
      const onExpired = vi.fn()

      renderHook(() =>
        useSessionTimeout(sessionInfo, onWarning, onExpired)
      )

      expect(onExpired).toHaveBeenCalledTimes(1)
      expect(onWarning).not.toHaveBeenCalled()
    })
  })

  describe('タイマー管理', () => {
    it('定期的に残り時間を更新する', () => {
      const futureTime = new Date(Date.now() + 30 * 60 * 1000) // 30分後
      const sessionInfo: SessionInfo = {
        createdAt: new Date(),
        expiresAt: futureTime,
        lastActivity: new Date(),
        warningThreshold: 15,
      }

      const onWarning = vi.fn()
      const onExpired = vi.fn()

      const { result } = renderHook(() =>
        useSessionTimeout(sessionInfo, onWarning, onExpired)
      )

      const initialTime = result.current.timeRemaining

      act(() => {
        vi.advanceTimersByTime(5000) // 5秒進める
      })

      if (initialTime !== null) {
        expect(result.current.timeRemaining).toBeLessThan(initialTime)
        expect(result.current.timeRemaining).toBeGreaterThan(initialTime - 10000)
      } else {
        throw new Error('Expected initialTime to be non-null')
      }
    })

    it('セッション情報がnullの場合はタイマーを開始しない', () => {
      const onWarning = vi.fn()
      const onExpired = vi.fn()

      const { result } = renderHook(() =>
        useSessionTimeout(null, onWarning, onExpired)
      )

      expect(result.current.isExpiring).toBe(false)
      expect(result.current.timeRemaining).toBeNull()
      expect(onWarning).not.toHaveBeenCalled()
      expect(onExpired).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(10000)
      })

      expect(onWarning).not.toHaveBeenCalled()
      expect(onExpired).not.toHaveBeenCalled()
    })

    it('アンマウント時にタイマーをクリーンアップする', () => {
      const futureTime = new Date(Date.now() + 30 * 60 * 1000)
      const sessionInfo: SessionInfo = {
        createdAt: new Date(),
        expiresAt: futureTime,
        lastActivity: new Date(),
        warningThreshold: 15,
      }

      const onWarning = vi.fn()
      const onExpired = vi.fn()

      const { unmount } = renderHook(() =>
        useSessionTimeout(sessionInfo, onWarning, onExpired)
      )

      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')

      unmount()

      expect(clearIntervalSpy).toHaveBeenCalled()
    })
  })

  describe('セッション延長機能', () => {
    it('extendSession関数でセッション期限を延長できる', () => {
      const futureTime = new Date(Date.now() + 10 * 60 * 1000) // 10分後
      const sessionInfo: SessionInfo = {
        createdAt: new Date(),
        expiresAt: futureTime,
        lastActivity: new Date(),
        warningThreshold: 15,
      }

      const onWarning = vi.fn()
      const onExpired = vi.fn()
      const onExtend = vi.fn()

      const { result } = renderHook(() =>
        useSessionTimeout(sessionInfo, onWarning, onExpired, onExtend)
      )

      expect(result.current.isExpiring).toBe(true)

      act(() => {
        result.current.extendSession()
      })

      expect(onExtend).toHaveBeenCalledTimes(1)
    })
  })

  describe('警告のスヌーズ機能', () => {
    it('snoozeWarning関数で警告を一時的に非表示にできる', () => {
      const futureTime = new Date(Date.now() + 10 * 60 * 1000)
      const sessionInfo: SessionInfo = {
        createdAt: new Date(),
        expiresAt: futureTime,
        lastActivity: new Date(),
        warningThreshold: 15,
      }

      const onWarning = vi.fn()
      const onExpired = vi.fn()

      const { result } = renderHook(() =>
        useSessionTimeout(sessionInfo, onWarning, onExpired)
      )

      expect(result.current.showWarning).toBe(true)

      act(() => {
        result.current.snoozeWarning(5) // 5分間スヌーズ
      })

      expect(result.current.showWarning).toBe(false)

      // 5分後に再表示される
      act(() => {
        vi.advanceTimersByTime(5 * 60 * 1000)
      })

      expect(result.current.showWarning).toBe(true)
    })
  })

  describe('フォーマット関数', () => {
    it('残り時間を読みやすい形式でフォーマットする', () => {
      const futureTime = new Date(Date.now() + 125 * 1000) // 2分5秒後
      const sessionInfo: SessionInfo = {
        createdAt: new Date(),
        expiresAt: futureTime,
        lastActivity: new Date(),
        warningThreshold: 15,
      }

      const onWarning = vi.fn()
      const onExpired = vi.fn()

      const { result } = renderHook(() =>
        useSessionTimeout(sessionInfo, onWarning, onExpired)
      )

      expect(result.current.formattedTimeRemaining).toBe('2分5秒')
    })

    it('1時間以上の場合は時間も表示する', () => {
      const futureTime = new Date(Date.now() + (90 * 60 + 30) * 1000) // 1時間30分30秒後
      const sessionInfo: SessionInfo = {
        createdAt: new Date(),
        expiresAt: futureTime,
        lastActivity: new Date(),
        warningThreshold: 15,
      }

      const onWarning = vi.fn()
      const onExpired = vi.fn()

      const { result } = renderHook(() =>
        useSessionTimeout(sessionInfo, onWarning, onExpired)
      )

      expect(result.current.formattedTimeRemaining).toBe('1時間30分30秒')
    })
  })
})