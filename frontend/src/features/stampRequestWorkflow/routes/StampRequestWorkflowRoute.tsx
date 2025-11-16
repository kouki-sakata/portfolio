import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { MyRequestsPage } from "@/features/stampRequestWorkflow/components/MyRequestsPage";
import { PendingRequestsAdminPage } from "@/features/stampRequestWorkflow/components/PendingRequestsAdminPage";

/**
 * Unified Stamp Request Workflow Route (Dual-role Workspace)
 *
 * This component provides a unified workspace for both employees and administrators:
 * - Employees: View and manage their own stamp correction requests
 * - Administrators: Review and approve/reject pending requests from all employees
 *
 * URL: /stamp-requests?view=employee|admin
 * - Default view: employee (for all users)
 * - Admin view: only accessible to administrators
 */
export const StampRequestWorkflowRoute = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAdmin = user?.admin ?? false;

  // Get view from URL params or default to 'employee'
  const viewParam = searchParams.get("view");
  const [currentView, setCurrentView] = useState<"employee" | "admin">(
    viewParam === "admin" && isAdmin ? "admin" : "employee"
  );

  // Sync URL params with internal state
  useEffect(() => {
    const newView = viewParam === "admin" && isAdmin ? "admin" : "employee";
    if (newView !== currentView) {
      setCurrentView(newView);
    }
  }, [viewParam, isAdmin, currentView]);

  // Handle view switching
  const handleViewChange = (view: "employee" | "admin") => {
    // Only allow admin view if user is admin
    if (view === "admin" && !isAdmin) {
      return;
    }

    setCurrentView(view);
    setSearchParams({ view });
  };

  // Render appropriate page based on current view
  if (currentView === "admin" && isAdmin) {
    return (
      <PendingRequestsAdminPage
        onViewChange={handleViewChange}
        currentView="admin"
      />
    );
  }

  return (
    <MyRequestsPage
      onViewChange={isAdmin ? handleViewChange : undefined}
      currentView="employee"
      showViewSwitcher={isAdmin}
    />
  );
};
