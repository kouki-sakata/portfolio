import "@/styles/global.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { lazy, StrictMode, Suspense, useEffect } from "react";

// ReactQueryDevtoolsを動的importで遅延ロード
const ReactQueryDevtools = lazy(() =>
  import("@tanstack/react-query-devtools").then((module) => ({
    default: module.ReactQueryDevtools,
  }))
);

import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
  useNavigate,
} from "react-router-dom";

import { queryClient } from "@/app/config/queryClient";
import { AppLayout } from "@/app/layouts/AppLayout";
import {
  employeeAdminRouteLoader,
  homeRouteLoader,
  newsManagementLoader,
  stampHistoryRouteLoader,
} from "@/app/providers/routeLoaders";
import { Toaster } from "@/components/ui/toaster";
import { SessionTimeoutNotification } from "@/features/auth/components/SessionTimeoutNotification";
import { AuthProvider } from "@/features/auth/context/AuthProvider";
import { IconSpriteSheet } from "@/shared/components/icons/SpriteIcon";
import { PageLoader } from "@/shared/components/layout/PageLoader";

// Lazy load route components for code splitting
const SignInRoute = lazy(() =>
  import("@/features/auth/routes/SignInRoute").then((module) => ({
    default: module.SignInRoute,
  }))
);

const EmployeeAdminRoute = lazy(() =>
  import("@/features/employees/routes/EmployeeAdminRoute").then((module) => ({
    default: module.EmployeeAdminRoute,
  }))
);

const HomeRoute = lazy(() =>
  import("@/features/home/routes/HomeRoute").then((module) => ({
    default: module.HomeRoute,
  }))
);

const StampHistoryRoute = lazy(() =>
  import("@/features/stampHistory/routes/StampHistoryRoute").then((module) => ({
    default: module.StampHistoryRoute,
  }))
);

const NewsManagementRoute = lazy(() =>
  import("@/features/news/routes/NewsManagementRoute").then((module) => ({
    default: module.NewsManagementRoute,
  }))
);

const ProfileRoute = lazy(() =>
  import("@/features/profile/routes/ProfileRoute").then((module) => ({
    default: module.ProfileRoute,
  }))
);

const StampRequestWorkflowRoute = lazy(() =>
  import(
    "@/features/stampRequestWorkflow/routes/StampRequestWorkflowRoute"
  ).then((module) => ({
    default: module.StampRequestWorkflowRoute,
  }))
);

import { useToast } from "@/hooks/use-toast";
import {
  type AuthEventPayload,
  authEvents,
} from "@/shared/api/events/authEvents";
import { AdminGuard } from "@/shared/components/guards/AdminGuard";
import { ComingSoon } from "@/shared/components/layout/ComingSoon";
import { NotFoundRoute } from "@/shared/components/layout/NotFoundRoute";

// Root component that provides auth context to all routes
const RootWithAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Handle unauthorized events (401 errors)
    const handleUnauthorized = (payload: AuthEventPayload) => {
      toast({
        title: "認証エラー",
        description: payload.message ?? "ログインしてください。",
        variant: "destructive",
      });

      // Navigate to login page
      if (payload.redirectUrl) {
        navigate(payload.redirectUrl);
      }
    };

    // Handle forbidden events (403 errors)
    const handleForbidden = (payload: AuthEventPayload) => {
      toast({
        title: "アクセス拒否",
        description:
          payload.message ?? "このリソースにアクセスする権限がありません。",
        variant: "destructive",
      });
    };

    // Subscribe to auth events
    authEvents.onUnauthorized(handleUnauthorized);
    authEvents.onForbidden(handleForbidden);

    // Cleanup
    return () => {
      authEvents.offUnauthorized(handleUnauthorized);
      authEvents.offForbidden(handleForbidden);
    };
  }, [navigate, toast]);

  return (
    <AuthProvider>
      <Outlet />
      <SessionTimeoutNotification />
      <Toaster />
    </AuthProvider>
  );
};

// Define the router with auth provider at the root
const router = createBrowserRouter([
  {
    path: "/",
    element: <RootWithAuth />,
    children: [
      {
        path: "signin",
        element: <SignInRoute />,
      },
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <HomeRoute />,
            loader: () => homeRouteLoader(queryClient),
          },
          {
            path: "stamp-history",
            element: <StampHistoryRoute />,
            loader: () => stampHistoryRouteLoader(queryClient),
          },
          {
            path: "profile",
            element: <ProfileRoute />,
          },
          {
            path: "news-management",
            element: <NewsManagementRoute />,
            loader: () => newsManagementLoader(queryClient),
          },
          {
            path: "stamp-requests",
            element: <StampRequestWorkflowRoute />,
          },
          {
            path: "news",
            element: (
              <ComingSoon
                description="フロントエンドの刷新に向けて準備中です。"
                title="お知らせ"
              />
            ),
          },
          {
            path: "admin/employees",
            element: <EmployeeAdminRoute />,
            loader: () => employeeAdminRouteLoader(queryClient),
          },
          {
            path: "admin/logs",
            element: (
              <AdminGuard>
                <ComingSoon
                  description="ログ管理機能のReact移行を進行中です。"
                  title="操作ログ"
                />
              </AdminGuard>
            ),
          },
        ],
      },
      { path: "*", element: <NotFoundRoute /> },
    ],
  },
]);

export const AppProviders = () => (
  <StrictMode>
    <IconSpriteSheet />
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<PageLoader label="画面を読み込み中" />}>
        <RouterProvider router={router} />
      </Suspense>
      {import.meta.env.DEV &&
      import.meta.env["VITE_DISABLE_DATA_TABLE_VIEW_OPTIONS"] !== "true" ? (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      ) : null}
    </QueryClientProvider>
  </StrictMode>
);
