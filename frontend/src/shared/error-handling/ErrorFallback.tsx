import React from 'react';
import { AlertCircle, Home, RefreshCw, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/shared/utils/cn';
import {
  isNetworkError,
  isValidationError,
  isAuthorizationError,
  isUnexpectedError,
  type ApiError,
  type ValidationError,
} from '../api/errors';

/**
 * ErrorFallbackコンポーネントのプロパティ
 */
export interface ErrorFallbackProps {
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
}

/**
 * エラー時に表示するフォールバックUIコンポーネント
 */
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  reset,
  title,
  description,
  showDetails = process.env.NODE_ENV === 'development',
}) => {
  // エラータイプに応じたタイトルとメッセージを取得
  const getErrorInfo = () => {
    if (title && description) {
      return { title, description, icon: AlertCircle, variant: 'destructive' as const };
    }

    if (isNetworkError(error)) {
      return {
        title: 'ネットワークエラー',
        description: 'ネットワーク接続に問題が発生しました。インターネット接続を確認してください。',
        icon: AlertTriangle,
        variant: 'destructive' as const,
      };
    }

    if (isValidationError(error)) {
      const validationError = error as ValidationError;
      const fieldErrors = Object.entries(validationError.fieldErrors || {})
        .map(([field, errors]) => errors.join(', '))
        .join('\n');

      return {
        title: '入力エラー',
        description: fieldErrors || '入力内容を確認してください。',
        icon: AlertCircle,
        variant: 'destructive' as const,
      };
    }

    if (isAuthorizationError(error)) {
      return {
        title: '権限エラー',
        description: 'この操作を実行する権限がありません。',
        icon: AlertCircle,
        variant: 'destructive' as const,
      };
    }

    if (isUnexpectedError(error)) {
      return {
        title: 'エラーが発生しました',
        description: '予期しないエラーが発生しました。しばらくしてから再度お試しください。',
        icon: AlertCircle,
        variant: 'destructive' as const,
      };
    }

    // 標準のエラー
    return {
      title: 'エラーが発生しました',
      description: error.message || '予期しないエラーが発生しました。',
      icon: AlertCircle,
      variant: 'destructive' as const,
    };
  };

  const errorInfo = getErrorInfo();
  const Icon = errorInfo.icon;

  // ホームページに戻る処理
  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="space-y-1">
          <div className="flex items-center space-x-2">
            <Icon className="h-6 w-6 text-destructive" role="img" aria-hidden />
            <h1 className="text-2xl font-bold">{errorInfo.title}</h1>
          </div>
        </CardHeader>

        <CardContent>
          <Alert variant={errorInfo.variant} role="alert">
            <AlertDescription className="whitespace-pre-line">
              {errorInfo.description}
            </AlertDescription>
          </Alert>

          {/* 開発環境でエラー詳細を表示 */}
          {showDetails && error.stack && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h2 className="text-sm font-semibold mb-2">エラー詳細</h2>
              <pre className="text-xs overflow-auto max-h-40 text-muted-foreground">
                {error.stack}
              </pre>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button
            onClick={reset}
            className="flex-1"
            variant="default"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            再試行
          </Button>
          <Button
            onClick={handleGoHome}
            variant="outline"
            className="flex-1"
          >
            <Home className="mr-2 h-4 w-4" />
            ホームに戻る
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

/**
 * シンプルなエラーフォールバック（最小限のUI）
 */
export const SimpleErrorFallback: React.FC<{
  error: Error;
  reset: () => void;
}> = ({ error, reset }) => (
  <div className="min-h-[400px] flex flex-col items-center justify-center p-8">
    <AlertCircle className="h-12 w-12 text-destructive mb-4" />
    <h2 className="text-xl font-semibold mb-2">エラーが発生しました</h2>
    <p className="text-muted-foreground text-center mb-6 max-w-md">
      {error.message || '予期しないエラーが発生しました。'}
    </p>
    <Button onClick={reset} variant="default">
      再試行
    </Button>
  </div>
);

/**
 * デフォルトのErrorFallbackコンポーネント
 */
export default ErrorFallback;