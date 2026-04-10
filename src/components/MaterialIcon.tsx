/** Google Material Symbols Outlined — família definida em globals.css + link no layout. */
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
        "material-symbols-outlined inline-flex shrink-0 items-center justify-center leading-none",
        filled ? "material-symbols-outlined-filled" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ fontFamily: '"Material Symbols Outlined", sans-serif' }}
      aria-hidden
    >
      {name}
    </span>
  );
}
