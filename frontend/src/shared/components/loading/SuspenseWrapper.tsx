import {
  type ReactNode,
  Suspense,
  useEffect,
  useState,
  useTransition,
} from "react";
import { ErrorBoundary } from "@/shared/error-handling/ErrorBoundary";
import { LoadingSpinner } from "./LoadingSpinner";
import {
  SkeletonCard,
  SkeletonForm,
  SkeletonTable,
  SkeletonText,
} from "./skeletons/SkeletonVariants";

export type FallbackType =
  | "spinner"
  | "skeleton-card"
  | "skeleton-table"
  | "skeleton-form"
  | "skeleton-text";

export type SuspenseWrapperProps = {
  /** 子要素 */
  children: ReactNode;
  /** カスタムフォールバックコンポーネント */
  fallback?: ReactNode;
  /** フォールバックタイプ（fallbackが指定されていない場合に使用） */
  fallbackType?: FallbackType;
  /** エラー時のフォールバックコンポーネント */
  errorFallback?: ReactNode;
  /** エラーハンドリングコールバック */
  onError?: (error: Error) => void;
  /** フォールバック表示までの遅延時間（ms） */
  showDelay?: number;
  /** Suspense境界に適用するkey（リセット用） */
  suspenseKey?: string;
};

/**
 * 遅延表示付きフォールバックコンポーネント
 */
const DelayedFallback = ({
  delay,
  children,
}: {
  delay: number;
  children: ReactNode;
}) => {
  const [showFallback, setShowFallback] = useState(delay === 0);

  useEffect(() => {
    if (delay === 0) {
      return;
    }

    const timer = setTimeout(() => {
      setShowFallback(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!showFallback) {
    return null;
  }

  return <>{children}</>;
};

/**
 * デフォルトのフォールバックコンポーネントを取得
 */
const getDefaultFallback = (type: FallbackType): ReactNode => {
  switch (type) {
    case "skeleton-card":
      return <SkeletonCard />;
    case "skeleton-table":
      return <SkeletonTable />;
    case "skeleton-form":
      return <SkeletonForm />;
    case "skeleton-text":
      return <SkeletonText />;
    default:
      return <LoadingSpinner center />;
  }
};

/**
 * React Suspense統合ラッパーコンポーネント
 *
 * @description
 * React 19のSuspense機能を活用し、非同期コンポーネントのローディング状態とエラー処理を統合管理します。
 * 様々なフォールバックタイプをサポートし、遅延表示機能も提供します。
 *
 * @example
 * ```tsx
 * // 基本的な使用方法
 * <SuspenseWrapper>
 *   <AsyncComponent />
 * </SuspenseWrapper>
 *
 * // スケルトンフォールバック
 * <SuspenseWrapper fallbackType="skeleton-card">
 *   <UserCard />
 * </SuspenseWrapper>
 *
 * // カスタムフォールバックとエラーハンドリング
 * <SuspenseWrapper
 *   fallback={<CustomLoader />}
 *   errorFallback={<CustomError />}
 *   onError={(error) => console.error(error)}
 * >
 *   <DataTable />
 * </SuspenseWrapper>
 *
 * // 遅延表示（100ms後にローディング表示）
 * <SuspenseWrapper showDelay={100}>
 *   <QuickLoadingComponent />
 * </SuspenseWrapper>
 * ```
 */
export function SuspenseWrapper({
  children,
  fallback,
  fallbackType = "spinner",
  errorFallback,
  onError,
  showDelay = 0,
  suspenseKey,
}: SuspenseWrapperProps) {
  // フォールバックコンポーネントの決定
  const suspenseFallback = fallback ?? getDefaultFallback(fallbackType);

  // 遅延表示が必要な場合はDelayedFallbackでラップ
  const finalFallback =
    showDelay > 0 ? (
      <DelayedFallback delay={showDelay}>{suspenseFallback}</DelayedFallback>
    ) : (
      suspenseFallback
    );

  // デフォルトのエラーフォールバック
  const defaultErrorFallback = () => (
    <div className="p-4" data-testid="error-fallback">
      <p className="text-destructive">エラーが発生しました</p>
    </div>
  );

  return (
    <ErrorBoundary
      fallback={errorFallback ?? defaultErrorFallback}
      onError={onError ? (error) => onError(error) : undefined}
    >
      <Suspense fallback={finalFallback} key={suspenseKey}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

/**
 * ページレベルのSuspenseラッパー
 * ページ全体のローディング状態を管理する際に使用
 */
export function PageSuspenseWrapper({
  children,
  ...props
}: Omit<SuspenseWrapperProps, "fallbackType">) {
  return (
    <SuspenseWrapper
      {...props}
      fallback={
        props.fallback ?? <LoadingSpinner fullScreen showText size="lg" />
      }
      fallbackType="spinner"
    >
      {children}
    </SuspenseWrapper>
  );
}

/**
 * useTransitionと組み合わせたSuspenseラッパー
 * ナビゲーション時などの遷移状態を管理
 */
export function TransitionSuspenseWrapper({
  children,
  onTransitionStart,
  onTransitionEnd,
  ...props
}: SuspenseWrapperProps & {
  onTransitionStart?: () => void;
  onTransitionEnd?: () => void;
}) {
  const [isPending, _startTransition] = useTransition();

  useEffect(() => {
    if (isPending) {
      onTransitionStart?.();
    } else {
      onTransitionEnd?.();
    }
  }, [isPending, onTransitionStart, onTransitionEnd]);

  return (
    <div className={isPending ? "opacity-50 transition-opacity" : ""}>
      <SuspenseWrapper {...props}>{children}</SuspenseWrapper>
    </div>
  );
}
