import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { LoadingSpinner } from "@/shared/components/loading/LoadingSpinner";

type AdminGuardProps = {
  children: ReactNode;
};

/**
 * 管理者専用ページ用のガードコンポーネント
 *
 * @remarks
 * - 認証状態の取得中は全画面ローディングを表示
 * - 未認証の場合はサインインへリダイレクト
 * - 管理者権限がない場合はトップページへリダイレクト
 */
export const AdminGuard = ({ children }: AdminGuardProps) => {
  const { user, authenticated, loading } = useAuth();

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen
        label="認証情報を確認しています"
        showText
        size="lg"
      />
    );
  }

  if (!authenticated) {
    return <Navigate replace to="/signin" />;
  }

  if (!user?.admin) {
    return <Navigate replace to="/" />;
  }

  return <>{children}</>;
};

