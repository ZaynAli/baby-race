import type { Team } from '../lib/types'

export function Stroller({ team, className }: { team: Team; className?: string }) {
  const canopy = team === 'girl' ? '#ff8fb8' : '#8ec8ff'
  const accent = team === 'girl' ? '#e85a9b' : '#3d8fe0'
  const frame = '#fff8f2'

  return (
    <svg viewBox="0 0 140 110" className={className} aria-hidden="true">
      <path d="M40 50c-12 2-20 12-22 22" fill="none" stroke={frame} strokeWidth="6" strokeLinecap="round" />
      <path d="M46 52c2-26 50-30 64-8 6 8 8 18 5 26H50c-2-6-3-12-4-18z" fill={canopy} />
      <path d="M58 46c8-10 24-10 32 0" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      {team === 'girl' ? (
        <path d="M86 30c5 5 5 5 11 0-5 5-5 5 0 11-6-5-6-5-11 0 5-6 5-6 0-11z" fill="#fff" />
      ) : (
        <path d="M90 28l2 5 5 .4-4 3.4 1.4 5.2L90 39l-4.4 3 1.4-5.2-4-3.4 5-.4z" fill="#fff" />
      )}
      <path d="M44 68h66l7 16H54c-8 0-14-6-10-16z" fill={frame} />
      <circle cx="74" cy="76" r="8" fill={accent} />
      <circle cx="74" cy="76" r="3.5" fill="#fff" />
      <path d="M46 92h64" stroke={frame} strokeWidth="5" strokeLinecap="round" />
      <circle cx="58" cy="98" r="10" fill="#1a1224" />
      <circle cx="58" cy="98" r="4" fill={frame} />
      <circle cx="102" cy="98" r="10" fill="#1a1224" />
      <circle cx="102" cy="98" r="4" fill={frame} />
    </svg>
  )
}
