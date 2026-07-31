import { create } from 'zustand'
import type { PeriodFilter } from '@/shared/types/common.types'

interface PeriodState {
  period: PeriodFilter
  setPeriod: (period: PeriodFilter) => void
}

/** Filtre Aujourd'hui / Semaine / Mois partagé entre Tâches et Dashboard. */
export const usePeriodStore = create<PeriodState>((set) => ({
  period: 'today',
  setPeriod: (period) => set({ period }),
}))
