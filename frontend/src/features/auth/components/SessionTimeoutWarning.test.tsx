import { fireEvent,render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SessionTimeoutWarning } from '@/features/auth/components/SessionTimeoutWarning'

describe('SessionTimeoutWarning', () => {
  const defaultProps = {
    timeRemaining: 300, // 5分
    onExtend: vi.fn(),
    onLogout: vi.fn(),
  }

  describe('レンダリング', () => {
    it('警告メッセージを表示する', () => {
      render(<SessionTimeoutWarning {...defaultProps} />)

      expect(screen.getByText(/セッションの有効期限が近づいています/)).toBeInTheDocument()
    })

    it('残り時間を表示する', () => {
      render(<SessionTimeoutWarning {...defaultProps} />)

      expect(screen.getByText(/5分0秒/)).toBeInTheDocument()
    })

    it('セッション延長ボタンを表示する', () => {
      render(<SessionTimeoutWarning {...defaultProps} />)

      expect(screen.getByRole('button', { name: /セッションを延長/ })).toBeInTheDocument()
    })

    it('ログアウトボタンを表示する', () => {
      render(<SessionTimeoutWarning {...defaultProps} />)

      expect(screen.getByRole('button', { name: /ログアウト/ })).toBeInTheDocument()
    })
  })

  describe('時間フォーマット', () => {
    it('秒単位で表示する（1分未満）', () => {
      render(<SessionTimeoutWarning {...defaultProps} timeRemaining={45} />)

      expect(screen.getByText(/45秒/)).toBeInTheDocument()
    })

    it('分と秒で表示する（1分以上）', () => {
      render(<SessionTimeoutWarning {...defaultProps} timeRemaining={125} />)

      expect(screen.getByText(/2分5秒/)).toBeInTheDocument()
    })

    it('0秒の場合に適切に表示する', () => {
      render(<SessionTimeoutWarning {...defaultProps} timeRemaining={0} />)

      expect(screen.getByText(/0秒/)).toBeInTheDocument()
    })
  })

  describe('ユーザー操作', () => {
    it('セッション延長ボタンクリックでonExtendを呼ぶ', () => {
      const onExtend = vi.fn()
      render(<SessionTimeoutWarning {...defaultProps} onExtend={onExtend} />)

      const extendButton = screen.getByRole('button', { name: /セッションを延長/ })
      fireEvent.click(extendButton)

      expect(onExtend).toHaveBeenCalledTimes(1)
    })

    it('ログアウトボタンクリックでonLogoutを呼ぶ', () => {
      const onLogout = vi.fn()
      render(<SessionTimeoutWarning {...defaultProps} onLogout={onLogout} />)

      const logoutButton = screen.getByRole('button', { name: /ログアウト/ })
      fireEvent.click(logoutButton)

      expect(onLogout).toHaveBeenCalledTimes(1)
    })

    it('閉じるボタンクリックでonDismissを呼ぶ', () => {
      const onDismiss = vi.fn()
      render(<SessionTimeoutWarning {...defaultProps} onDismiss={onDismiss} />)

      const closeButton = screen.getByRole('button', { name: /閉じる/ })
      fireEvent.click(closeButton)

      expect(onDismiss).toHaveBeenCalledTimes(1)
    })
  })

  describe('アクセシビリティ', () => {
    it('適切なARIA属性を持つ', () => {
      render(<SessionTimeoutWarning {...defaultProps} />)

      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
      expect(alert).toHaveAttribute('aria-live', 'polite')
    })

    it('緊急度に応じたaria-liveを設定する', () => {
      render(<SessionTimeoutWarning {...defaultProps} timeRemaining={30} urgent />)

      const alert = screen.getByRole('alert')
      expect(alert).toHaveAttribute('aria-live', 'assertive')
    })
  })

  describe('スタイリング', () => {
    it('警告レベルに応じたスタイルを適用する', () => {
      const { rerender } = render(<SessionTimeoutWarning {...defaultProps} timeRemaining={300} />)

      expect(screen.getByRole('alert')).toHaveClass('border-yellow-500')

      rerender(<SessionTimeoutWarning {...defaultProps} timeRemaining={60} />)

      expect(screen.getByRole('alert')).toHaveClass('border-red-500')
    })
  })

  describe('条件付きレンダリング', () => {
    it('showプロパティがfalseの場合は表示しない', () => {
      const { container } = render(<SessionTimeoutWarning {...defaultProps} show={false} />)

      expect(container.firstChild).toBeNull()
    })

    it('showプロパティがtrueの場合は表示する', () => {
      render(<SessionTimeoutWarning {...defaultProps} show={true} />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })
})