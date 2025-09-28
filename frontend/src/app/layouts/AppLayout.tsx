import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { AppHeader } from '@/shared/components/layout/AppHeader';
import { AppShell } from '@/shared/components/layout/AppShell';
import { AppSidebar } from '@/shared/components/layout/AppSidebar';
import { PageLoader } from '@/shared/components/layout/PageLoader';

export const AppLayout = () => {
  const location = useLocation();
  const { authenticated, loading } = useAuth();

  if (loading) {
    return (
      <AppShell>
        <main className="col-span-full flex items-center justify-center" role="main">
          <PageLoader label="読み込み中" />
        </main>
      </AppShell>
    );
  }

  if (!authenticated) {
    return <Navigate to="/signin" replace state={{ redirectTo: location.pathname }} />;
  }

  return (
    <AppShell>
      {/* デスクトップ用サイドバー */}
      <AppSidebar className="hidden lg:block" />

      {/* メインコンテンツエリア */}
      <div className="flex flex-col min-h-screen lg:min-h-0">
        <AppHeader />
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto" role="main">
          <Outlet />
        </main>
      </div>
    </AppShell>
  );
};
