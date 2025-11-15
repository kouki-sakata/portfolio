import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { AlertCircle, Clock, CheckSquare } from "lucide-react";

interface AdminReviewCardProps {
  pendingCount: number;
  averageProcessingTime: string;
  onBulkProcess: () => void;
  onViewQueue: () => void;
}

export function AdminReviewCard({
  pendingCount,
  averageProcessingTime,
  onBulkProcess,
  onViewQueue,
}: AdminReviewCardProps) {
  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          管理者レビュー
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
          <div>
            <div className="text-sm text-gray-600">未処理件数</div>
            <div className="text-3xl text-orange-600">{pendingCount}</div>
          </div>
          <Badge variant="destructive" className="text-lg px-4 py-2">
            要対応
          </Badge>
        </div>
        
        <div className="p-4 bg-white rounded-lg border">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
            <Clock className="h-4 w-4" />
            平均処理時間
          </div>
          <div className="text-xl">{averageProcessingTime}</div>
        </div>

        <div className="space-y-2">
          <Button onClick={onBulkProcess} className="w-full" variant="default">
            <CheckSquare className="h-4 w-4 mr-2" />
            バルク処理を開始
          </Button>
          <Button onClick={onViewQueue} className="w-full" variant="outline">
            承認キューを表示
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
