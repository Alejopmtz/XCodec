export function MessageSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-2 animate-pulse">
      {/* Avatar */}
      <div className="h-7 w-7 shrink-0 rounded-full bg-raised" />

      <div className="flex-1 space-y-1.5 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="h-3 w-20 rounded bg-raised" />
          <div className="h-3 w-10 rounded bg-raised" />
        </div>
        {/* Líneas de contenido */}
        <div className="h-3 w-3/4 rounded bg-raised" />
        <div className="h-3 w-1/2 rounded bg-raised" />
      </div>
    </div>
  )
}

export function MessageSkeletonList({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }, (_, i) => (
        <MessageSkeleton key={i} />
      ))}
    </div>
  )
}
