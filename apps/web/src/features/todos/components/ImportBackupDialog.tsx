import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { FileJson, Leaf, Upload } from 'lucide-react'
import { useBadgeStore } from '@/features/badges/store/badgeStore'
import { useHistoryStore } from '@/features/history/store/historyStore'
import { useTodoStore } from '@/features/todos/store/todoStore'
import { Button } from '@/shared/components/Button'
import { Modal } from '@/shared/components/Modal'
import { readBackupFile, type LeafitomeBackup } from '@/shared/lib/backup/backup'
import { cn } from '@/shared/utils/cn'

interface ImportBackupDialogProps {
  open: boolean
  onClose: () => void
}

export function ImportBackupDialog({ open, onClose }: ImportBackupDialogProps) {
  const replaceTodos = useTodoStore((state) => state.replaceAll)
  const replaceHistory = useHistoryStore((state) => state.replaceAll)
  const replaceBadges = useBadgeStore((state) => state.replaceAll)
  const markTraveled = useBadgeStore((state) => state.markTraveled)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState<LeafitomeBackup | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function resetState() {
    setDragging(false)
    setPreview(null)
    setFileName(null)
    setError(null)
    setBusy(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleClose() {
    if (busy) return
    resetState()
    onClose()
  }

  async function ingestFile(file: File) {
    setError(null)
    setPreview(null)
    setFileName(file.name)
    try {
      const backup = await readBackupFile(file)
      setPreview(backup)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import impossible.')
    }
  }

  function onDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setDragging(true)
  }

  function onDragLeave(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setDragging(false)
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) void ingestFile(file)
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) void ingestFile(file)
  }

  async function handleImport() {
    if (!preview || busy) return
    setBusy(true)
    setError(null)
    try {
      await replaceTodos(preview.todos)
      await replaceHistory(preview.history)
      await replaceBadges({
        ...preview.badges,
        hasTraveled: true,
      })
      await markTraveled()
      resetState()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de l’import.')
      setBusy(false)
    }
  }

  return (
    <Modal open={open} title="Importer une sauvegarde" onClose={handleClose}>
      <div className="space-y-4">
        <p className="text-sm text-ink-muted">
          Dépose un fichier JSON Leafitome. L’import{' '}
          <span className="font-medium text-forest-800">remplace</span> toutes les données
          actuelles de cet appareil.
        </p>

        <label
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={cn(
            'relative flex cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden',
            'rounded-2xl border-2 border-dashed px-4 py-10 text-center transition-colors',
            dragging
              ? 'border-moss-500 bg-moss-50'
              : 'border-forest-300 bg-forest-50/70 hover:border-forest-500 hover:bg-forest-50',
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'radial-gradient(ellipse 70% 50% at 20% 0%, rgb(132 192 101 / 0.35), transparent),' +
                'radial-gradient(ellipse 60% 40% at 90% 100%, rgb(109 165 127 / 0.28), transparent)',
            }}
          />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-600 text-white shadow-soft">
            <Leaf className="h-7 w-7" />
          </div>
          <div className="relative space-y-1">
            <p className="font-semibold text-forest-900">
              {dragging ? 'Lâche la feuille ici…' : 'Glisse ta sauvegarde ici'}
            </p>
            <p className="text-sm text-ink-muted">ou clique pour parcourir un fichier .json</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={onFileChange}
          />
        </label>

        {fileName ? (
          <div className="flex items-start gap-3 rounded-xl border border-forest-200 bg-surface-elevated px-3 py-2.5">
            <FileJson className="mt-0.5 h-5 w-5 shrink-0 text-forest-600" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-forest-900">{fileName}</p>
              {preview ? (
                <p className="text-xs text-ink-muted">
                  {preview.todos.length} todo{preview.todos.length === 1 ? '' : 's'} ·{' '}
                  {preview.history.length} entrée
                  {preview.history.length === 1 ? '' : 's'} d’historique
                  {preview.exportedAt
                    ? ` · exportée le ${preview.exportedAt.slice(0, 10)}`
                    : ''}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="rounded-lg bg-missed-50 px-3 py-2 text-sm text-missed-800" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={handleClose} disabled={busy}>
            Annuler
          </Button>
          <Button onClick={() => void handleImport()} disabled={!preview || busy}>
            <Upload className="h-4 w-4" />
            {busy ? 'Import…' : 'Remplacer les données'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
