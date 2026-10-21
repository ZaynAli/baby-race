import { motion } from 'framer-motion'
import { Check, Loader2, Lock, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { castVote, fetchMyVote } from '../lib/api'
import { friendlyError } from '../lib/errors'
import { teamWord } from '../lib/race'
import type { GameState, Team } from '../lib/types'
import { clearBadge, getVoterId, readBadge, writeBadge, type StoredBadge } from '../lib/voter'
import { useGame } from '../hooks/useGame'
import { Backdrop } from './Backdrop'
import { Badge } from './Badge'

type View = 'loading' | 'form' | 'confirming' | 'badge'

function announcement(game: GameState | null) {
  if (!game) return null
  if (game.reveal_state === 'countdown') return 'Eyes on the TV. The countdown is running.'
  if (game.reveal_state === 'prediction') {
    if (game.prediction_winner === 'tie') return 'The crowd tied. Watch the TV.'
    if (game.prediction_winner === 'girl' || game.prediction_winner === 'boy') {
      return `Crowd prediction: Team ${teamWord(game.prediction_winner)}.`
    }
  }
  if (game.reveal_state === 'actual' && game.actual_gender) {
    return game.actual_gender === 'girl' ? "It's a girl!" : "It's a boy!"
  }
  return null
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <Backdrop />
      <main className="relative z-10 mx-auto flex min-h-dvh w-full min-w-0 max-w-lg flex-col px-5 py-8">{children}</main>
    </div>
  )
}

