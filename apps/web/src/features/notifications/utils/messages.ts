export interface ReminderMessage {
  title: string
  body: string
}

/**
 * Messages d’encouragement selon le taux de complétion du jour (0–100).
 * Jeux de mots forêt / positif.
 */
export function buildReminderMessage(completionRate: number, total: number): ReminderMessage {
  if (total === 0) {
    return {
      title: 'Clairière au repos',
      body: 'Aucune tâche prévue aujourd’hui. Profite du calme — la forêt te retrouvera demain.',
    }
  }

  if (completionRate >= 100) {
    return {
      title: 'Forêt conquise !',
      body: 'Toutes tes tâches sont plantées. À demain pour de nouvelles pousses — tu as bien mérité la sieste sous les chênes.',
    }
  }

  if (completionRate >= 80) {
    return {
      title: 'Encore un petit bourgeon…',
      body: 'Il ne te reste qu’un tout petit peu. Une dernière feuille et la canopée est complète !',
    }
  }

  if (completionRate >= 50) {
    return {
      title: 'Plus de la moitié du chemin',
      body: 'Tu as déjà balisé plus de la moitié du sentier. Continue — la lumière filtre déjà entre les branches.',
    }
  }

  if (completionRate > 0) {
    return {
      title: 'Chaque feuille compte',
      body: 'Pas grave si ce n’est pas fini : fais de ton mieux, la forêt pousse à ton rythme. Un pas après l’autre.',
    }
  }

  return {
    title: 'On t’attend sous les fougères',
    body: 'Tu ne nous aurais pas oubliés ? Un tout petit pas suffit pour faire reverdir la journée.',
  }
}
