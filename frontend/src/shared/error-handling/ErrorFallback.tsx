import { AlertCircle, AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
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

/**
 * エラー時に表示するフォールバックUIコンポーネント
 *
 * @remarks
 * TypeScript v5推奨: React.FCではなく関数宣言を使用
 * より良い型推論とgenericsサポートのため
 */
export function ErrorFallback({
  error,
  reset,
  title,
  description,
  showDetails = import.meta.env.MODE === "development",
}: ErrorFallbackProps) {
  // エラータイプに応じたタイトルとメッセージを取得
  const getErrorInfo = () => {
    if (title && description) {
      return {
        title,
        description,
        icon: AlertCircle,
        variant: "destructive" as const,
      };
    }

    if (isNetworkError(error)) {
      return {
        title: "ネットワークエラー",
        description:
          "ネットワーク接続に問題が発生しました。インターネット接続を確認してください。",
        icon: AlertTriangle,
        variant: "destructive" as const,
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
        icon: AlertCircle,
        variant: "destructive" as const,
      };
    }

    if (isAuthorizationError(error)) {
      return {
        title: "権限エラー",
        description: "この操作を実行する権限がありません。",
        icon: AlertCircle,
        variant: "destructive" as const,
      };
    }

    if (isUnexpectedError(error)) {
      return {
        title: "エラーが発生しました",
        description:
          "予期しないエラーが発生しました。しばらくしてから再度お試しください。",
        icon: AlertCircle,
        variant: "destructive" as const,
      };
    }

    // 標準のエラー
    return {
      title: "エラーが発生しました",
      description: error.message || "予期しないエラーが発生しました。",
      icon: AlertCircle,
      variant: "destructive" as const,
    };
  };

  const errorInfo = getErrorInfo();
  const Icon = errorInfo.icon;

  // ホームページに戻る処理
  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center space-x-2">
            <Icon aria-hidden className="h-6 w-6 text-destructive" role="img" />
            <h1 className="font-bold text-2xl">{errorInfo.title}</h1>
          </div>
        </CardHeader>

        <CardContent>
          <Alert role="alert" variant={errorInfo.variant}>
            <AlertDescription className="whitespace-pre-line">
              {errorInfo.description}
            </AlertDescription>
          </Alert>

          {/* 開発環境でエラー詳細を表示 */}
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
            <RefreshCw className="mr-2 h-4 w-4" />
            再試行
          </Button>
          <Button className="flex-1" onClick={handleGoHome} variant="outline">
            <Home className="mr-2 h-4 w-4" />
            ホームに戻る
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

/**
 * シンプルなエラーフォールバック（最小限のUI）
 *
 * @remarks
 * TypeScript v5推奨: React.FCではなく関数宣言を使用
 */
export function SimpleErrorFallback({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
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

/**
 * デフォルトのErrorFallbackコンポーネント
 */
export default ErrorFallback;
