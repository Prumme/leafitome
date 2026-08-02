import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Share } from 'lucide-react'
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
import { shareOrCopyInvite } from '@/features/share/utils/shareLink'
import { useHistoryStore } from '@/features/history/store/historyStore'
import { useTodoStore } from '@/features/todos/store/todoStore'
import { apiFetch } from '@/shared/lib/api/client'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { Select } from '@/shared/components/Select'
import { Textarea } from '@/shared/components/Textarea'
import { Toggle } from '@/shared/components/Toggle'
import { ALL_DAYS, DAY_LABELS, getDayOfMonth, todayString } from '@/shared/utils/dates'
import { cn } from '@/shared/utils/cn'

interface TodoFormProps {
  initial?: Todo
  onSubmit: (data: CreateTodoInput | UpdateTodoInput) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

interface MemberRow {
  userId: string
  role: 'OWNER' | 'MEMBER'
  joinedAt: string
  displayName: string | null
  email: string
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
  const isOwner = initial ? initial.isOwner !== false && initial.membershipRole !== 'MEMBER' : true
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [recurrence, setRecurrence] = useState<Recurrence>(initial?.recurrence ?? 'DAILY')
  const [days, setDays] = useState<Day[]>(initial?.days ?? [])
  const [dayOfMonth, setDayOfMonth] = useState(
    initial?.dayOfMonth ?? getDayOfMonth(new Date()),
  )
  const [deadline, setDeadline] = useState(initial?.deadline ?? todayString())
  const [earlyCompletable, setEarlyCompletable] = useState(initial?.earlyCompletable ?? false)
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? 'MEDIUM')
  const [enabled, setEnabled] = useState(initial?.enabled ?? true)
  const [shared, setShared] = useState(initial?.shared ?? false)
  const [color, setColor] = useState(resolveInitialColor(initial?.color))
  const [error, setError] = useState<string | null>(null)
  const [shareHint, setShareHint] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [members, setMembers] = useState<MemberRow[]>([])

  const needsDays = recurrence === 'WEEKLY'
  const needsDayOfMonth = recurrence === 'MONTHLY'
  const needsDeadline = recurrence === 'ONDAY'
  const canBeEarly = recurrence === 'WEEKLY' || recurrence === 'MONTHLY'
  const canSubmit = useMemo(() => name.trim().length > 0, [name])

  useEffect(() => {
    if (!initial?.id || !initial.shared || !isOwner) return
    void apiFetch<{ members: MemberRow[] }>(`/todos/${initial.id}/members`)
      .then((data) => setMembers(data.members))
      .catch(() => setMembers([]))
  }, [initial?.id, initial?.shared, isOwner])

  function toggleDay(day: Day) {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  function handleSharedToggle(next: boolean) {
    if (!next && initial?.shared) {
      const ok = window.confirm(
        'Désactiver le partage ? Les autres membres perdront immédiatement l’accès à cette todo.',
      )
      if (!ok) return
    }
    setShared(next)
  }

  async function handleShareClick() {
    const token = initial?.shareToken
    if (!token) {
      setShareHint('Enregistre d’abord la todo avec le partage activé pour obtenir un lien.')
      return
    }
    try {
      const result = await shareOrCopyInvite(token, initial?.name ?? name)
      setShareHint(result === 'shared' ? 'Invitation envoyée.' : 'Lien copié dans le presse-papiers.')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setShareHint('Impossible de partager le lien.')
    }
  }

  async function removeMember(userId: string) {
    if (!initial?.id) return
    const ok = window.confirm('Retirer ce membre de la todo partagée ?')
    if (!ok) return
    await apiFetch(`/todos/${initial.id}/members/${userId}`, { method: 'DELETE' })
    setMembers((prev) => prev.filter((member) => member.userId !== userId))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!isOwner) {
      setError('Seul le créateur peut modifier cette todo.')
      return
    }
    if (!canSubmit) {
      setError('Le nom est obligatoire.')
      return
    }
    if (needsDays && days.length === 0) {
      setError('Sélectionne au moins un jour.')
      return
    }
    if (needsDeadline && !deadline) {
      setError('Choisis une date d’échéance.')
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
      deadline: needsDeadline ? deadline : null,
      priority,
      enabled,
      shared,
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

  if (initial && !isOwner) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-ink-muted">
          Tu es membre de « {initial.name} ». Seul le créateur peut modifier cette todo.
        </p>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            void (async () => {
              await apiFetch(`/todos/${initial.id}/members/me`, { method: 'DELETE' })
              await useTodoStore.getState().load()
              await useHistoryStore.getState().load()
              onCancel()
            })()
          }}
        >
          Quitter cette todo
        </Button>
        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Fermer
          </Button>
        </div>
      </div>
    )
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
            if (next === 'ONDAY' && !deadline) {
              setDeadline(todayString())
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

      {needsDeadline ? (
        <div className="space-y-1.5">
          <Input
            label="Date d’échéance"
            name="deadline"
            type="date"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
            required
          />
          <p className="text-xs text-ink-muted">
            Faisable chaque jour jusqu’à cette date. Tu pourras changer l’échéance pour la
            relancer.
          </p>
        </div>
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

      <div className="space-y-2 border-t border-forest-100 pt-3">
        <Toggle
          checked={shared}
          onChange={handleSharedToggle}
          label="Partagée"
          id="todo-shared"
        />
        <p className="text-xs text-ink-muted">
          Les membres voient et valident la même occurrence. Hors streak et heatmap.
        </p>
        {initial && (shared || initial.shared) ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => void handleShareClick()}>
              <Share className="h-4 w-4" />
              Partager le lien
            </Button>
            {shareHint ? <span className="text-xs text-ink-muted">{shareHint}</span> : null}
          </div>
        ) : null}
      </div>

      {initial?.shared && members.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-forest-800">Membres</p>
          <ul className="space-y-1.5">
            {members.map((member) => (
              <li
                key={member.userId}
                className="flex items-center justify-between gap-2 rounded-lg bg-forest-50 px-3 py-2 text-sm"
              >
                <span className="truncate text-forest-900">
                  {member.displayName?.trim() || member.email}
                  {member.role === 'OWNER' ? (
                    <span className="ml-1 text-xs text-ink-muted">(créateur)</span>
                  ) : null}
                </span>
                {member.role === 'MEMBER' ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => void removeMember(member.userId)}
                  >
                    Retirer
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

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
