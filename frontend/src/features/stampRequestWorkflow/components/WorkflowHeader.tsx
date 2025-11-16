import { Keyboard, Plus, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type WorkflowHeaderProps = {
  role: "employee" | "admin";
  userName?: string;
  showViewSwitcher?: boolean;
  onViewChange?: (view: "employee" | "admin") => void;
  onCommandClick?: () => void;
  onNewRequestClick?: () => void;
};

export const WorkflowHeader = ({
  role,
  userName,
  showViewSwitcher = false,
  onViewChange,
  onCommandClick,
  onNewRequestClick,
}: WorkflowHeaderProps) => {
  return (
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
          <div className="flex items-center gap-3">
            <Button
              className="gap-2"
              onClick={onCommandClick}
              size="sm"
              variant="outline"
            >
              <Keyboard className="h-4 w-4" />
              <span className="hidden sm:inline">コマンド</span>
              <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
            <Button onClick={onNewRequestClick}>
              <Plus className="mr-2 h-4 w-4" />
              新規申請
            </Button>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-600" />
              <span className="text-sm">{userName || "ゲスト"}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
