import { Baby, Eye, EyeOff, Loader2, Lock, PartyPopper, RotateCcw, Timer, Trophy, Tv, Unlock, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { fetchAdminVotes, runAdminAction } from '../lib/api'
import { friendlyError } from '../lib/errors'
import { teamWord } from '../lib/race'
import type { AdminAction, GuestVote, Team } from '../lib/types'
import { useGame } from '../hooks/useGame'
import { Backdrop } from './Backdrop'

const SECRET_KEY = 'baby-race-admin'
type Confirm = 'reset' | 'countdown' | 'celebrate' | 'actual_girl' | 'actual_boy'

const btn = 'inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-extrabold disabled:opacity-50'

function formatTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function noticeFor(action: AdminAction) {
  switch (action) {
    case 'lock':
      return 'Voting is locked.'
    case 'unlock':
      return 'Voting is open.'
    case 'reset':
      return 'All votes were erased. The race is back at the start.'
    case 'countdown':
      return 'Countdown is on the TV. Voting is locked.'
    case 'celebrate':
      return 'The crowd prediction is on the TV. This is not the baby’s gender.'
    case 'race':
      return 'The TV is back on the race.'
    case 'actual_girl':
      return 'The TV is announcing a girl. This is separate from the votes.'
    case 'actual_boy':
      return 'The TV is announcing a boy. This is separate from the votes.'
  }
}

export function AdminView() {
  const { game, problem, refresh, girl, boy, total } = useGame()
  const stored = sessionStorage.getItem(SECRET_KEY) ?? ''
  const [secret, setSecret] = useState(stored)
  const [showSecret, setShowSecret] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [votes, setVotes] = useState<GuestVote[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const lock = useRef(false)

  useEffect(() => {
    document.title = 'Baby Race · Host'
  }, [])

  const booted = useRef(false)
  useEffect(() => {
    if (booted.current) return
    booted.current = true
    const saved = sessionStorage.getItem(SECRET_KEY)
    if (saved) void signIn(saved, true)
  }, [])

  useEffect(() => {
    if (!authed) return
    const id = window.setInterval(() => {
      void fetchAdminVotes(secret)
        .then(setVotes)
        .catch((err: unknown) => {
          console.error(err)
          setError(friendlyError(err))
        })
    }, 5000)
    return () => window.clearInterval(id)
  }, [authed, secret])

  async function signIn(nextSecret: string, silent = false) {
    setBusy(true)
    if (!silent) setError(null)
    try {
      const list = await fetchAdminVotes(nextSecret)
      sessionStorage.setItem(SECRET_KEY, nextSecret)
      setSecret(nextSecret)
      setVotes(list)
      setAuthed(true)
      await refresh()
    } catch (err) {
      console.error(err)
      if (silent) {
        sessionStorage.removeItem(SECRET_KEY)
        setAuthed(false)
      } else {
        setError(friendlyError(err))
      }
    } finally {
      setBusy(false)
    }
  }

  async function run(action: AdminAction) {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    setError(null)
    setConfirm(null)
    try {
      await runAdminAction(secret, action)
      setNotice(noticeFor(action))
      const [list] = await Promise.all([fetchAdminVotes(secret), refresh()])
      setVotes(list)
    } catch (err) {
      console.error(err)
      setError(friendlyError(err))
    } finally {
      lock.current = false
      setBusy(false)
    }
  }

  function signOut() {
    sessionStorage.removeItem(SECRET_KEY)
    setAuthed(false)
    setVotes([])
    setSecret('')
    setNotice(null)
    setConfirm(null)
  }

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <Backdrop />
      <main className="relative z-10 mx-auto w-full min-w-0 max-w-xl px-5 py-8">
        <p className="text-xs font-extrabold tracking-[0.32em] text-blush">HOST CONTROLS</p>
        <h1 className="mt-2 font-display text-5xl italic leading-none">Baby Race</h1>
        <p className="mt-3 text-sm text-white/70">Guest names stay on this page. The TV only shows the race.</p>

        {!authed ? (
          <form
            className="mt-8 rounded-[28px] border border-white/15 bg-white/10 p-5"
            onSubmit={(event) => {
              event.preventDefault()
              void signIn(secret.trim())
            }}
          >
            <label htmlFor="admin-secret" className="text-sm font-extrabold">
              Host password
            </label>
            <div className="mt-2 flex min-w-0 gap-2">
              <input
                id="admin-secret"
                type={showSecret ? 'text' : 'password'}
                value={secret}
                autoFocus
                autoComplete="current-password"
                onChange={(event) => setSecret(event.target.value)}
                className="min-w-0 w-full rounded-2xl border border-white/20 bg-black/20 px-4 py-3 outline-none focus:border-blush"
                placeholder="Your host password"
              />
              <button
                type="button"
                className="rounded-2xl border border-white/20 px-3"
                onClick={() => setShowSecret((value) => !value)}
                aria-label={showSecret ? 'Hide password' : 'Show password'}
              >
                {showSecret ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              This is not a Supabase API key. After the migration, run this in the SQL editor, then type the same password here:
            </p>
            <code className="mt-2 block overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-black/30 p-3 text-xs leading-relaxed text-white/80">
              update public.admin_config set secret = 'your-long-password' where id = 1;
            </code>
            {error && (
              <p className="mt-3 rounded-xl bg-[#8c3030] px-3 py-2 text-sm font-bold" role="alert">
                {error}
              </p>
            )}
            <button type="submit" disabled={busy || secret.trim().length < 12} className={`${btn} mt-4 bg-white text-ink`}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Open host controls
            </button>
          </form>
        ) : (
          <div className="mt-6 space-y-4">
            {(error || problem) && (
              <p className="rounded-2xl bg-[#8c3030] px-4 py-3 text-sm font-bold" role="alert">
                {error || problem}
              </p>
            )}
            {notice && <p className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold">{notice}</p>}

            <section className="grid grid-cols-3 gap-2">
              <Stat label="Total" value={total} />
              <Stat label="Girl" value={girl} tone="girl" />
              <Stat label="Boy" value={boy} tone="boy" />
            </section>

            <section className="rounded-[28px] border border-white/15 bg-white/10 p-4">
              <h2 className="font-display text-2xl">Voting</h2>
              <p className="mt-1 text-sm text-white/70">{game?.voting_open ? 'Guests can vote.' : 'Guests see a closed message.'}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button type="button" disabled={busy || !game?.voting_open} className={`${btn} bg-white/10`} onClick={() => void run('lock')}>
                  <Lock className="h-4 w-4" /> Lock voting
                </button>
                <button type="button" disabled={busy || game?.voting_open !== false} className={`${btn} bg-white text-ink`} onClick={() => void run('unlock')}>
                  <Unlock className="h-4 w-4" /> Unlock voting
                </button>
              </div>
            </section>

            <section className="rounded-[28px] border border-white/15 bg-white/10 p-4">
              <h2 className="font-display text-2xl">Crowd prediction</h2>
              <p className="mt-1 text-sm text-white/70">This celebrates the vote. It never announces the baby.</p>
              {confirm === 'countdown' || confirm === 'celebrate' ? (
                <ConfirmBox
                  title={confirm === 'countdown' ? 'Start the 5 second countdown?' : 'Show the crowd winner now?'}
                  body="Voting locks. You can return to the race afterward."
                  yes={confirm === 'countdown' ? 'Start countdown' : 'Show the winner'}
                  busy={busy}
                  onYes={() => void run(confirm)}
                  onNo={() => setConfirm(null)}
                />
              ) : (
                <div className="mt-3 grid gap-2">
                  <button type="button" disabled={busy} className={`${btn} bg-blush text-[#4d1834]`} onClick={() => setConfirm('countdown')}>
                    <Timer className="h-4 w-4" /> Start countdown
                  </button>
                  <button type="button" disabled={busy} className={`${btn} bg-babyblue text-[#123255]`} onClick={() => setConfirm('celebrate')}>
                    <PartyPopper className="h-4 w-4" /> Celebrate the vote winner
                  </button>
                  <button type="button" disabled={busy || game?.reveal_state === 'race'} className={`${btn} bg-white/10`} onClick={() => void run('race')}>
                    <Trophy className="h-4 w-4" /> Back to the race
                  </button>
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-dashed border-white/25 bg-black/20 p-4">
              <h2 className="inline-flex items-center gap-2 font-display text-2xl">
                <Baby className="h-5 w-5" /> Actual gender
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-white/75">
                Optional, and separate from the votes. Nothing here runs on its own. Skip it if you are only playing the prediction game.
              </p>
              {confirm === 'actual_girl' || confirm === 'actual_boy' ? (
                <ConfirmBox
                  title={confirm === 'actual_girl' ? 'Announce that it is a girl?' : 'Announce that it is a boy?'}
                  body="The TV will say this is the real reveal, not the race result. Voting locks."
                  yes="Show it on the TV"
                  busy={busy}
                  onYes={() => void run(confirm)}
                  onNo={() => setConfirm(null)}
                />
              ) : (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <button type="button" disabled={busy} className={`${btn} bg-blush text-[#4d1834]`} onClick={() => setConfirm('actual_girl')}>
                    Reveal a girl
                  </button>
                  <button type="button" disabled={busy} className={`${btn} bg-babyblue text-[#123255]`} onClick={() => setConfirm('actual_boy')}>
                    Reveal a boy
                  </button>
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-white/15 bg-white/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="inline-flex items-center gap-2 font-display text-2xl">
                  <Users className="h-5 w-5" /> Guests
                </h2>
                <span className="text-sm font-bold text-white/60">{votes.length} shown</span>
              </div>
              {total > votes.length && (
                <p className="mt-2 text-xs text-white/60">Showing the latest {votes.length} names. Totals above include everyone.</p>
              )}
              <ul className="mt-3 max-h-80 space-y-2 overflow-auto pr-1">
                {votes.length === 0 && <li className="text-sm text-white/65">No votes yet. Put the QR code on the TV.</li>}
                {votes.map((vote) => (
                  <li key={vote.id} className="flex items-center justify-between gap-3 rounded-2xl bg-black/20 px-3 py-2">
                    <span className="truncate font-extrabold">{vote.guest_name}</span>
                    <span className={`shrink-0 text-sm font-extrabold ${vote.team === 'girl' ? 'text-blush' : 'text-babyblue'}`}>
                      Team {teamWord(vote.team)} · {formatTime(vote.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-[28px] border border-[#ffb4b4]/40 bg-[#ffb4b4]/10 p-4">
              <h2 className="font-display text-2xl text-[#ffd0d0]">Reset</h2>
              {confirm === 'reset' ? (
                <ConfirmBox
                  title="Erase every vote?"
                  body="Guest badges clear the next time those phones check in. Do this before the party, not during it."
                  yes="Erase all votes"
                  busy={busy}
                  danger
                  onYes={() => void run('reset')}
                  onNo={() => setConfirm(null)}
                />
              ) : (
                <button type="button" disabled={busy} className={`${btn} mt-3 bg-[#ffb4b4] text-[#5c1d2a]`} onClick={() => setConfirm('reset')}>
                  <RotateCcw className="h-4 w-4" /> Reset all votes
                </button>
              )}
            </section>

            <div className="flex flex-wrap gap-3 pb-6">
              <a href="/tv" target="_blank" rel="noreferrer" className={`${btn} w-auto bg-white px-5 text-ink`}>
                <Tv className="h-4 w-4" /> Open the TV
              </a>
              <button type="button" onClick={signOut} className={`${btn} w-auto bg-white/10 px-5`}>
                Sign out
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: Team }) {
  return (
    <div className={`rounded-3xl px-3 py-4 text-center ${tone === 'girl' ? 'bg-blush/20' : tone === 'boy' ? 'bg-babyblue/20' : 'bg-white/10'}`}>
      <b className="block font-display text-4xl tabular-nums">{value}</b>
      <small className="font-extrabold tracking-[0.14em] text-white/70">{label.toUpperCase()}</small>
    </div>
  )
}

function ConfirmBox({
  title,
  body,
  yes,
  busy,
  danger,
  onYes,
  onNo,
}: {
  title: string
  body: string
  yes: string
  busy: boolean
  danger?: boolean
  onYes: () => void
  onNo: () => void
}) {
  return (
    <div className="mt-3 rounded-2xl bg-black/25 p-3">
      <p className="font-extrabold">{title}</p>
      <p className="mt-1 text-sm text-white/70">{body}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button type="button" disabled={busy} onClick={onYes} className={`${btn} ${danger ? 'bg-[#ffb4b4] text-[#5c1d2a]' : 'bg-white text-ink'}`}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : yes}
        </button>
        <button type="button" disabled={busy} onClick={onNo} className={`${btn} bg-white/10`}>
          Cancel
        </button>
      </div>
    </div>
  )
}
