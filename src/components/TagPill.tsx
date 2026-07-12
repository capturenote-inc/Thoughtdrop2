export function TagPill({
  tag,
  unmatched = false,
  className = "",
}: {
  tag: string;
  unmatched?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-amber-tint font-mono text-amber-ink ${
        unmatched ? "border border-dashed border-amber-dashed" : ""
      } ${className}`}
    >
      #{tag}
    </span>
  );
}
