interface ComingSoonProps {
  title: string
  description?: string
}

export const ComingSoon = ({ title, description }: ComingSoonProps) => (
  <section className="not-found" aria-live="polite">
    <h1 className="not-found__title">{title}</h1>
    <p className="not-found__description">{description ?? 'この画面は順次アップデート予定です。'}</p>
  </section>
)
