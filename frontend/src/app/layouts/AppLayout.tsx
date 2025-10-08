import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { AppHeader } from "@/shared/components/layout/AppHeader";
import { AppShell } from "@/shared/components/layout/AppShell";
import { AppSidebar } from "@/shared/components/layout/AppSidebar";
import { PageLoader } from "@/shared/components/layout/PageLoader";
import { RouteProgressBar } from "@/shared/components/layout/RouteProgressBar";

export const AppLayout = () => {
  const location = useLocation();
  const { authenticated, loading } = useAuth();

  if (loading) {
    return (
      <AppShell>
        <main className="col-span-full flex items-center justify-center">
          <PageLoader label="読み込み中" />
        </main>
      </AppShell>
    );
  }

  if (!authenticated) {
    return (
      <Navigate
        replace
        state={{ redirectTo: location.pathname }}
        to="/signin"
      />
    );
  }

  return (
    <AppShell>
      <RouteProgressBar />
      {/* デスクトップ用サイドバー */}
      <AppSidebar className="hidden lg:block" />

      {/* メインコンテンツエリア */}
      <div className="flex min-h-screen flex-col bg-slate-50/60 lg:min-h-0">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </AppShell>
  );
};
