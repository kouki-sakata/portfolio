import { NavLink } from "react-router-dom";

export const NotFoundRoute = () => (
  <section className="not-found">
    <h1 className="not-found__title">404 - ページが見つかりません</h1>
    <p className="not-found__description">
      指定されたページは存在しないか、移動した可能性があります。
    </p>
    <NavLink className="button" to="/">
      ホームに戻る
    </NavLink>
  </section>
);
