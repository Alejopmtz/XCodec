'use client'

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  Fragment,
  type RefObject,
} from 'react'
import { Loader2, ChevronDown } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import { useMessages } from '@/hooks/useMessages'
import { toDateKeyInBogota, formatDateLabelInBogota } from '@/lib/timezone'
import { MessageItem } from './MessageItem'
import { DateSeparator } from './DateSeparator'
import { MessageSkeletonList } from './MessageSkeleton'
import type { MessageWithSender } from '@/types/chat'

interface MessageListProps {
  currentUserId: string
  isAdmin: boolean
  isInitialLoading: boolean
}

// ── Helpers ───────────────────────────────────────────────────
// toDateKeyInBogota e formatDateLabelInBogota importados de @/lib/timezone.
// Reemplazan las versiones locales que usaban la zona horaria del servidor/browser.

function groupByDate(msgs: MessageWithSender[]) {
  const map = new Map<string, MessageWithSender[]>()
  for (const msg of msgs) {
    const key = toDateKeyInBogota(msg.created_at)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(msg)
  }
  return Array.from(map.entries()).map(([date, messages]) => ({ date, messages }))
}

// Hook: detecta si el contenedor está cerca del fondo
function useAtBottom(ref: RefObject<HTMLDivElement | null>): boolean {
  const [atBottom, setAtBottom] = useState(true)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    function check() {
      if (!el) return
      setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80)
    }
    el.addEventListener('scroll', check, { passive: true })
    return () => el.removeEventListener('scroll', check)
  }, [ref])

  return atBottom
}

// ── Componente ────────────────────────────────────────────────

export function MessageList({
  currentUserId,
  isAdmin,
  isInitialLoading,
}: MessageListProps) {
  const messages = useChatStore((s) => s.messages)
  const { loadMore, isLoadingMore, hasMore } = useMessages()

  const bottomRef           = useRef<HTMLDivElement>(null)
  const topRef              = useRef<HTMLDivElement>(null)
  const containerRef        = useRef<HTMLDivElement>(null)
  const prevScrollHeightRef = useRef(0)
  const prevLenRef          = useRef(messages.length)

  const atBottom = useAtBottom(containerRef)

  // ── Auto-scroll al nuevo mensaje (solo si está al fondo) ───
  useEffect(() => {
    const added = messages.length - prevLenRef.current
    prevLenRef.current = messages.length
    if (added > 0 && atBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, atBottom])

  // ── Intersection Observer: sentinel arriba → cargar más ───
  useEffect(() => {
    const sentinel = topRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasMore && !isLoadingMore) {
          prevScrollHeightRef.current = containerRef.current?.scrollHeight ?? 0
          loadMore()
        }
      },
      { root: containerRef.current, threshold: 0 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, loadMore])

  // ── Restaurar posición de scroll tras cargar historial ─────
  useEffect(() => {
    if (!isLoadingMore && prevScrollHeightRef.current) {
      const el = containerRef.current
      if (el) {
        el.scrollTop += el.scrollHeight - prevScrollHeightRef.current
      }
      prevScrollHeightRef.current = 0
    }
  }, [isLoadingMore])

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const grouped = groupByDate(messages)

  return (
    <div className="relative flex-1 min-h-0">

      {/* ── Lista ─────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto"
        style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#30363d transparent',
            // Previene que el scroll propague al body en iOS/Android:
            // evita pull-to-refresh accidental y el bounce de página.
            overscrollBehavior: 'contain',
          }}
      >
        {/* Sentinel para paginación hacia arriba */}
        <div ref={topRef} className="h-1" />

        {isLoadingMore && (
          <div className="flex justify-center py-3">
            <Loader2 size={14} className="animate-spin text-text-muted" />
          </div>
        )}

        {/* Estado vacío */}
        {!isInitialLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 px-8 py-16 text-center">
            <p className="font-mono text-sm text-text-muted">
              Canal vacío
            </p>
            <p className="font-mono text-xs text-text-muted opacity-50">
              Sé el primero en escribir algo.
            </p>
          </div>
        )}

        {/* Esqueletos */}
        {isInitialLoading && (
          <div className="pt-4">
            <MessageSkeletonList count={8} />
          </div>
        )}

        {/* Mensajes agrupados por día */}
        {!isInitialLoading && (
          <div className="py-2">
            {grouped.map(({ date, messages: dayMsgs }) => (
              <Fragment key={date}>
                <DateSeparator label={formatDateLabelInBogota(date)} />
                {dayMsgs.map((msg) => (
                  <MessageItem
                    key={msg.id}
                    message={msg}
                    isOwn={msg.sender_id === currentUserId}
                    isAdmin={isAdmin}
                  />
                ))}
              </Fragment>
            ))}
          </div>
        )}

        {/* Ancla para scroll al fondo */}
        <div ref={bottomRef} className="h-2" />
      </div>

      {/* ── Botón "ir al fondo" ───────────────────────────────── */}
      {!atBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-overlay shadow-elevation-2 text-text-secondary hover:text-text transition-colors duration-100"
          title="Ir al fondo"
        >
          <ChevronDown size={14} />
        </button>
      )}

    </div>
  )
}
