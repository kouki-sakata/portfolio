import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { UnexpectedError } from "../api/errors";
import { GlobalErrorHandler } from "./GlobalErrorHandler";

/**
 * ErrorBoundaryのプロパティ
 */
export type ErrorBoundaryProps = {
  /**
   * 子コンポーネント
   */
  children: ReactNode;

  /**
   * エラー時に表示するフォールバックUI
   * ReactElement、関数、またはコンポーネントを指定可能
   */
  fallback:
    | ReactNode
    | ((props: ErrorBoundaryFallbackProps) => ReactNode)
    | React.ComponentType<ErrorBoundaryFallbackProps>;

  /**
   * エラー発生時のコールバック
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;

  /**
   * リセット時にクエリをリセットする関数（React Query用）
   */
  resetQueries?: () => void;
};

/**
 * フォールバックコンポーネントに渡されるプロパティ
 */
export type ErrorBoundaryFallbackProps = {
  /**
   * キャッチされたエラー
   */
  error: Error;

  /**
   * エラー境界をリセットする関数
   */
  reset: () => void;
};

/**
 * ErrorBoundaryの状態
 */
type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

/**
 * React Error Boundaryコンポーネント
 * コンポーネントツリー内で発生したエラーをキャッチして処理します
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  /**
   * エラーが発生した際に呼ばれる静的メソッド
   * 新しいstateを返すことでコンポーネントを更新
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * エラーの詳細情報を記録
   */
  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // GlobalErrorHandlerでエラー処理
    try {
      const errorHandler = GlobalErrorHandler.getInstance();
      // エラーをUnexpectedErrorとしてラップ
      const unexpectedError =
        error instanceof UnexpectedError
          ? error
          : new UnexpectedError(error.message, { originalError: error });

      errorHandler.handle(unexpectedError);
    } catch (_e) {
      // エラーハンドラー自体のエラーは握りつぶす（エラー処理の無限ループを防ぐ）
    }

    // onErrorコールバックを実行
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * エラー境界をリセット
   */
  reset = (): void => {
    // React Queryのクエリをリセット
    if (this.props.resetQueries) {
      this.props.resetQueries();
    }

    // 状態をリセット
    this.setState({
      hasError: false,
      error: null,
    });
  };

  /**
   * フォールバックUIをレンダリング
   */
  private renderFallback(): ReactNode {
    const { fallback } = this.props;
    const { error } = this.state;

    if (!error) {
      return null;
    }

    const fallbackProps: ErrorBoundaryFallbackProps = {
      error,
      reset: this.reset,
    };

    // 関数の場合
    if (typeof fallback === "function") {
      // コンポーネントの場合
      if (fallback.prototype?.isReactComponent) {
        const FallbackComponent =
          fallback as React.ComponentType<ErrorBoundaryFallbackProps>;
        return <FallbackComponent {...fallbackProps} />;
      }
      // 通常の関数の場合
      return (fallback as (props: ErrorBoundaryFallbackProps) => ReactNode)(
        fallbackProps
      );
    }

    // ReactElementの場合
    return fallback;
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return this.renderFallback();
    }

    return this.props.children;
  }
}

/**
 * ErrorBoundaryを使いやすくするためのHOC
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps: Omit<ErrorBoundaryProps, "children">
): React.ComponentType<P> {
  const EnhancedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  // Display name for debugging
  EnhancedComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;

  return EnhancedComponent;
}
