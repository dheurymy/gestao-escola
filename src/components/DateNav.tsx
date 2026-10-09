export default function DateNav({
  label,
  onPrev,
  onNext,
  children,
}: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="datenav">
      <button className="btn icon" onClick={onPrev} aria-label="Anterior">
        ‹
      </button>
      <div className="datenav-label">
        <div>{label}</div>
        {children}
      </div>
      <button className="btn icon" onClick={onNext} aria-label="Próximo">
        ›
      </button>
    </div>
  );
}
