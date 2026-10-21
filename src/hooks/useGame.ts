import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchGameState } from '../lib/api'
import { friendlyError } from '../lib/errors'
import { supabase } from '../lib/supabase'
import type { GameState } from '../lib/types'

function isNewer(current: GameState, incoming: GameState) {
  const nextUpdated = Date.parse(incoming.updated_at)
  const currUpdated = Date.parse(current.updated_at)
  if (!Number.isFinite(nextUpdated) || !Number.isFinite(currUpdated)) return true
  return nextUpdated >= currUpdated
}

export function useGame() {
  const [game, setGame] = useState<GameState | null>(null)
  const [loading, setLoading] = useState(true)
  const [problem, setProblem] = useState<string | null>(null)
  const [realtime, setRealtime] = useState(false)
  const [online, setOnline] = useState(false)
  const inflight = useRef(false)
  const queued = useRef(false)

  const apply = useCallback((incoming: GameState) => {
    setGame((current) => {
      if (!current || isNewer(current, incoming)) return incoming
      return current
    })
    setProblem(null)
    setOnline(true)
    setLoading(false)
  }, [])

  const refresh = useCallback(async () => {
    if (!supabase) return
    if (inflight.current) {
      queued.current = true
      return
    }
    inflight.current = true
    try {
      do {
        queued.current = false
        try {
          const next = await fetchGameState()
          if (!next) {
            setProblem('The race row is missing. Run the SQL migration, then refresh.')
            setOnline(false)
          } else {
            apply(next)
          }
        } catch (error) {
          console.error(error)
          setProblem(friendlyError(error))
          setOnline(false)
        } finally {
          setLoading(false)
        }
      } while (queued.current)
    } finally {
      inflight.current = false
    }
  }, [apply])

  useEffect(() => {
    void refresh()
    const client = supabase
    if (!client) return

    const channel = client
      .channel('baby-race-game')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_state' }, () => {
        void refresh()
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtime(true)
          void refresh()
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setRealtime(false)
        }
      })

    const interval = window.setInterval(() => {
      void refresh()
    }, 5000)

    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    const onOnline = () => {
      void refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onOnline)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onOnline)
      void client.removeChannel(channel)
    }
  }, [refresh])

  return {
    game,
    loading,
    problem,
    realtime,
    online,
    refresh,
    girl: game?.girl_votes ?? 0,
    boy: game?.boy_votes ?? 0,
    total: (game?.girl_votes ?? 0) + (game?.boy_votes ?? 0),
  }
}
