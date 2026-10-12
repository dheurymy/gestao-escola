import Icon from "./Icon";

/** Título do período com setas de anterior/próximo; `children` entra ao lado dos botões. */
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
    <div className="period-nav">
      <h2 className="h2">{label}</h2>
      {children}
      <div className="btns">
        <button className="btn icon sm" onClick={onPrev} aria-label="Período anterior">
          <Icon name="prev" size={18} />
        </button>
        <button className="btn icon sm" onClick={onNext} aria-label="Próximo período">
          <Icon name="next" size={18} />
        </button>
      </div>
    </div>
  );
}