function TeamCard({
  team,
  disabled,
  pending,
  onPick,
}: {
  team: Team
  disabled: boolean
  pending: boolean
  onPick: (team: Team) => void
}) {
  const girl = team === 'girl'
  return (
    <motion.button
      type="button"
      whileHover={disabled ? undefined : { y: -6, scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      disabled={disabled}
      onClick={() => onPick(team)}
      className={`flex min-h-44 min-w-0 flex-col items-start rounded-[28px] p-4 text-left shadow-[0_18px_40px_rgba(0,0,0,0.18)] disabled:opacity-60 ${
        girl ? 'bg-gradient-to-br from-[#ffd6e7] to-[#ff8fb8] text-[#5c2342]' : 'bg-gradient-to-br from-[#e5f3ff] to-[#8ec8ff] text-[#17385f]'
      }`}
    >
      <span className="text-5xl" aria-hidden="true">
        {girl ? '🎀' : '🧸'}
      </span>
      <strong className="mt-5 font-display text-[1.65rem] leading-none">
        Team
        <span className="mt-1 block text-[2rem]">{girl ? 'Girl' : 'Boy'}</span>
      </strong>
      <span className="mt-2 text-xs font-extrabold uppercase tracking-[0.16em]">{girl ? 'Pink' : 'Blue'}</span>
      {pending && <Loader2 className="mt-4 h-5 w-5 animate-spin" aria-hidden="true" />}
    </motion.button>
  )
}

export function GuestView() {
  const { game, loading, problem, refresh, girl, boy } = useGame()
  const cached = readBadge()
  const [name, setName] = useState('')
  const [view, setView] = useState<View>(cached ? 'badge' : 'loading')
  const [badge, setBadge] = useState<StoredBadge | null>(cached)
  const [busyTeam, setBusyTeam] = useState<Team | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const viewRef = useRef(view)
  const lock = useRef(false)
  const timer = useRef<number | null>(null)
  viewRef.current = view

  useEffect(() => {
    document.title = 'The Great Baby Race'
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function sync() {
      try {
        const mine = await fetchMyVote(getVoterId())
        if (cancelled || viewRef.current === 'confirming') return
        if (mine) {
          writeBadge(mine)
          setBadge(mine)
          setView('badge')
        } else {
          clearBadge()
          setBadge(null)
          setView('form')
        }
      } catch (error) {
        console.error(error)
        if (cancelled || viewRef.current === 'confirming') return
        if (readBadge()) setView('badge')
        else setView('form')
      }
    }
    void sync()
    return () => {
      cancelled = true
    }
  }, [game?.vote_seq])

  async function choose(team: Team) {
    const clean = name.trim().replace(/\s+/g, ' ').slice(0, 40)
    if (!clean) {
      setFormError('Add your name first.')
      inputRef.current?.focus()
      return
    }
    if (loading && !game) {
      setFormError('Still connecting. Try again in a moment.')
      return
    }
    if (game && !game.voting_open) {
      setFormError('Voting is closed right now. Watch the TV.')
      return
    }
    if (lock.current) return
    lock.current = true
    setBusyTeam(team)
    setFormError(null)
    try {
      const result = await castVote(getVoterId(), clean, team)
      const next = { guest_name: result.guest_name, team: result.team }
      writeBadge(next)
      setBadge(next)
      if (result.already_voted) {
        setNote(`This phone already joined Team ${teamWord(result.team)}.`)
        setView('badge')
      } else {
        setNote(null)
        setView('confirming')
        timer.current = window.setTimeout(() => setView('badge'), 1150)
      }
      void refresh()
    } catch (error) {
      console.error(error)
      setFormError(friendlyError(error))
    } finally {
      lock.current = false
      setBusyTeam(null)
    }
  }

  if ((view === 'badge' || view === 'confirming') && badge) {
    if (view === 'confirming') {
      const girlTeam = badge.team === 'girl'
      return (
        <div
          className="grid min-h-dvh place-items-center px-6 text-center text-white"
          style={{
            background: girlTeam
              ? 'radial-gradient(circle at 50% 20%, #ffd0e4, #d24b86 70%)'
              : 'radial-gradient(circle at 50% 20%, #d7ecff, #2f74c4 72%)',
          }}
        >
          <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 14 }}>
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-white text-[#2a1438]">
              <Check className="h-12 w-12" aria-hidden="true" />
            </div>
            <p className="mt-6 text-6xl" aria-hidden="true">
              {girlTeam ? '🎀' : '🧸'}
            </p>
            <h1 className="mt-2 w-full min-w-0 break-words px-4 text-center font-display text-4xl italic leading-tight">
              You're in, {badge.guest_name}!
            </h1>
            <p className="mt-3 text-lg font-extrabold">Team {teamWord(badge.team)}</p>
          </motion.div>
        </div>
      )
    }
    return (
      <Badge
        name={badge.guest_name}
        team={badge.team}
        girl={girl}
        boy={boy}
        note={note}
        banner={announcement(game)}
      />
    )
  }

  const locked = Boolean(game && !game.voting_open)

  return (
    <Shell>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.28em] text-blush">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          A live shower game
        </p>
        <h1 className="mt-3 w-full min-w-0 text-balance font-display text-[clamp(2.8rem,12vw,4.6rem)] italic leading-[0.9]">
          The Great Baby Race
        </h1>
        <h2 className="mt-5 w-full min-w-0 text-balance font-display text-[1.65rem] leading-tight sm:text-3xl">
          Are you Team Girl or Team Boy?
        </h2>
        <p className="mt-3 w-full min-w-0 text-base leading-relaxed text-white/75">
          Pick a side, get a badge to hold up instead of a pin, and cheer as the strollers race across the TV. Every vote nudges your team forward.
        </p>

        {(formError || problem) && (
          <div className="mt-5 rounded-2xl bg-[#8c3030] px-4 py-3 text-sm font-bold" role="alert">
            <p>{formError || problem}</p>
            {problem && !formError && (
              <button type="button" className="mt-2 underline" onClick={() => void refresh()}>
                Try again
              </button>
            )}
          </div>
        )}

        {view === 'loading' ? (
          <p className="mt-10 inline-flex items-center gap-2 font-extrabold text-white/80">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            Checking this phone…
          </p>
        ) : locked ? (
          <div className="mt-8 rounded-[28px] border border-white/15 bg-white/10 p-6 text-center">
            <Lock className="mx-auto h-8 w-8" aria-hidden="true" />
            <h3 className="mt-3 font-display text-3xl">Voting is closed</h3>
            <p className="mt-2 text-white/75">The host paused the race. Keep your eyes on the TV.</p>
          </div>
        ) : (
          <>
            <label htmlFor="guest-name" className="mt-8 text-sm font-extrabold tracking-wide text-white/80">
              Your name
            </label>
            <input
              id="guest-name"
              ref={inputRef}
              value={name}
              maxLength={40}
              autoCapitalize="words"
              autoComplete="given-name"
              enterKeyHint="done"
              placeholder="First name"
              disabled={busyTeam !== null}
              onChange={(event) => {
                setName(event.target.value)
                if (formError) setFormError(null)
              }}
              className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-4 text-lg outline-none placeholder:text-white/40 focus:border-blush"
            />
            <div className="mt-4 grid grid-cols-2 gap-3 max-[360px]:grid-cols-1">
              <TeamCard team="girl" disabled={busyTeam !== null} pending={busyTeam === 'girl'} onPick={choose} />
              <TeamCard team="boy" disabled={busyTeam !== null} pending={busyTeam === 'boy'} onPick={choose} />
            </div>
            <p className="mt-4 text-center text-sm text-white/60">One vote on this phone. First names are plenty.</p>
          </>
        )}
      </div>
    </Shell>
  )
}
