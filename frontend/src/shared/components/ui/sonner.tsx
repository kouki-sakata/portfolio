import { useTheme } from '../../../app/providers/use-theme';

interface SonnerProps {
  theme?: 'light' | 'dark' | 'system';
  className?: string;
}

export const Sonner = ({ theme, className }: SonnerProps) => {
  const { theme: currentTheme } = useTheme();
  const resolvedTheme = theme ?? currentTheme;

  return (
    <div 
      className={className}
      data-theme={resolvedTheme}
      data-testid="sonner-container"
    >
      {/* Toast container would go here */}
    </div>
  );
};