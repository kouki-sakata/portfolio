import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/features/auth/hooks/useAuth'
import type { HttpClientError } from '@/shared/api/httpClient'

export const SignInPage = () => {
  const navigate = useNavigate()
  const { login, loading } = useAuth()
  const [formState, setFormState] = useState({ email: '', password: '' })
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    try {
      await login(formState)
      void navigate('/')
    } catch (err) {
      // ログイン失敗時の詳細はユーザーに開示しない（セキュリティ/UX）ため、常に同一メッセージを表示
      // CI/E2E 環境の差異（401/403/その他）にも頑健
      setError('メールアドレスまたはパスワードが正しくありません。')
      // 開発者向けにデバッグ用途でコンソールへは詳細を出す
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.debug('Login failed:', err as HttpClientError)
      }
    }
  }

  return (
    <div className="auth-card" aria-live="polite">
      <h1 className="auth-card__title">TeamDevelop Bravo にサインイン</h1>
      <form
        className="auth-card__form"
        onSubmit={(event) => {
          void handleSubmit(event)
        }}
      >
        <label className="auth-card__label" htmlFor="email">
          メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className="auth-card__input"
          value={formState.email}
          onChange={(event) => {
            setFormState((prev) => ({ ...prev, email: event.target.value }))
          }}
          required
        />

        <label className="auth-card__label" htmlFor="password">
          パスワード
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="auth-card__input"
          value={formState.password}
          onChange={(event) => {
            setFormState((prev) => ({ ...prev, password: event.target.value }))
          }}
          minLength={8}
          required
        />

        {error ? <p className="auth-card__error">{error}</p> : null}

        <button className="auth-card__submit" type="submit" disabled={loading}>
          {loading ? 'サインイン中…' : 'サインイン'}
        </button>
      </form>
    </div>
  )
}
