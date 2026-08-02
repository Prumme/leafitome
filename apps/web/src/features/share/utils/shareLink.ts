export function inviteUrl(shareToken: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/invite/${shareToken}`
}

/** Web Share API si dispo, sinon copie dans le presse-papiers. */
export async function shareOrCopyInvite(shareToken: string, todoName: string): Promise<'shared' | 'copied'> {
  const url = inviteUrl(shareToken)
  const title = `Rejoins « ${todoName} » sur Leafitome`
  const text = `On partage la todo « ${todoName} » — clique pour rejoindre :`

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url })
      return 'shared'
    } catch (error) {
      // Annulation utilisateur → on ne force pas le copy
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error
      }
    }
  }

  await navigator.clipboard.writeText(url)
  return 'copied'
}
