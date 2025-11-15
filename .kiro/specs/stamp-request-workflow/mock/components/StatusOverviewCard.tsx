import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Clock, CheckCircle, XCircle, FileText, AlertCircle } from "lucide-react";

interface StatusData {
  new: number;
  pending: number;
  approved: number;
  rejected: number;
  canceled: number;
  lastUpdate: string;
}

interface StatusOverviewCardProps {
  title: string;
  data: StatusData;
  onStatusClick: (status: string) => void;
}

export function StatusOverviewCard({ title, data, onStatusClick }: StatusOverviewCardProps) {
  const statusItems = [
    { label: "新規", value: data.new, color: "bg-blue-500", icon: FileText, key: "new" },
    { label: "保留中", value: data.pending, color: "bg-yellow-500", icon: Clock, key: "pending" },
    { label: "承認済", value: data.approved, color: "bg-green-500", icon: CheckCircle, key: "approved" },
    { label: "却下", value: data.rejected, color: "bg-red-500", icon: XCircle, key: "rejected" },
    { label: "キャンセル", value: data.canceled, color: "bg-gray-500", icon: AlertCircle, key: "canceled" },
  ];

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {statusItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => onStatusClick(item.key)}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors text-left"
              >
                <div className={`${item.color} p-2 rounded-lg`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-gray-600 text-sm">{item.label}</div>
                  <div className="text-2xl">{item.value}</div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="pt-2 border-t text-sm text-gray-500">
          最終更新: {data.lastUpdate}
        </div>
      </CardContent>
    </Card>
  );
}
