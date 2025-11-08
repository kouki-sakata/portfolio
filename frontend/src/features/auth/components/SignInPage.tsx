import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  type LoginFormData,
  loginSchema,
} from "@/features/auth/schemas/loginSchema";
import { ApiError } from "@/shared/api/errors/ApiError";
import { EnhancedFormField } from "@/shared/components/enhanced-form-field";
import { logger } from "@/shared/utils/logger";

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
      if (err instanceof ApiError) {
        logger.debug("Login failed:", {
          status: err.status,
          code: err.code,
          message: err.message,
          details: err.details,
        });
      } else {
        logger.debug("Login failed:", err);
      }
    }
  };

  return (
    <div
      aria-live="polite"
      className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12"
    >
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            TeamDevelop Bravo にサインイン
          </CardTitle>
          <CardDescription className="text-center">
            メールアドレスとパスワードを入力してログインしてください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <EnhancedFormField
                control={form.control}
                label="メールアドレス"
                name="email"
              >
                {(field) => (
                  <Input
                    {...field}
                    autoComplete="email"
                    type="email"
                    placeholder="your.email@example.com"
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
                    type="password"
                    placeholder="••••••••"
                  />
                )}
              </EnhancedFormField>

              {error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <Button className="w-full" disabled={loading} type="submit">
                {loading ? "サインイン中…" : "サインイン"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
