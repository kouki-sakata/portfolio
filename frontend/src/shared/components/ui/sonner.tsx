type SonnerProps = {
  className?: string;
};

export const Sonner = ({ className }: SonnerProps) => {
  return (
    <div className={className} data-testid="sonner-container">
      {/* Toast container would go here */}
    </div>
  );
};
