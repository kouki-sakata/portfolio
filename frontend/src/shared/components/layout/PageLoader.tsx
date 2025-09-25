export const PageLoader = () => (
  <div className="page-loader" role="status" aria-live="polite">
    <span className="page-loader__spinner" aria-hidden="true" />
    <span className="page-loader__label">読み込み中...</span>
  </div>
)
