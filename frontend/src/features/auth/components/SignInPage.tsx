import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";
import type { HttpClientError } from "@/shared/api/httpClient";

export const SignInPage = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [formState, setFormState] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await login(formState);
      // biome-ignore lint/complexity/noVoid: navigate returns void; no async handling required
      void navigate("/");
    } catch (err) {
      // ログイン失敗時の詳細はユーザーに開示しない（セキュリティ/UX）ため、常に同一メッセージを表示
      // CI/E2E 環境の差異（401/403/その他）にも頑健
      setError("メールアドレスまたはパスワードが正しくありません。");
      // 開発者向けにデバッグ用途でコンソールへは詳細を出す
      if (!import.meta.env.PROD) {
        // biome-ignore lint/suspicious/noConsole: emit diagnostic info in non-production environments
        console.debug("Login failed:", err as HttpClientError);
      }
    }
  };

  return (
    <div aria-live="polite" className="auth-card">
      <h1 className="auth-card__title">TeamDevelop Bravo にサインイン</h1>
      <form
        className="auth-card__form"
        onSubmit={(event) => {
          // biome-ignore lint/complexity/noVoid: submission handler intentionally returns a promise
          void handleSubmit(event);
        }}
      >
        <label className="auth-card__label" htmlFor="email">
          メールアドレス
        </label>
        <input
          autoComplete="email"
          className="auth-card__input"
          id="email"
          name="email"
          onChange={(event) => {
            setFormState((prev) => ({ ...prev, email: event.target.value }));
          }}
          required
          type="email"
          value={formState.email}
        />

        <label className="auth-card__label" htmlFor="password">
          パスワード
        </label>
        <input
          autoComplete="current-password"
          className="auth-card__input"
          id="password"
          minLength={8}
          name="password"
          onChange={(event) => {
            setFormState((prev) => ({ ...prev, password: event.target.value }));
          }}
          required
          type="password"
          value={formState.password}
        />

        {error ? <p className="auth-card__error">{error}</p> : null}

        <button className="auth-card__submit" disabled={loading} type="submit">
          {loading ? "サインイン中…" : "サインイン"}
        </button>
      </form>
    </div>
  );
};
