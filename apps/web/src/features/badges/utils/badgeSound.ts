/** Bip doux via Web Audio API (pas de fichier audio). */
export function playBadgeChime(): void {
  if (typeof window === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()
    const now = ctx.currentTime

    const master = ctx.createGain()
    master.gain.setValueAtTime(0.0001, now)
    master.gain.exponentialRampToValueAtTime(0.12, now + 0.02)
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.45)
    master.connect(ctx.destination)

    const frequencies = [523.25, 659.25, 783.99]
    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const start = now + index * 0.08
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28)
      osc.connect(gain)
      gain.connect(master)
      osc.start(start)
      osc.stop(start + 0.3)
    })

    window.setTimeout(() => {
      void ctx.close()
    }, 600)
  } catch {
    // Audio indisponible — silencieux
  }
}
