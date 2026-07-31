import { useMemo } from 'react'
import { Plus } from 'lucide-react'
import { OccurrenceCard } from '@/features/todos/components/OccurrenceCard'
import { TodoForm } from '@/features/todos/components/TodoForm'
import { usePinnedOccurrences, occurrenceKey } from '@/features/todos/hooks/usePinnedOccurrences'
import { useScheduledOccurrences } from '@/features/todos/hooks/useScheduledOccurrences'
import { useTodoStore } from '@/features/todos/store/todoStore'
import type { CreateTodoInput } from '@/features/todos/types/todo.types'
import { Button } from '@/shared/components/Button'
import { EmptyState } from '@/shared/components/EmptyState'
import { Modal } from '@/shared/components/Modal'
import { PageHeader } from '@/shared/components/PageHeader'
import { Tabs } from '@/shared/components/Tabs'
import { useDisclosure } from '@/shared/hooks/useDisclosure'
import { usePeriodStore } from '@/shared/store/periodStore'
import type { PeriodFilter } from '@/shared/types/common.types'
import { formatDisplayDate, formatShortDate } from '@/shared/utils/dates'

const periodOptions: Array<{ value: PeriodFilter; label: string }> = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Mois' },
]

export function TodayPage() {
  const period = usePeriodStore((state) => state.period)
  const setPeriod = usePeriodStore((state) => state.setPeriod)
  const { occurrences, loaded } = useScheduledOccurrences(period)
  const { displayed, pin, unpin } = usePinnedOccurrences(occurrences)
  const createTodo = useTodoStore((state) => state.createTodo)
  const modal = useDisclosure()

  const grouped = useMemo(() => {
    const map = new Map<string, typeof displayed>()
    for (const occurrence of displayed) {
      const list = map.get(occurrence.date) ?? []
      list.push(occurrence)
      map.set(occurrence.date, list)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [displayed])

  const pendingCount = occurrences.filter(
    (item) => item.status === 'PENDING' || item.status === 'MISSED',
  ).length

  async function handleCreate(data: CreateTodoInput) {
    await createTodo(data)
    modal.close()
  }

  if (!loaded) {
    return <p className="text-ink-muted">Chargement des tâches…</p>
  }

  return (
    <div>
      <PageHeader
        title="Mes tâches"
        subtitle={`${formatDisplayDate(new Date())} · ${pendingCount} à traiter`}
        actions={
          <>
            <Tabs options={periodOptions} value={period} onChange={setPeriod} />
            <Button onClick={modal.open}>
              <Plus className="h-4 w-4" />
              Nouvelle
            </Button>
          </>
        }
      />

      {displayed.length === 0 ? (
        <EmptyState
          title="Aucune tâche sur cette période"
          description="Crée une récurrence ou change de période pour voir tes prochaines feuilles pousser."
          action={
            <Button onClick={modal.open}>
              <Plus className="h-4 w-4" />
              Ajouter une todo
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, items]) => (
            <section key={date} className="space-y-2">
              {period !== 'today' ? (
                <h2 className="text-sm font-semibold tracking-wide text-forest-700 uppercase">
                  {formatShortDate(date)}
                </h2>
              ) : null}
              <div className="space-y-2">
                {items.map((occurrence) => (
                  <OccurrenceCard
                    key={occurrenceKey(occurrence)}
                    occurrence={occurrence}
                    onWillLeave={pin}
                    onDidLeave={unpin}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Modal open={modal.isOpen} title="Nouvelle todo" onClose={modal.close}>
        <TodoForm
          onSubmit={(data) => handleCreate(data as CreateTodoInput)}
          onCancel={modal.close}
          submitLabel="Créer"
        />
      </Modal>
    </div>
  )
}
