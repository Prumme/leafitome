import { buildReminderMessage } from '@/features/notifications/utils/messages'
import { showAppNotification } from '@/features/notifications/utils/permission'
import { shouldSendReminder } from '@/features/notifications/utils/shouldNotify'
import type { NotificationPrefs } from '@/features/notifications/types/notification.types'
import type { HistoryEntry } from '@/features/history/types/history.types'
import {
  computeCompletionStats,
  getOccurrencesForRange,
} from '@/features/history/utils/completion'
import type { Todo } from '@/features/todos/types/todo.types'
import { todayString } from '@/shared/utils/dates'

export function getTodayCompletion(
  todos: Todo[],
  entries: HistoryEntry[],
  reference = new Date(),
) {
  const active = todos.filter((todo) => !todo.archived && todo.enabled)
  const occurrences = getOccurrencesForRange(active, entries, reference, reference)
  return computeCompletionStats(occurrences)
}

export interface RunReminderOptions {
  prefs: NotificationPrefs
  todos: Todo[]
  entries: HistoryEntry[]
  permissionGranted: boolean
  force?: boolean
  onSent?: (date: string) => void
}

export async function runDailyReminder(options: RunReminderOptions): Promise<boolean> {
  const { prefs, todos, entries, permissionGranted, force, onSent } = options
  const reference = new Date()
  const { completionRate, total } = getTodayCompletion(todos, entries, reference)

  if (
    !shouldSendReminder({
      prefs,
      permissionGranted,
      completionRate,
      total,
      reference,
      force,
    })
  ) {
    return false
  }

  const message = buildReminderMessage(completionRate, total)
  const ok = await showAppNotification(message.title, message.body)
  if (ok && !force) {
    onSent?.(todayString())
  }
  return ok
}
