import type { Leader, Team } from './types'

export function lanePercent(count: number, total: number) {
  if (total <= 0) return 12
  const share = Math.min(1, Math.max(0, count / total))
  return 12 + share * 76
}

export function leaderOf(girl: number, boy: number): Leader {
  if (girl > boy) return 'girl'
  if (boy > girl) return 'boy'
  return 'tie'
}

export function teamWord(team: Team) {
  return team === 'girl' ? 'Girl' : 'Boy'
}

export function countdownNumber(startedAt: string | null, now: number) {
  if (!startedAt) return 0
  const start = Date.parse(startedAt)
  if (!Number.isFinite(start)) return 5
  const remaining = 5 - Math.floor((now - start) / 1000)
  return Math.min(5, Math.max(0, remaining))
}

export function guestJoinUrl() {
  const configured = import.meta.env.VITE_PUBLIC_URL?.trim().replace(/\/$/, '')
  if (configured && /^https?:\/\//i.test(configured)) return `${configured}/`
  return `${window.location.origin}/`
}

export function standingsLine(girl: number, boy: number) {
  const total = girl + boy
  if (total === 0) return 'Waiting for the first vote'
  if (girl === boy) return 'The teams are tied'
  return girl > boy ? 'Team Girl is ahead' : 'Team Boy is ahead'
}
