export type Team = 'girl' | 'boy'
export type Leader = Team | 'tie'
export type RevealState = 'race' | 'countdown' | 'prediction' | 'actual'

export type AdminAction =
  | 'lock'
  | 'unlock'
  | 'reset'
  | 'countdown'
  | 'celebrate'
  | 'race'
  | 'actual_girl'
  | 'actual_boy'

export type GameState = {
  id: number
  voting_open: boolean
  countdown_active: boolean
  countdown_started_at: string | null
  reveal_state: RevealState
  prediction_winner: Leader | null
  prediction_girl_votes: number
  prediction_boy_votes: number
  actual_gender: Team | null
  girl_votes: number
  boy_votes: number
  last_team: Team | null
  last_vote_at: string | null
  vote_seq: number
  updated_at: string
}

export type CastResult = {
  guest_name: string
  team: Team
  already_voted: boolean
}

export type GuestVote = {
  id: string
  guest_name: string
  team: Team
  created_at: string
}

function asNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value)
  return 0
}

function asTeam(value: unknown): Team | null {
  return value === 'girl' || value === 'boy' ? value : null
}

export function parseGameState(input: unknown): GameState | null {
  if (!input || typeof input !== 'object') return null
  const row = input as Record<string, unknown>
  const reveal = row.reveal_state
  if (reveal !== 'race' && reveal !== 'countdown' && reveal !== 'prediction' && reveal !== 'actual') {
    return null
  }
  const prediction = row.prediction_winner
  return {
    id: 1,
    voting_open: row.voting_open === true,
    countdown_active: row.countdown_active === true,
    countdown_started_at: typeof row.countdown_started_at === 'string' ? row.countdown_started_at : null,
    reveal_state: reveal,
    prediction_winner: prediction === 'girl' || prediction === 'boy' || prediction === 'tie' ? prediction : null,
    prediction_girl_votes: asNumber(row.prediction_girl_votes),
    prediction_boy_votes: asNumber(row.prediction_boy_votes),
    actual_gender: asTeam(row.actual_gender),
    girl_votes: asNumber(row.girl_votes),
    boy_votes: asNumber(row.boy_votes),
    last_team: asTeam(row.last_team),
    last_vote_at: typeof row.last_vote_at === 'string' ? row.last_vote_at : null,
    vote_seq: asNumber(row.vote_seq),
    updated_at: typeof row.updated_at === 'string' ? row.updated_at : new Date(0).toISOString(),
  }
}

export function isGuestVote(input: unknown): input is GuestVote {
  if (!input || typeof input !== 'object') return false
  const row = input as Partial<GuestVote>
  return (
    typeof row.id === 'string' &&
    typeof row.guest_name === 'string' &&
    (row.team === 'girl' || row.team === 'boy') &&
    typeof row.created_at === 'string'
  )
}
