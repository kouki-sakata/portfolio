import { Button } from "@/components/ui/button";

type BulkActionBarProps = {
  selectedIds: number[];
  onApproveSelected: () => void;
  onRejectSelected: () => void;
  onClearSelection: () => void;
  isProcessing?: boolean;
};

export const BulkActionBar = ({
  selectedIds,
  onApproveSelected,
  onRejectSelected,
  onClearSelection,
  isProcessing = false,
}: BulkActionBarProps) => {
  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <div
      className="-translate-x-1/2 fixed bottom-6 left-1/2 z-20 w-full max-w-4xl rounded-full border bg-card/95 px-6 py-3 shadow-xl backdrop-blur"
      data-testid="bulk-bar"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-medium text-sm">
          {selectedIds.length}
          件選択中
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={onClearSelection} type="button" variant="ghost">
            選択をクリア
          </Button>
          <Button
            disabled={isProcessing}
            onClick={onRejectSelected}
            type="button"
            variant="destructive"
          >
            却下
          </Button>
          <Button
            disabled={isProcessing}
            onClick={onApproveSelected}
            type="button"
          >
            承認
          </Button>
        </div>
      </div>
    </div>
  );
};
