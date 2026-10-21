import { withTimeout } from './async'
import { supabase } from './supabase'
import { isGuestVote, parseGameState, type AdminAction, type CastResult, type GuestVote, type Team } from './types'

function client() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

export async function fetchGameState() {
  const { data, error } = await withTimeout(
    client().from('game_state').select('*').eq('id', 1).maybeSingle(),
  )
  if (error) throw error
  if (!data) return null
  return parseGameState(data)
}

export async function fetchMyVote(voterId: string) {
  const { data, error } = await withTimeout(client().rpc('my_vote', { p_voter_id: voterId }))
  if (error) throw error
  if (!data || typeof data !== 'object') return null
  const row = data as Partial<CastResult>
  if ((row.team !== 'girl' && row.team !== 'boy') || typeof row.guest_name !== 'string') return null
  return { guest_name: row.guest_name, team: row.team }
}

export async function castVote(voterId: string, name: string, team: Team): Promise<CastResult> {
  const { data, error } = await withTimeout(
    client().rpc('cast_vote', { p_voter_id: voterId, p_name: name, p_team: team }),
  )
  if (error) throw error
  if (!data || typeof data !== 'object') throw new Error('The vote did not come back from the race.')
  const row = data as Partial<CastResult>
  if ((row.team !== 'girl' && row.team !== 'boy') || typeof row.guest_name !== 'string') {
    throw new Error('The vote did not come back from the race.')
  }
  return { guest_name: row.guest_name, team: row.team, already_voted: Boolean(row.already_voted) }
}

export async function fetchAdminVotes(secret: string): Promise<GuestVote[]> {
  const { data, error } = await withTimeout(client().rpc('admin_votes', { p_secret: secret }))
  if (error) throw error
  if (!Array.isArray(data)) return []
  return data.filter(isGuestVote)
}

export async function runAdminAction(secret: string, action: AdminAction) {
  const { error } = await withTimeout(client().rpc('admin_action', { p_secret: secret, p_action: action }))
  if (error) throw error
}
