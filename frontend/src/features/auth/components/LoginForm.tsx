import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon } from "lucide-react";
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
import { ApiError } from "@/shared/api/errors/ApiError";
import { EnhancedFormField } from "@/shared/components/enhanced-form-field";
import { logger } from "@/shared/utils/logger";

export const LoginForm = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

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
      // ログイン失敗時の詳細はユーザーに開示しない(セキュリティ/UX)ため、常に同一メッセージを表示
      // CI/E2E 環境の差異(401/403/その他)にも頑健
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
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        {/* Email */}
        <EnhancedFormField
          control={form.control}
          label="メールアドレス*"
          name="email"
        >
          {(field) => (
            <Input
              {...field}
              autoComplete="email"
              placeholder="メールアドレスを入力してください"
              type="email"
            />
          )}
        </EnhancedFormField>

        {/* Password */}
        <div className="w-full space-y-1">
          <EnhancedFormField
            control={form.control}
            label="パスワード*"
            name="password"
          >
            {(field) => (
              <div className="relative">
                <Input
                  {...field}
                  autoComplete="current-password"
                  className="pr-9"
                  placeholder="••••••••••••••••"
                  type={isPasswordVisible ? "text" : "password"}
                />
                <Button
                  className="absolute inset-y-0 right-0 rounded-l-none text-muted-foreground hover:bg-transparent focus-visible:ring-ring/50"
                  onClick={() =>
                    setIsPasswordVisible((prevState) => !prevState)
                  }
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  {isPasswordVisible ? (
                    <EyeOffIcon className="size-4" />
                  ) : (
                    <EyeIcon className="size-4" />
                  )}
                  <span className="sr-only">
                    {isPasswordVisible
                      ? "パスワードを隠す"
                      : "パスワードを表示"}
                  </span>
                </Button>
              </div>
            )}
          </EnhancedFormField>
        </div>

        {/* Remember Me and Forgot Password */}
        <div className="flex justify-end">
          <button
            className="cursor-pointer border-none bg-transparent p-0 text-sm hover:underline"
            onClick={() => {
              // パスワードリセット機能は今後実装予定
            }}
            type="button"
          >
            パスワードをお忘れですか？
          </button>
        </div>

        {error ? (
          <p className="font-semibold text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}

        <Button className="w-full" disabled={loading} type="submit">
          {loading ? "サインイン中…" : "TeamDevelop Bravo にサインイン"}
        </Button>
      </form>
    </Form>
  );
};
