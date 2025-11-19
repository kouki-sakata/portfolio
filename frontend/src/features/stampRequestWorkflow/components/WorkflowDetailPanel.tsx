import {
  Ban,
  Calendar,
  CheckCircle,
  Edit,
  MessageSquare,
  User,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  extractTimeFromISO,
  formatSubmittedAt,
} from "@/features/stampHistory/lib/dateUtils";
import { RequestStatusBadge } from "@/features/stampRequestWorkflow/components/RequestStatusBadge";
import type { StampRequestListItem } from "@/features/stampRequestWorkflow/types";

type WorkflowDetailPanelProps = {
  request: StampRequestListItem | null;
  role: "employee" | "admin";
  onApprove?: () => void;
  onReject?: () => void;
  onCancel?: (id: number) => void;
  onEdit?: () => void;
};

export const WorkflowDetailPanel = ({
  request,
  role,
  onApprove,
  onReject,
  onCancel,
  onEdit,
}: WorkflowDetailPanelProps) => {
  if (!request) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="mb-2 text-lg">申請を選択してください</p>
          <p className="text-gray-500 text-sm">
            ↑↓キーで移動、Enterキーで選択できます
          </p>
        </div>
      </div>
    );
  }

  const isAdmin = role === "admin";
  const isPending = request.status === "PENDING" || request.status === "NEW";
  const isRejected = request.status === "REJECTED";
  const isApproved = request.status === "APPROVED";

  return (
    <ScrollArea className="h-full">
      <div className="fade-in slide-in-from-right-5 mx-auto max-w-3xl animate-in p-8 duration-300">
        {/* ヘッダー */}
        <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <h2 className="text-2xl">申請詳細</h2>
                <RequestStatusBadge status={request.status} />
              </div>
              <p className="text-gray-600">申請ID: R{request.id}</p>
            </div>
            {request.unread && (
              <Badge className="animate-pulse" variant="destructive">
                未読
              </Badge>
            )}
          </div>

          {/* 管理者ビュー: 申請者情報 */}
          {isAdmin && request.employeeName && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-gray-50 p-3">
              <User className="h-4 w-4 text-gray-600" />
              <span>申請者: {request.employeeName}</span>
            </div>
          )}

          {/* 基本情報 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-1 text-gray-600 text-sm">対象日</div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{request.dateLabel}</span>
              </div>
            </div>
            <div>
              <div className="mb-1 text-gray-600 text-sm">修正種別</div>
              <div>打刻修正</div>
            </div>
            <div>
              <div className="mb-1 text-gray-600 text-sm">勤務時間</div>
              <div>
                {extractTimeFromISO(request.requestedInTime) || "--"} 〜{" "}
                {extractTimeFromISO(request.requestedOutTime) || "--"}
              </div>
            </div>
            <div>
              <div className="mb-1 text-gray-600 text-sm">提出日時</div>
              <div className="text-sm">{formatSubmittedAt(request.createdAt)}</div>
            </div>
          </div>
        </div>

        {/* 申請理由 */}
        <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-gray-600" />
            <h3>申請理由</h3>
          </div>
          <p className="text-gray-700 leading-relaxed">{request.reason}</p>
        </div>

        {/* 却下理由（却下の場合のみ） */}
        {isRejected && request.rejectionReason && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <h3 className="text-red-900">却下理由</h3>
            </div>
            <p className="text-red-800 leading-relaxed">
              {request.rejectionReason}
            </p>
          </div>
        )}

        {/* アクションボタン */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4">アクション</h3>
          <div className="space-y-3">
            {isAdmin ? (
              // 管理者ビュー
              <>
                {isPending && (
                  <>
                    <Button
                      className="w-full justify-start bg-green-600 hover:bg-green-700"
                      onClick={onApprove}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      承認する
                    </Button>
                    <Button
                      className="w-full justify-start border-red-200 text-red-600 hover:text-red-700"
                      onClick={onReject}
                      variant="outline"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      却下する
                    </Button>
                  </>
                )}
                {isApproved && (
                  <p className="rounded-lg bg-green-50 p-4 text-gray-600 text-sm">
                    ✓ この申請は承認済みです
                  </p>
                )}
                {isRejected && (
                  <p className="rounded-lg bg-red-50 p-4 text-gray-600 text-sm">
                    ✗ この申請は却下済みです
                  </p>
                )}
              </>
            ) : (
              // 従業員ビュー
              <>
                {request.status === "PENDING" && (
                  <>
                    <Button
                      className="w-full justify-start"
                      onClick={onEdit}
                      variant="outline"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      申請を編集する
                    </Button>
                    <Button
                      className="w-full justify-start border-red-200 text-red-600 hover:text-red-700"
                      onClick={() => onCancel?.(request.id)}
                      variant="outline"
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      申請をキャンセルする
                    </Button>
                  </>
                )}
                {isRejected && (
                  <Button className="w-full justify-start" onClick={onEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    修正して再申請する
                  </Button>
                )}
                {isApproved && (
                  <p className="rounded-lg bg-green-50 p-4 text-gray-600 text-sm">
                    ✓ この申請は承認済みです
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};
