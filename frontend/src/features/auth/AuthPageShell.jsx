import { Link } from "react-router-dom";

import BrandMark from "../../components/BrandMark.jsx";

export default function AuthPageShell({ eyebrow, title, description, children }) {
  return (
    <main className="auth-page">
      <div className="auth-page__top">
        <BrandMark />
        <Link className="topbar__link" to="/">
          Back to discovery <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <section className="auth-card" aria-labelledby="auth-title">
        <p className="eyebrow">{eyebrow}</p>
        <h1 id="auth-title">{title}</h1>
        <p className="auth-card__description">{description}</p>
        {children}
      </section>
      <p className="auth-page__footer">Gather · Make room for something good.</p>
    </main>
  );
}
