interface DateSeparatorProps {
  label: string  // e.g. "HOY", "AYER", "12 JUN 2025"
}

export function DateSeparator({ label }: DateSeparatorProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 select-none">
      <div className="flex-1 h-px bg-border-subtle" />
      <span className="font-mono text-2xs text-text-muted uppercase tracking-[0.12em] tabular-nums">
        {label}
      </span>
      <div className="flex-1 h-px bg-border-subtle" />
    </div>
  )
}
