import { useTheme } from "../../../app/providers/use-theme";

type SonnerProps = {
  theme?: "light" | "dark" | "system";
  className?: string;
};

export const Sonner = ({ theme, className }: SonnerProps) => {
  const { theme: currentTheme } = useTheme();
  const resolvedTheme = theme ?? currentTheme;

  return (
    <div
      className={className}
      data-testid="sonner-container"
      data-theme={resolvedTheme}
    >
      {/* Toast container would go here */}
    </div>
  );
};
