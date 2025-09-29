type ComingSoonProps = {
  title: string;
  description?: string;
};

export const ComingSoon = ({ title, description }: ComingSoonProps) => (
  <section aria-live="polite" className="not-found">
    <h1 className="not-found__title">{title}</h1>
    <p className="not-found__description">
      {description ?? "この画面は順次アップデート予定です。"}
    </p>
  </section>
);
