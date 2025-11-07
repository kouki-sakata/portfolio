import { CheckCircle } from "lucide-react";

type ActionLogProps = {
  message: string;
};

export const ActionLog = ({ message }: ActionLogProps) => {
  if (!message) {
    return null;
  }

  return (
    <output
      aria-live="polite"
      className="fade-in flex animate-in items-center justify-end gap-1 text-right text-muted-foreground text-xs duration-300"
    >
      <CheckCircle aria-hidden="true" className="h-3 w-3 text-green-600" />
      <span>最新の操作:{message}</span>
    </output>
  );
};
