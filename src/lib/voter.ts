import type { Team } from './types'

const VOTER_KEY = 'baby-race-voter-id'
const LEGACY_KEY = 'baby-race-device'
const BADGE_KEY = 'baby-race-badge'

export type StoredBadge = {
  guest_name: string
  team: Team
}

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16)
    const value = char === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

export function getVoterId() {
  const existing = localStorage.getItem(VOTER_KEY) || localStorage.getItem(LEGACY_KEY)
  if (existing && /^[0-9a-f-]{36}$/i.test(existing)) {
    localStorage.setItem(VOTER_KEY, existing)
    return existing
  }
  const created = createId()
  localStorage.setItem(VOTER_KEY, created)
  return created
}

export function readBadge(): StoredBadge | null {
  try {
    const raw = localStorage.getItem(BADGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredBadge>
    if ((parsed.team === 'girl' || parsed.team === 'boy') && typeof parsed.guest_name === 'string' && parsed.guest_name.trim()) {
      return { guest_name: parsed.guest_name, team: parsed.team }
    }
  } catch {
    return null
  }
  return null
}

export function writeBadge(badge: StoredBadge) {
  localStorage.setItem(BADGE_KEY, JSON.stringify(badge))
}

export function clearBadge() {
  localStorage.removeItem(BADGE_KEY)
}
