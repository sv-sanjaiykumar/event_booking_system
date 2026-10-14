import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="not-found">
      <p className="eyebrow">WRONG TURN</p>
      <h1>This page isn’t on the lineup.</h1>
      <Link className="button button--dark" to="/events">Back to events</Link>
    </main>
  );
}
