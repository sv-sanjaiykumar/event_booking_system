export default function BrandMark({ compact = false }) {
  return (
    <a className={`brand${compact ? " brand--compact" : ""}`} href="#top">
      <span className="brand__symbol" aria-hidden="true">
        g
      </span>
      <span className="brand__name">gather<span>.</span></span>
    </a>
  );
}
