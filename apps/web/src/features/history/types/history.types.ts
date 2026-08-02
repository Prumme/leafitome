export const HISTORY_STATUS_VALUES = ['DONE', 'MISSED'] as const
export type HistoryStatus = (typeof HISTORY_STATUS_VALUES)[number]

export interface HistoryEntry {
  id: string
  todoId: string
  /** YYYY-MM-DD */
  date: string
  status: HistoryStatus
  createdAt: string
  completedBy?: string
  completedByName?: string
}

export type CreateHistoryInput = Omit<HistoryEntry, 'id' | 'createdAt'>

export type UpdateHistoryInput = Partial<Pick<HistoryEntry, 'status'>>
