import { CheckCircle, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

type BulkActionBarProps = {
  selectedCount: number;
  onApprove: () => void;
  onReject: () => void;
  isApproving?: boolean;
};

export const BulkActionBar = ({
  selectedCount,
  onApprove,
  onReject,
  isApproving = false,
}: BulkActionBarProps) => {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between border-b bg-primary/10 px-4 py-3">
      <span className="text-sm">{selectedCount}件を選択中</span>
      <div className="flex gap-2">
        <Button
          className="bg-green-50 text-green-700 hover:bg-green-100"
          disabled={isApproving}
          onClick={onApprove}
          size="sm"
          variant="outline"
        >
          <CheckCircle className="mr-1 h-3 w-3" />
          承認
        </Button>
        <Button
          className="bg-red-50 text-red-700 hover:bg-red-100"
          disabled={isApproving}
          onClick={onReject}
          size="sm"
          variant="outline"
        >
          <XCircle className="mr-1 h-3 w-3" />
          却下
        </Button>
      </div>
    </div>
  );
};
