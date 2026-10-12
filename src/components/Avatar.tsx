export default function Avatar({ name, photo, size = 48 }: { name: string; photo?: string; size?: number }) {
  const style = { width: size, height: size, fontSize: size * 0.36 };
  if (photo) return <img className="avatar" src={photo} alt="" style={style} />;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
  return (
    <span className="avatar placeholder" style={style} aria-hidden="true">
      {initials || "?"}
    </span>
  );
}
