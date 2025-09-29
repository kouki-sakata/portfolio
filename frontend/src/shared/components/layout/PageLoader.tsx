type PageLoaderProps = {
  label?: string;
};

export const PageLoader = ({ label = "読み込み中…" }: PageLoaderProps) => (
  <div aria-live="polite" className="page-loader" role="status">
    <span aria-hidden="true" className="page-loader__spinner" />
    <span className="page-loader__label">{label}</span>
  </div>
);
