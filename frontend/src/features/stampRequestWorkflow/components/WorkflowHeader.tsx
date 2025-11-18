import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type WorkflowHeaderProps = {
  role: "employee" | "admin";
  userName?: string;
  showViewSwitcher?: boolean;
  onViewChange?: (view: "employee" | "admin") => void;
  onNewRequestClick?: () => void;
};

export const WorkflowHeader = ({
  role,
  showViewSwitcher = false,
  onViewChange,
  onNewRequestClick,
}: WorkflowHeaderProps) => (
  <header className="flex-shrink-0 border-b bg-white">
    <div className="px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl">勤怠ワークフロー</h1>
          {showViewSwitcher && onViewChange ? (
            <>
              <Separator className="h-8" orientation="vertical" />
              <Button
                onClick={() => onViewChange("employee")}
                size="sm"
                variant={role === "employee" ? "default" : "ghost"}
              >
                従業員
              </Button>
              <Button
                onClick={() => onViewChange("admin")}
                size="sm"
                variant={role === "admin" ? "default" : "ghost"}
              >
                管理者
              </Button>
            </>
          ) : null}
        </div>
        <div className="flex items-center">
          <Button onClick={onNewRequestClick}>
            <Plus className="mr-2 h-4 w-4" />
            新規申請
          </Button>
        </div>
      </div>
    </div>
  </header>
);
