import { Coffee, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

type BreakToggleButtonProps = {
  isBreak: boolean;
  isToggling: boolean;
  isLoading: boolean;
  onToggle: () => void;
};

export const BreakToggleButton = ({
  isBreak,
  isToggling,
  isLoading,
  onToggle,
}: BreakToggleButtonProps) => (
  <div className="mt-2">
    <p className="mb-2 text-muted-foreground text-xs">休憩の操作</p>
    <Button
      aria-label={isBreak ? "休憩を終了して業務を再開" : "休憩を開始"}
      className="w-full gap-1 rounded-full py-4 shadow-sm transition-all duration-200 hover:shadow-md"
      disabled={isToggling || isLoading}
      onClick={onToggle}
      type="button"
      variant={isBreak ? "default" : "outline"}
    >
      {isBreak ? (
        <>
          <Sun aria-hidden="true" className="h-4 w-4" /> 休憩終了(業務再開)
        </>
      ) : (
        <>
          <Coffee aria-hidden="true" className="h-4 w-4" /> 休憩開始
        </>
      )}
    </Button>
  </div>
);
