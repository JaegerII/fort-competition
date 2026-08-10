"use client";

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm transition-colors ${
        active
          ? "border-accent bg-accent-dim text-accent"
          : "border-border bg-surface text-text-muted hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}
