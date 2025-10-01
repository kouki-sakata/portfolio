import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  type LoginFormData,
  loginSchema,
} from "@/features/auth/schemas/loginSchema";
import type { HttpClientError } from "@/shared/api/httpClient";
import { EnhancedFormField } from "@/shared/components/enhanced-form-field";

export const SignInPage = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onTouched",
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    try {
      await login(data);
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
      <Form {...form}>
        <form
          className="auth-card__form"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <EnhancedFormField
            control={form.control}
            label="メールアドレス"
            name="email"
          >
            {(field) => (
              <Input
                {...field}
                autoComplete="email"
                className="auth-card__input"
                type="email"
              />
            )}
          </EnhancedFormField>

          <EnhancedFormField
            control={form.control}
            label="パスワード"
            name="password"
          >
            {(field) => (
              <Input
                {...field}
                autoComplete="current-password"
                className="auth-card__input"
                type="password"
              />
            )}
          </EnhancedFormField>

          {error ? <p className="auth-card__error">{error}</p> : null}

          <Button
            className="auth-card__submit"
            disabled={loading}
            type="submit"
          >
            {loading ? "サインイン中…" : "サインイン"}
          </Button>
        </form>
      </Form>
    </div>
  );
};
