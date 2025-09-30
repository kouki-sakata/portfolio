import "@/styles/global.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { lazy, StrictMode, useEffect } from "react";
import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
  useNavigate,
} from "react-router-dom";

import { queryClient } from "@/app/config/queryClient";
import { AppLayout } from "@/app/layouts/AppLayout";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { SessionTimeoutNotification } from "@/features/auth/components/SessionTimeoutNotification";
import { AuthProvider } from "@/features/auth/context/AuthProvider";

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

import { useToast } from "@/hooks/use-toast";
import {
  type AuthEventPayload,
  authEvents,
} from "@/shared/api/events/authEvents";
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
        path: "/",
        element: <AppLayout />,
        children: [
          { index: true, element: <HomeRoute /> },
          { path: "attendance", element: <HomeRoute /> },
          { path: "stamp-history", element: <StampHistoryRoute /> },
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
          },
          {
            path: "admin/news",
            element: (
              <ComingSoon
                description="管理画面を順次公開予定です。"
                title="お知らせ管理"
              />
            ),
          },
          {
            path: "admin/logs",
            element: (
              <ComingSoon
                description="ログ管理機能のReact移行を進行中です。"
                title="操作ログ"
              />
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
    <ThemeProvider defaultTheme="system">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        {import.meta.env.DEV ? (
          <ReactQueryDevtools initialIsOpen={false} />
        ) : null}
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
);
