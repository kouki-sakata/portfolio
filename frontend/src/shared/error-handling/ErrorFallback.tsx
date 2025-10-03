import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  SpriteIcon,
  type SpriteIconName,
} from "@/shared/components/icons/SpriteIcon";
import {
  type ApiError,
  isAuthorizationError,
  isNetworkError,
  isUnexpectedError,
  isValidationError,
  type ValidationError,
} from "../api/errors";

/**
 * ErrorFallbackコンポーネントのプロパティ
 */
export type ErrorFallbackProps = {
  /**
   * 表示するエラー
   */
  error: Error | ApiError;

  /**
   * エラー状態をリセットする関数
   */
  reset: () => void;

  /**
   * カスタムタイトル（オプション）
   */
  title?: string;

  /**
   * カスタム説明文（オプション）
   */
  description?: string;

  /**
   * エラーの詳細を表示するか（開発環境用）
   */
  showDetails?: boolean;
};

const DEFAULT_ICON: SpriteIconName = "alert-circle";

/**
 * エラー時に表示するフォールバックUIコンポーネント
 */
export function ErrorFallback({
  error,
  reset,
  title,
  description,
  showDetails = import.meta.env.MODE === "development",
}: ErrorFallbackProps) {
  type ErrorInfo = {
    title: string;
    description: string;
    icon: SpriteIconName;
    variant: "default" | "destructive";
  };

  const getErrorInfo = (): ErrorInfo => {
    if (title && description) {
      return {
        title,
        description,
        icon: DEFAULT_ICON,
        variant: "destructive",
      };
    }

    if (isNetworkError(error)) {
      return {
        title: "ネットワークエラー",
        description:
          "ネットワーク接続に問題が発生しました。インターネット接続を確認してください。",
        icon: "alert-triangle",
        variant: "destructive",
      };
    }

    if (isValidationError(error)) {
      const validationError = error as ValidationError;
      const fieldErrors = Object.entries(validationError.fieldErrors || {})
        .map(([_field, errors]) => errors.join(", "))
        .join("\n");

      return {
        title: "入力エラー",
        description: fieldErrors || "入力内容を確認してください。",
        icon: DEFAULT_ICON,
        variant: "destructive",
      };
    }

    if (isAuthorizationError(error)) {
      return {
        title: "権限エラー",
        description: "この操作を実行する権限がありません。",
        icon: DEFAULT_ICON,
        variant: "destructive",
      };
    }

    if (isUnexpectedError(error)) {
      return {
        title: "エラーが発生しました",
        description:
          "予期しないエラーが発生しました。しばらくしてから再度お試しください。",
        icon: DEFAULT_ICON,
        variant: "destructive",
      };
    }

    return {
      title: "エラーが発生しました",
      description: error.message || "予期しないエラーが発生しました。",
      icon: DEFAULT_ICON,
      variant: "destructive",
    };
  };

  const errorInfo = getErrorInfo();

  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center space-x-2">
            <SpriteIcon
              aria-label="エラーアイコン"
              className="h-6 w-6 text-destructive"
              name={errorInfo.icon}
            />
            <h1 className="font-bold text-2xl">{errorInfo.title}</h1>
          </div>
        </CardHeader>

        <CardContent>
          <Alert role="alert" variant={errorInfo.variant}>
            <AlertDescription className="whitespace-pre-line">
              {errorInfo.description}
            </AlertDescription>
          </Alert>

          {showDetails && error.stack && (
            <div className="mt-4 rounded-lg bg-muted p-4">
              <h2 className="mb-2 font-semibold text-sm">エラー詳細</h2>
              <pre className="max-h-40 overflow-auto text-muted-foreground text-xs">
                {error.stack}
              </pre>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button className="flex-1" onClick={reset} variant="default">
            <SpriteIcon className="mr-2 h-4 w-4" decorative name="refresh-cw" />
            再試行
          </Button>
          <Button className="flex-1" onClick={handleGoHome} variant="outline">
            <SpriteIcon className="mr-2 h-4 w-4" decorative name="home" />
            ホームに戻る
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export function SimpleErrorFallback({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <SpriteIcon
        className="mb-4 h-12 w-12 text-destructive"
        decorative
        name="alert-circle"
      />
      <h2 className="mb-2 font-semibold text-xl">エラーが発生しました</h2>
      <p className="mb-6 max-w-md text-center text-muted-foreground">
        {error.message || "予期しないエラーが発生しました。"}
      </p>
      <Button onClick={reset} variant="default">
        再試行
      </Button>
    </div>
  );
}
