/** Google Material Symbols Outlined — carregado no layout. */
export function MaterialIcon({
  name,
  className = "",
  filled = false,
}: {
  name: string;
  className?: string;
  filled?: boolean;
}) {
  return (
    <span
      className={[
        "material-symbols-outlined inline-flex items-center justify-center",
        filled ? "material-symbols-outlined-filled" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden
    >
      {name}
    </span>
  );
}
