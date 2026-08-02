import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, BellOff, Lock, Save, UserRound } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useNotificationPrefsStore } from '@/features/notifications/store/notificationPrefsStore'
import {
  getNotificationPermission,
  getNotificationSupport,
  requestNotificationPermission,
} from '@/features/notifications/utils/permission'
import {
  ensurePushSubscription,
  removePushSubscription,
} from '@/features/notifications/utils/pushSubscribe'
import { apiFetch } from '@/shared/lib/api/client'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { Input } from '@/shared/components/Input'
import { PageHeader } from '@/shared/components/PageHeader'
import { Toggle } from '@/shared/components/Toggle'
import type { Day } from '@/shared/types/common.types'
import { ALL_DAYS, DAY_LABELS } from '@/shared/utils/dates'
import { cn } from '@/shared/utils/cn'

export function ProfilePage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const updateDisplayName = useAuthStore((state) => state.updateDisplayName)
  const requestPasswordChange = useAuthStore((state) => state.requestPasswordChange)
  const prefs = useNotificationPrefsStore((state) => state.prefs)
  const loaded = useNotificationPrefsStore((state) => state.loaded)
  const pushConfigured = useNotificationPrefsStore((state) => state.pushConfigured)
  const updatePrefs = useNotificationPrefsStore((state) => state.updatePrefs)

  const [nickname, setNickname] = useState(user?.displayName ?? '')
  const [savingName, setSavingName] = useState(false)
  const [nameMessage, setNameMessage] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [permission, setPermission] = useState(getNotificationPermission())
  const [testBusy, setTestBusy] = useState(false)
  const [testMessage, setTestMessage] = useState<string | null>(null)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    setNickname(user?.displayName ?? '')
  }, [user?.displayName])

  useEffect(() => {
    setPermission(getNotificationPermission())
  }, [prefs.enabled])

  async function handleSaveNickname(event: FormEvent) {
    event.preventDefault()
    const next = nickname.trim()
    if (!next) {
      setNameError('Indique un surnom')
      return
    }
    setSavingName(true)
    setNameError(null)
    setNameMessage(null)
    try {
      await updateDisplayName(next)
      setNameMessage('Surnom mis à jour')
    } catch (error) {
      setNameError(error instanceof Error ? error.message : 'Enregistrement impossible')
    } finally {
      setSavingName(false)
    }
  }

  async function handleToggleNotifications(checked: boolean) {
    setTestMessage(null)
    setToggling(true)
    try {
      if (!checked) {
        await removePushSubscription()
        await updatePrefs({ enabled: false })
        return
      }

      if (!getNotificationSupport()) {
        setPermission('unsupported')
        await updatePrefs({ enabled: false })
        return
      }

      if (!pushConfigured) {
        setTestMessage('Web Push non configuré côté serveur (clés VAPID manquantes).')
        return
      }

      const result = await requestNotificationPermission()
      setPermission(result)
      if (result !== 'granted') {
        await updatePrefs({ enabled: false })
        return
      }

      await ensurePushSubscription()
      await updatePrefs({
        enabled: true,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris',
      })
    } catch (error) {
      setTestMessage(error instanceof Error ? error.message : 'Activation impossible')
      await updatePrefs({ enabled: false }).catch(() => undefined)
    } finally {
      setToggling(false)
    }
  }

  function toggleDay(day: Day) {
    const has = prefs.days.includes(day)
    if (has && prefs.days.length === 1) return
    const days = has ? prefs.days.filter((d) => d !== day) : [...prefs.days, day]
    void updatePrefs({ days })
  }

  async function handleTestNotification() {
    setTestBusy(true)
    setTestMessage(null)
    try {
      const result = await requestNotificationPermission()
      setPermission(result)
      if (result !== 'granted') {
        setTestMessage('Autorise d’abord les notifications dans le navigateur.')
        return
      }
      if (!pushConfigured) {
        setTestMessage('Web Push non configuré côté serveur.')
        return
      }
      await ensurePushSubscription()
      if (!prefs.enabled) await updatePrefs({ enabled: true })
      const data = await apiFetch<{ sent: number }>('/notifications/test', { method: 'POST' })
      setTestMessage(
        data.sent > 0
          ? 'Notification de test envoyée (via le serveur).'
          : 'Aucun appareil abonné — réactive les notifications.',
      )
    } catch (error) {
      setTestMessage(error instanceof Error ? error.message : 'Test impossible')
    } finally {
      setTestBusy(false)
    }
  }

  if (!user) return null

  const support = getNotificationSupport()
  const permissionLabel =
    permission === 'granted'
      ? 'Autorisées'
      : permission === 'denied'
        ? 'Bloquées par le navigateur'
        : permission === 'unsupported'
          ? 'Non supportées sur cet appareil'
          : 'En attente d’autorisation'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profil"
        subtitle="Ton coin de clairière : surnom et rappels."
      />

      <Card className="space-y-4">
        <div className="flex items-center gap-2 text-forest-900">
          <UserRound className="h-5 w-5 text-forest-600" />
          <h2 className="text-lg font-semibold">Compte</h2>
        </div>

        <p className="text-sm text-ink-muted">
          Connecté en tant que <span className="font-medium text-forest-800">{user.email}</span>
        </p>

        <form
          onSubmit={(e) => void handleSaveNickname(e)}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <Input
              label="Surnom"
              name="displayName"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={80}
              placeholder="Comment on t’appelle dans la forêt ?"
              error={nameError ?? undefined}
            />
          </div>
          <Button type="submit" disabled={savingName}>
            <Save className="h-4 w-4" />
            {savingName ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </form>
        {nameMessage ? <p className="text-sm text-done-700">{nameMessage}</p> : null}

        <div className="border-t border-forest-100 pt-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-forest-800">
                <Lock className="h-4 w-4" />
                Mot de passe
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                Un email avec un lien sécurisé te sera envoyé. Ta session sera fermée.
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                Email {user.emailVerified ? 'vérifié' : 'non vérifié'}
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              disabled={passwordBusy}
              onClick={() => {
                setPasswordBusy(true)
                setPasswordError(null)
                void requestPasswordChange()
                  .then(() => {
                    navigate('/login', {
                      replace: true,
                      state: {
                        notice:
                          'Email envoyé pour changer ton mot de passe. Ta session a été fermée.',
                      },
                    })
                  })
                  .catch((err) => {
                    setPasswordError(
                      err instanceof Error ? err.message : 'Envoi impossible',
                    )
                  })
                  .finally(() => setPasswordBusy(false))
              }}
            >
              {passwordBusy ? 'Envoi…' : 'Modifier le mot de passe'}
            </Button>
          </div>
          {passwordError ? <p className="mt-2 text-sm text-missed-700">{passwordError}</p> : null}
        </div>
      </Card>

      <Card className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-forest-900">
            {prefs.enabled && permission === 'granted' ? (
              <Bell className="h-5 w-5 text-forest-600" />
            ) : (
              <BellOff className="h-5 w-5 text-forest-600" />
            )}
            <div>
              <h2 className="text-lg font-semibold">Notifications</h2>
              <p className="text-sm text-ink-muted">
                Rappels Web Push — même si l’app est fermée (PWA installée recommandée).
              </p>
            </div>
          </div>
        </div>

        {!support ? (
          <p className="rounded-xl bg-bark-100 px-3 py-2 text-sm text-forest-800">
            Les notifications ne sont pas disponibles sur ce navigateur.
          </p>
        ) : null}

        {!pushConfigured ? (
          <p className="rounded-xl bg-bark-100 px-3 py-2 text-sm text-forest-800">
            Le serveur n’a pas encore de clés VAPID — les rappels app fermée sont indisponibles.
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Toggle
            id="notif-enabled"
            checked={prefs.enabled && permission === 'granted'}
            onChange={(checked) => void handleToggleNotifications(checked)}
            label="Activer les rappels"
            disabled={!support || !loaded || toggling || !pushConfigured}
          />
          <span className="text-xs text-ink-muted">Permission : {permissionLabel}</span>
        </div>

        {permission === 'denied' ? (
          <p className="rounded-xl bg-missed-50 px-3 py-2 text-sm text-missed-800">
            Les notifications sont bloquées. Réactive-les dans les réglages du navigateur / de
            l’appareil, puis réessaie.
          </p>
        ) : null}

        <div
          className={cn(
            'space-y-5',
            (!prefs.enabled || permission !== 'granted') && 'opacity-60',
          )}
        >
          <Input
            label="Heure du rappel"
            type="time"
            name="reminderTime"
            value={prefs.time}
            onChange={(e) => void updatePrefs({ time: e.target.value || '18:00' })}
            disabled={!prefs.enabled || permission !== 'granted'}
          />

          <div>
            <p className="mb-2 text-sm font-medium text-forest-800">Jours de rappel</p>
            <p className="mb-3 text-xs text-ink-muted">
              Décoche le week-end si tu préfères garder le silence le samedi et le dimanche.
            </p>
            <div className="flex flex-wrap gap-2">
              {ALL_DAYS.map((day) => {
                const active = prefs.days.includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    disabled={!prefs.enabled || permission !== 'granted'}
                    onClick={() => toggleDay(day)}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-forest-600 text-white'
                        : 'bg-forest-100 text-forest-700 hover:bg-forest-200',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                    )}
                  >
                    {DAY_LABELS[day]}
                  </button>
                )
              })}
            </div>
          </div>

          <Toggle
            id="notif-only-incomplete"
            checked={prefs.onlyIfIncomplete}
            onChange={(checked) => void updatePrefs({ onlyIfIncomplete: checked })}
            label="Uniquement s’il reste des tâches à faire"
            disabled={!prefs.enabled || permission !== 'granted'}
          />
          <p className="text-xs text-ink-muted">
            Fuseau utilisé : {prefs.timezone}. Si tout est terminé et l’option est activée, aucun
            rappel. Sinon, on te félicite quand même.
          </p>
        </div>

        <div className="flex flex-col gap-2 border-t border-forest-100 pt-4 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="secondary"
            disabled={!support || !pushConfigured || testBusy}
            onClick={() => void handleTestNotification()}
          >
            <Bell className="h-4 w-4" />
            {testBusy ? 'Envoi…' : 'Tester une notification'}
          </Button>
          {testMessage ? <p className="text-sm text-ink-muted">{testMessage}</p> : null}
        </div>
      </Card>
    </div>
  )
}
