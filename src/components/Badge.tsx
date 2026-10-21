import { motion } from 'framer-motion'
import { ArrowRight, Tv } from 'lucide-react'
import type { Team } from '../lib/types'
import { Stroller } from './Stroller'

const THEMES = {
  girl: {
    background: 'radial-gradient(circle at 50% 12%, #ffe3ef 0%, #ff8fb8 34%, #d24b86 68%, #6e2048 100%)',
    plate: '#4d1834',
    emoji: '🎀',
  },
  boy: {
    background: 'radial-gradient(circle at 50% 12%, #eef6ff 0%, #8ec8ff 36%, #2f74c4 68%, #14345f 100%)',
    plate: '#123255',
    emoji: '🧸',
  },
} satisfies Record<Team, { background: string; plate: string; emoji: string }>

export function Badge({
  name,
  team,
  girl,
  boy,
  note,
  banner,
}: {
  name: string
  team: Team
  girl: number
  boy: number
  note: string | null
  banner: string | null
}) {
  const theme = THEMES[team]
  return (
    <div className="relative min-h-dvh overflow-x-hidden px-5 py-8 text-white" style={{ background: theme.background }}>
      <div className="pointer-events-none absolute -left-8 top-16 h-28 w-28 rounded-full bg-white/25 blur-2xl" />
      <div className="pointer-events-none absolute -right-6 bottom-24 h-36 w-36 rounded-full bg-white/20 blur-3xl" />
      <motion.div
        className="relative mx-auto flex min-h-[calc(100dvh-4rem)] w-full min-w-0 max-w-md flex-col items-center justify-center text-center"
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 16 }}
      >
        <p className="text-xs font-extrabold tracking-[0.42em] text-white/80">THE GREAT BABY RACE</p>
        {banner && (
          <p className="mt-4 max-w-full rounded-full bg-white/20 px-4 py-2 text-sm font-extrabold backdrop-blur">{banner}</p>
        )}
        <p className="mt-6 text-6xl" aria-hidden="true">
          {theme.emoji}
        </p>
        <h1 className="mt-3 w-full min-w-0 px-2 text-center font-display italic leading-[0.86]">
          <span className="block text-[clamp(2.2rem,11vw,3.5rem)]">I'm</span>
          <span className="block text-[clamp(2.7rem,12vw,4.6rem)]">Team</span>
          <span className="block text-[clamp(2.7rem,12vw,4.6rem)]">{team === 'girl' ? 'Girl!' : 'Boy!'}</span>
        </h1>
        <div className="mt-2">
          <Stroller team={team} className="mx-auto h-36 w-auto drop-shadow-xl" />
        </div>
        <p
          className="mt-2 max-w-full break-words rounded-full bg-white px-5 py-2 font-display text-2xl"
          style={{ color: theme.plate }}
        >
          {name}
        </p>
        <p className="mt-4 max-w-xs text-sm font-bold text-white/85">Hold your phone up. This is your pin.</p>
        <p className="mt-2 text-sm font-extrabold text-white/80">
          Girl {girl} · Boy {boy}
        </p>
        {note && <p className="mt-3 max-w-xs text-sm font-bold">{note}</p>}
        <a
          href="/tv"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-base font-extrabold shadow-lg"
          style={{ color: theme.plate }}
        >
          <Tv className="h-5 w-5" aria-hidden="true" />
          View the live race
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </a>
        <p className="mt-4 max-w-xs px-2 text-xs font-bold text-white/70">Votes stay on this phone. They can't be switched here.</p>
      </motion.div>
    </div>
  )
}
