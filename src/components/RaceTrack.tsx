import { motion } from 'framer-motion'
import { lanePercent } from '../lib/race'
import type { Team } from '../lib/types'
import { CountUp } from './CountUp'
import { Stroller } from './Stroller'

function Burst({ token, team }: { token: number; team: Team }) {
  const color = team === 'girl' ? '#ffd5e8' : '#d9eeff'
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2" aria-hidden="true">
      {Array.from({ length: 8 }, (_, index) => {
        const angle = (index / 8) * Math.PI * 2
        return (
          <motion.span
            key={`${token}-${index}`}
            className="absolute h-2.5 w-2.5 rounded-full"
            style={{ background: index % 2 ? '#fff' : color }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(angle) * 46, y: Math.sin(angle) * 30, opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        )
      })}
    </div>
  )
}

export function RaceTrack({
  team,
  count,
  total,
  bounceToken,
}: {
  team: Team
  count: number
  total: number
  bounceToken: number
}) {
  const girl = team === 'girl'
  const position = lanePercent(count, total)
  const trailWidth = total === 0 ? 0 : position
  const leading = total > 0 && count > total - count
  const percent = total > 0 ? Math.round((count / total) * 100) : 0
  const trail = girl
    ? 'linear-gradient(90deg, rgba(255,143,184,0.12), rgba(255,143,184,0.95))'
    : 'linear-gradient(90deg, rgba(142,200,255,0.12), rgba(142,200,255,0.95))'

  return (
    <section aria-label={`${girl ? 'Team Girl' : 'Team Boy'} has ${count} votes`}>
      <div className="mb-[1vh] flex items-end justify-between gap-4">
        <div>
          <p className={`text-[clamp(0.7rem,1.5vh,0.95rem)] font-extrabold tracking-[0.28em] ${girl ? 'text-blush' : 'text-babyblue'}`}>
            {girl ? 'PINK' : 'BLUE'}
          </p>
          <h2 className="font-display text-[clamp(1.8rem,4.6vh,3.6rem)] leading-none">
            {girl ? 'Team Girl' : 'Team Boy'}
          </h2>
        </div>
        <div className="text-right">
          <p className={`font-display text-[clamp(2rem,6vh,4.6rem)] leading-none ${girl ? 'text-blush' : 'text-babyblue'}`}>
            <CountUp value={count} />
          </p>
          <p className="text-[clamp(0.72rem,1.5vh,0.95rem)] font-extrabold tracking-[0.16em] text-white/70">
            {count === 1 ? 'VOTE' : 'VOTES'} · {percent}%
          </p>
        </div>
      </div>
      <div className="relative h-[clamp(7.2rem,18vh,13rem)]">
        <div className="absolute inset-x-0 bottom-[1.1rem] h-[46%] overflow-hidden rounded-full border border-white/15 bg-white/10">
          <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${trailWidth}%`, background: trail }} />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[clamp(0.62rem,1.3vh,0.85rem)] font-extrabold tracking-[0.22em] text-white/55">
            START
          </span>
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[clamp(1rem,2vh,1.4rem)]" aria-hidden="true">
            🏁
          </span>
        </div>
        <motion.div
          className="absolute bottom-[0.35rem]"
          initial={false}
          animate={{ left: `${position}%`, x: '-50%' }}
          transition={{ type: 'spring', stiffness: 70, damping: 16 }}
        >
          <motion.div
            key={bounceToken}
            animate={{ y: bounceToken > 0 ? [0, -18, 0, -8, 0] : 0 }}
            transition={{ duration: 0.55 }}
          >
            <div className={total === 0 ? 'idle-bob' : undefined}>
              <div className="relative">
                {bounceToken > 0 && <Burst token={bounceToken} team={team} />}
                <Stroller
                  team={team}
                  className={`h-[clamp(4.6rem,11vh,8rem)] w-auto ${leading ? 'drop-shadow-[0_10px_18px_rgba(255,255,255,0.35)]' : 'drop-shadow-[0_10px_16px_rgba(0,0,0,0.35)]'}`}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
