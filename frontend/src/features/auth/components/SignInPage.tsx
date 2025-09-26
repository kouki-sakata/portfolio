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
      const httpError = err as HttpClientError
      // 認証失敗やCSRF/権限により 401/403 の可能性があるため、どちらもユーザー向けには同一メッセージを表示
      if (httpError.status === 401 || httpError.status === 403) {
        setError('メールアドレスまたはパスワードが正しくありません。')
        return
      }
      setError('サインインに失敗しました。時間を置いて再度お試しください。')
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
