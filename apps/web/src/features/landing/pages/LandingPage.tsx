import { Link } from 'react-router-dom'
import { ArrowRight, Leaf, Lock, Sparkles, TreeDeciduous, Waves } from 'lucide-react'
import { SITE } from '@/shared/config/site'
import { cn } from '@/shared/utils/cn'

const features = [
  {
    icon: Waves,
    title: 'Rythme au quotidien',
    text: 'Todos quotidiennes, hebdo ou mensuelles — ta forêt pousse au bon tempo.',
  },
  {
    icon: TreeDeciduous,
    title: 'Dashboard & série',
    text: 'Heatmap, streak et badges : vois clairement ce que tu as accompli.',
  },
  {
    icon: Sparkles,
    title: 'Feuille-tastique',
    text: 'Célébrations douces, historique par jour, et une PWA installable.',
  },
]

const ctaPrimary =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-base font-medium text-white shadow-soft transition-colors hover:bg-primary-hover'
const ctaSecondary =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-forest-200 bg-white/80 px-4 py-2.5 text-base font-medium text-forest-800 transition-colors hover:bg-forest-100'

export function LandingPage() {
  return (
    <div className="landing min-h-dvh overflow-x-hidden text-forest-950">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-700 text-white shadow-soft">
              <Leaf className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-forest-950">
              {SITE.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-forest-800 hover:bg-white/50 sm:inline-flex"
            >
              Connexion
            </Link>
            <Link to="/register" className={cn(ctaPrimary, 'px-3.5 py-2 text-sm')}>
              Commencer
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative flex min-h-dvh flex-col justify-end pb-16 pt-28 sm:justify-center sm:pb-24 sm:pt-24">
        <div aria-hidden className="landing-hero-bg absolute inset-0" />
        <div aria-hidden className="landing-hero-mist pointer-events-none absolute inset-0" />

        <div className="relative z-10 mx-auto w-full max-w-5xl px-4 sm:px-6">
          <p className="landing-fade-up font-display text-5xl font-bold tracking-tight text-forest-950 sm:text-7xl md:text-8xl">
            {SITE.name}
          </p>
          <h1 className="landing-fade-up landing-delay-1 mt-4 max-w-xl text-xl font-medium text-forest-900 sm:text-2xl">
            Fais pousser tes habitudes, une feuille à la fois.
          </h1>
          <p className="landing-fade-up landing-delay-2 mt-3 max-w-lg text-base text-forest-800/90 sm:text-lg">
            L’app de tâches qui transforme ton quotidien en clairière claire — gratuite pour
            le moment, pensée pour rester simple et sereine.
          </p>
          <div className="landing-fade-up landing-delay-3 mt-8 flex flex-wrap gap-3">
            <Link to="/register" className={ctaPrimary}>
              Créer mon compte
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className={ctaSecondary}>
              J’ai déjà un compte
            </Link>
          </div>
        </div>
      </section>

      <section className="relative border-t border-forest-200/60 bg-[#f3f7f4] px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-3xl font-bold text-forest-950 sm:text-4xl">
            Ce que {SITE.name} te permet
          </h2>
          <p className="mt-2 max-w-2xl text-forest-700">
            Une seule intention : t’aider à tenir le rythme sans tableau de bord saturé.
          </p>
          <ul className="mt-12 grid gap-10 sm:grid-cols-3">
            {features.map((feature) => (
              <li key={feature.title} className="space-y-3">
                <feature.icon className="h-8 w-8 text-forest-600" aria-hidden />
                <h3 className="font-display text-xl font-semibold text-forest-950">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-forest-700">{feature.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="relative overflow-hidden px-4 py-20 sm:px-6">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-forest-800 via-forest-700 to-moss-700"
        />
        <div className="relative z-10 mx-auto max-w-5xl">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Gratuit. Sécurisé. À toi.
          </h2>
          <p className="mt-3 max-w-2xl text-forest-100">
            Pendant cette phase, {SITE.name} est entièrement gratuit. Tes données vivent sur
            ton compte, protégées par authentification — pas de pub, pas de revente. La
            vérification email arrivera bientôt ; en attendant, tu peux déjà planter ta forêt.
          </p>
          <ul className="mt-8 flex flex-col gap-3 text-sm text-forest-50 sm:flex-row sm:gap-8">
            <li className="inline-flex items-center gap-2">
              <Lock className="h-4 w-4" /> Compte personnel sécurisé
            </li>
            <li className="inline-flex items-center gap-2">
              <Leaf className="h-4 w-4" /> Sync multi-appareils via ton compte
            </li>
            <li className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Export / import quand tu veux
            </li>
          </ul>
          <div className="mt-10">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-base font-medium text-forest-900 transition-colors hover:bg-forest-50"
            >
              Rejoindre la clairière
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-forest-200 bg-forest-50 px-4 py-8 text-center text-sm text-ink-muted sm:px-6">
        <p>
          © {new Date().getFullYear()} {SITE.name} — cultive ton rythme.
        </p>
      </footer>
    </div>
  )
}
