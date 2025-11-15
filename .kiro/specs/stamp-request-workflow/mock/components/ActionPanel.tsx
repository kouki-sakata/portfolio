import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Plus,
  FileText,
  Ban,
  List,
  CheckSquare,
  BookOpen,
  Shield,
} from "lucide-react";

interface ActionPanelProps {
  role: "employee" | "admin";
  onAction: (action: string) => void;
}

export function ActionPanel({ role, onAction }: ActionPanelProps) {
  const employeeActions = [
    {
      id: "new-request",
      label: "修正申請を開始する",
      icon: Plus,
      variant: "default" as const,
      description: "新しい勤怠修正申請を作成",
    },
    {
      id: "my-requests",
      label: "My Requestsを開く",
      icon: FileText,
      variant: "outline" as const,
      description: "自分の申請履歴を確認",
    },
    {
      id: "cancel-pending",
      label: "Pendingをキャンセル",
      icon: Ban,
      variant: "outline" as const,
      description: "保留中の申請を取り消し",
    },
  ];

  const adminActions = [
    {
      id: "pending-list",
      label: "保留一覧",
      icon: List,
      variant: "default" as const,
      description: "未処理の申請を確認",
    },
    {
      id: "approval-queue",
      label: "承認キュー",
      icon: CheckSquare,
      variant: "default" as const,
      description: "承認待ちの申請を処理",
    },
    {
      id: "bulk-guide",
      label: "バルク処理ガイド",
      icon: BookOpen,
      variant: "outline" as const,
      description: "一括処理の方法を確認",
    },
    {
      id: "audit-log",
      label: "監査ログビュー",
      icon: Shield,
      variant: "outline" as const,
      description: "システム履歴を閲覧",
    },
  ];

  const actions = role === "admin" ? adminActions : employeeActions;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {role === "admin" ? "管理者アクション" : "クイックアクション"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onAction(action.id)}
              className="w-full p-4 rounded-lg border-2 hover:border-primary hover:bg-gray-50 transition-all text-left group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 group-hover:text-primary transition-colors">
                    {action.label}
                  </div>
                  <div className="text-sm text-gray-600">{action.description}</div>
                </div>
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
