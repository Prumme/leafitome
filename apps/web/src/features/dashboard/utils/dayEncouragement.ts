/** Petits mots d’encouragement / félicitations (jeux de mots forêt). */
export function getDayEncouragement(completionRate: number, planned: number): {
  title: string
  subtitle: string
} {
  if (planned === 0) {
    return {
      title: 'Journée en jachère',
      subtitle: 'Rien n’était planté pour ce jour-là.',
    }
  }

  if (completionRate >= 100) {
    return {
      title: 'Feuille-tastique !',
      subtitle: 'Clairière nette — tout a germé.',
    }
  }

  if (completionRate >= 80) {
    return {
      title: 'En pleine sève',
      subtitle: 'La forêt te doit une révérence.',
    }
  }

  if (completionRate >= 50) {
    return {
      title: 'Ça pousse bien',
      subtitle: 'Encore un peu d’arrosage et c’est la canopée.',
    }
  }

  if (completionRate >= 25) {
    return {
      title: 'Sous-bois éclairci',
      subtitle: 'Les racines tiennent — ne lâche pas la greffe.',
    }
  }

  if (completionRate > 0) {
    return {
      title: 'Première pousse',
      subtitle: 'Une feuille vaut mieux qu’un désert.',
    }
  }

  return {
    title: 'Rien n’a germé',
    subtitle: 'Demain, on replante — sans rancune de sève.',
  }
}
