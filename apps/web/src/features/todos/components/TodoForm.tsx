import { useMemo, useState, type FormEvent } from 'react'
import type { Day } from '@/shared/types/common.types'
import {
  PRIORITY_VALUES,
  TODO_COLOR_PALETTE,
  type CreateTodoInput,
  type Priority,
  type Recurrence,
  type Todo,
  type UpdateTodoInput,
} from '@/features/todos/types/todo.types'
import { PRIORITY_LABELS, RECURRENCE_LABELS } from '@/features/todos/utils/recurrence'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'
import { Textarea } from '@/shared/components/Textarea'
import { Toggle } from '@/shared/components/Toggle'
import { ALL_DAYS, DAY_LABELS, getDayOfMonth } from '@/shared/utils/dates'
import { cn } from '@/shared/utils/cn'

interface TodoFormProps {
  initial?: Todo
  onSubmit: (data: CreateTodoInput | UpdateTodoInput) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

const priorityOptions = PRIORITY_VALUES.map((value) => ({
  value,
  label: PRIORITY_LABELS[value],
}))

const recurrenceOptions = (Object.keys(RECURRENCE_LABELS) as Recurrence[]).map((value) => ({
  value,
  label: RECURRENCE_LABELS[value],
}))

function resolveInitialColor(color: string | undefined): string {
  if (color && (TODO_COLOR_PALETTE as readonly string[]).includes(color)) return color
  return TODO_COLOR_PALETTE[1]
}

export function TodoForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = 'Enregistrer',
}: TodoFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [recurrence, setRecurrence] = useState<Recurrence>(initial?.recurrence ?? 'DAILY')
  const [days, setDays] = useState<Day[]>(initial?.days ?? [])
  const [dayOfMonth, setDayOfMonth] = useState(
    initial?.dayOfMonth ?? getDayOfMonth(new Date()),
  )
  const [earlyCompletable, setEarlyCompletable] = useState(initial?.earlyCompletable ?? false)
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? 'MEDIUM')
  const [enabled, setEnabled] = useState(initial?.enabled ?? true)
  const [color, setColor] = useState(resolveInitialColor(initial?.color))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const needsDays = recurrence === 'WEEKLY' || recurrence === 'ONDAY'
  const needsDayOfMonth = recurrence === 'MONTHLY'
  const canBeEarly = recurrence === 'WEEKLY' || recurrence === 'MONTHLY'

  const canSubmit = useMemo(() => name.trim().length > 0, [name])

  function toggleDay(day: Day) {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit) {
      setError('Le nom est obligatoire.')
      return
    }
    if (needsDays && days.length === 0) {
      setError('Sélectionne au moins un jour.')
      return
    }

    setSaving(true)
    setError(null)

    const payload: CreateTodoInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      recurrence,
      days: needsDays ? days : undefined,
      dayOfMonth: needsDayOfMonth ? dayOfMonth : undefined,
      earlyCompletable: canBeEarly ? earlyCompletable : false,
      priority,
      enabled,
      color,
      archived: initial?.archived ?? false,
    }

    try {
      await onSubmit(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
      setSaving(false)
      return
    }
    setSaving(false)
  }

  return (
    <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
      <Input
        label="Nom"
        name="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Arroser les plantes"
        required
      />

      <Textarea
        label="Description"
        name="description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Détails optionnels…"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Récurrence"
          name="recurrence"
          value={recurrence}
          options={recurrenceOptions}
          onChange={(event) => {
            const next = event.target.value as Recurrence
            setRecurrence(next)
            if (next !== 'WEEKLY' && next !== 'MONTHLY') {
              setEarlyCompletable(false)
            }
          }}
        />
        <Select
          label="Priorité"
          name="priority"
          value={priority}
          options={priorityOptions}
          onChange={(event) => setPriority(event.target.value as Priority)}
        />
      </div>

      {needsDays ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-forest-800">Jours</legend>
          <div className="flex flex-wrap gap-1.5">
            {ALL_DAYS.map((day) => {
              const selected = days.includes(day)
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cn(
                    'rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors',
                    selected
                      ? 'border-forest-600 bg-forest-600 text-white'
                      : 'border-forest-200 bg-white text-forest-700 hover:bg-forest-50',
                  )}
                >
                  {DAY_LABELS[day]}
                </button>
              )
            })}
          </div>
        </fieldset>
      ) : null}

      {needsDayOfMonth ? (
        <Input
          label="Jour du mois"
          name="dayOfMonth"
          type="number"
          min={1}
          max={31}
          value={dayOfMonth}
          onChange={(event) => setDayOfMonth(Number(event.target.value))}
        />
      ) : null}

      {canBeEarly ? (
        <Toggle
          checked={earlyCompletable}
          onChange={setEarlyCompletable}
          label="Faisable en avance"
          id="todo-early"
        />
      ) : null}

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-forest-800">Couleur</legend>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
          {TODO_COLOR_PALETTE.map((swatch) => {
            const selected = color === swatch
            return (
              <button
                key={swatch}
                type="button"
                aria-label={`Couleur ${swatch}`}
                aria-pressed={selected}
                onClick={() => setColor(swatch)}
                className={cn(
                  'h-8 w-full rounded-lg border-2 transition-transform',
                  selected
                    ? 'scale-105 border-forest-900 ring-2 ring-forest-300'
                    : 'border-white/80 hover:scale-105',
                )}
                style={{ backgroundColor: swatch }}
              />
            )
          })}
        </div>
      </fieldset>

      <div className="pt-1">
        <Toggle checked={enabled} onChange={setEnabled} label="Activée" id="todo-enabled" />
      </div>

      {error ? <p className="text-sm text-missed-700">{error}</p> : null}

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
          Annuler
        </Button>
        <Button type="submit" disabled={!canSubmit || saving}>
          {saving ? 'Enregistrement…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
