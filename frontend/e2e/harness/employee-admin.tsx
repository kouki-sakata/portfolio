import "@/styles/global.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "@/components/ui/toaster";
import { EmployeeListPage } from "@/features/employees/components/EmployeeListPage";
import { FeatureFlagProvider } from "@/shared/contexts/FeatureFlagContext";

const queryClient = new QueryClient();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <FeatureFlagProvider>
      <QueryClientProvider client={queryClient}>
        <main className="min-h-screen bg-background p-6">
          <EmployeeListPage />
          <Toaster />
        </main>
      </QueryClientProvider>
    </FeatureFlagProvider>
  </React.StrictMode>
);
