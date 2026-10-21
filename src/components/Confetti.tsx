import type { Team } from '../lib/types'

const PALETTES = {
  girl: ['#ff8fb8', '#ffd0e4', '#fff6ee', '#e85a9b', '#ffd56a'],
  boy: ['#8ec8ff', '#d7ecff', '#fff6ee', '#3d8fe0', '#ffd56a'],
  tie: ['#ff8fb8', '#8ec8ff', '#fff6ee', '#ffd56a', '#f0d2ff'],
  actual: ['#fff6ee', '#ffd56a', '#ff8fb8', '#8ec8ff', '#ffe7a3'],
}

export function Confetti({ tone }: { tone: Team | 'tie' | 'actual' }) {
  const colors = PALETTES[tone]
  const pieces = Array.from({ length: 46 }, (_, index) => ({
    id: index,
    left: `${(index * 97) % 100}%`,
    delay: `${(index % 14) * 0.12}s`,
    duration: `${3.1 + (index % 5) * 0.45}s`,
    color: colors[index % colors.length],
    width: 8 + (index % 5) * 2,
    height: 10 + (index % 4) * 3,
    radius: index % 3 === 0 ? 999 : 2,
  }))

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="confetti-piece"
          style={{
            left: piece.left,
            width: piece.width,
            height: piece.height,
            background: piece.color,
            borderRadius: piece.radius,
            animationDelay: piece.delay,
            animationDuration: piece.duration,
          }}
        />
      ))}
    </div>
  )
}
