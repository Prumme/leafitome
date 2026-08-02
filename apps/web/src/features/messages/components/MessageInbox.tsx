import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { useMessageStore } from '@/features/messages/store/messageStore'
import { cn } from '@/shared/utils/cn'

function formatRelative(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MessageInbox() {
  const messages = useMessageStore((state) => state.messages)
  const unreadCount = useMessageStore((state) => state.unreadCount)
  const load = useMessageStore((state) => state.load)
  const markAllRead = useMessageStore((state) => state.markAllRead)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void load().catch(() => undefined)
    const id = window.setInterval(() => {
      void load().catch(() => undefined)
    }, 60_000)
    return () => window.clearInterval(id)
  }, [load])

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  async function toggle() {
    const next = !open
    setOpen(next)
    if (next) {
      await load().catch(() => undefined)
      if (useMessageStore.getState().unreadCount > 0) {
        await markAllRead().catch(() => undefined)
      }
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => void toggle()}
        className={cn(
          'relative inline-flex items-center justify-center rounded-lg p-2 text-forest-700 transition-colors hover:bg-forest-100',
          open && 'bg-forest-100 text-forest-900',
        )}
        aria-label="Messages"
        title="Messages"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-missed-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute top-full right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-forest-200 bg-surface-elevated shadow-soft">
          <div className="border-b border-forest-100 px-3 py-2">
            <p className="text-sm font-semibold text-forest-900">Messages</p>
            <p className="text-xs text-ink-muted">Invitations et activité des todos partagées</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-ink-muted">Aucun message pour l’instant.</p>
            ) : (
              <ul>
                {messages.map((message) => (
                  <li
                    key={message.id}
                    className={cn(
                      'border-b border-forest-50 px-3 py-2.5 last:border-b-0',
                      !message.readAt && 'bg-forest-50/80',
                    )}
                  >
                    <p className="text-sm font-medium text-forest-900">{message.title}</p>
                    <p className="mt-0.5 text-sm text-forest-800">{message.body}</p>
                    <p className="mt-1 text-xs text-ink-muted">{formatRelative(message.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
