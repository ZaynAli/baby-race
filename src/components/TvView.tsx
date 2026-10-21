import { AnimatePresence, motion } from 'framer-motion'
import { Maximize2, Minimize2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useRef, useState } from 'react'
import { exitFullscreen, isFullscreen, requestFullscreen } from '../lib/fullscreen'
import { countdownNumber, guestJoinUrl, leaderOf, standingsLine, teamWord } from '../lib/race'
import type { GameState, Team } from '../lib/types'
import { useGame } from '../hooks/useGame'
import { Backdrop } from './Backdrop'
import { Confetti } from './Confetti'
import { CountUp } from './CountUp'
import { RaceTrack } from './RaceTrack'

type Toast = { id: number; text: string; team?: Team | 'both' }

function useQrSize() {
  const [size, setSize] = useState(180)
  useEffect(() => {
    const update = () => {
      const next = Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.2)
      setSize(Math.max(124, Math.min(210, next)))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return size
}

function predictionCopy(game: GameState) {
  const winner = game.prediction_winner ?? leaderOf(game.prediction_girl_votes || game.girl_votes, game.prediction_boy_votes || game.boy_votes)
  const girl = game.prediction_girl_votes
  const boy = game.prediction_boy_votes
  if (girl + boy === 0 || winner === 'tie') {
    return {
      title: girl + boy === 0 ? 'No votes yet' : "It's a tie!",
      detail: girl + boy === 0 ? 'The crowd has not picked a side.' : 'The crowd is split down the middle.',
      tone: 'tie' as const,
      score: null as string | null,
    }
  }
  return {
    title: `Team ${teamWord(winner)} wins!`,
    detail: 'This is the crowd’s prediction.',
    tone: winner,
    score: `Team Girl ${girl}  ·  Team Boy ${boy}`,
  }
}

export function TvView() {
  const { game, loading, problem, realtime, online, refresh, girl, boy, total } = useGame()
  const stageRef = useRef<HTMLDivElement>(null)
  const previous = useRef<GameState | null>(null)
  const [full, setFull] = useState(false)
  const [fsNote, setFsNote] = useState<string | null>(null)
  const [clock, setClock] = useState(0)
  const [plus, setPlus] = useState<Toast | null>(null)
  const [lead, setLead] = useState<Toast | null>(null)
  const [burst, setBurst] = useState<{ id: number; team: Team | 'both' } | null>(null)
  const qrSize = useQrSize()
  const joinUrl = guestJoinUrl()

  useEffect(() => {
    document.title = 'Baby Race · Live'
  }, [])

  useEffect(() => {
    const onChange = () => setFull(isFullscreen())
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [])

  useEffect(() => {
    if (game?.reveal_state !== 'countdown') return
    const id = window.setInterval(() => setClock((value) => value + 1), 200)
    return () => window.clearInterval(id)
  }, [game?.reveal_state, game?.countdown_started_at])

  useEffect(() => {
    if (!plus) return
    const id = window.setTimeout(() => setPlus(null), 2300)
    return () => window.clearTimeout(id)
  }, [plus])

  useEffect(() => {
    if (!lead) return
    const id = window.setTimeout(() => setLead(null), 2600)
    return () => window.clearTimeout(id)
  }, [lead])

  useEffect(() => {
    if (!game) return
    const before = previous.current
    previous.current = game
    if (!before || game.reveal_state !== 'race' || before.reveal_state !== 'race') return
    const delta = game.vote_seq - before.vote_seq
    if (delta > 0) {
      const team = delta === 1 ? game.last_team : 'both'
      if (team) {
        setBurst({ id: game.vote_seq, team })
        setPlus({
          id: game.vote_seq,
          team,
          text: delta === 1 && game.last_team ? `+1 for Team ${teamWord(game.last_team)}!` : `+${delta} votes!`,
        })
      }
    }
    const beforeLeader = leaderOf(before.girl_votes, before.boy_votes)
    const afterLeader = leaderOf(game.girl_votes, game.boy_votes)
    const brokeTie = beforeLeader === 'tie' && before.girl_votes > 0 && before.boy_votes > 0
    const overtook = beforeLeader !== 'tie' && afterLeader !== 'tie' && beforeLeader !== afterLeader
    if (afterLeader !== 'tie' && (brokeTie || overtook)) {
      setLead({ id: game.vote_seq, text: `Team ${teamWord(afterLeader)} takes the lead!` })
    }
  }, [game])

  async function toggleFullscreen() {
    const node = stageRef.current ?? document.documentElement
    try {
      if (isFullscreen()) await exitFullscreen()
      else await requestFullscreen(node)
      setFsNote(null)
    } catch (error) {
      console.error(error)
      setFsNote('If that did nothing, use the TV menu to enter fullscreen.')
    }
  }

  const number = countdownNumber(
    game?.countdown_started_at ?? null,
    game?.reveal_state === 'countdown' ? Date.now() : clock,
  )
  const showCountdown = game?.reveal_state === 'countdown' && number >= 1
  const showPrediction = game?.reveal_state === 'prediction' || (game?.reveal_state === 'countdown' && number < 1)
  const showActual = game?.reveal_state === 'actual' && Boolean(game.actual_gender)
  const prediction = game ? predictionCopy(game) : null
  const girlBounce = burst && (burst.team === 'girl' || burst.team === 'both') ? burst.id : 0
  const boyBounce = burst && (burst.team === 'boy' || burst.team === 'both') ? burst.id : 0
  const linkLabel = !online && game ? 'Reconnecting' : realtime ? 'Live' : online ? 'Connected' : 'Connecting'

  return (
    <div className="min-h-dvh bg-[#07060d] text-cream lg:grid lg:min-h-screen lg:place-items-center">
      <div
        ref={stageRef}
        className="stage bg-stage relative flex min-h-dvh w-full flex-col overflow-hidden lg:h-[min(100vh,calc(100vw*9/16))] lg:min-h-0 lg:w-[min(100vw,calc(100vh*16/9))] lg:rounded-[28px] lg:shadow-2xl"
      >
        <Backdrop />
        <div className="relative z-10 flex min-h-dvh flex-1 flex-col px-[4vw] py-[3.2vh] lg:min-h-0">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="font-display text-[clamp(2.3rem,6.4vh,6.4rem)] leading-[0.88] tracking-tight">
                THE GREAT BABY RACE
              </h1>
              <p className="mt-[0.6vh] font-display text-[clamp(1.15rem,2.8vh,2.3rem)] italic text-white/80">
                Who's it going to be?
              </p>
              <p className="mt-[0.4vh] h-[2.4vh] text-[clamp(0.85rem,1.8vh,1.2rem)] font-extrabold text-white/65">
                {game ? standingsLine(girl, boy) : 'Connecting to the race…'}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="font-display text-[clamp(2.6rem,8vh,6rem)] leading-none">
                <CountUp value={total} />
              </p>
              <p className="text-[clamp(0.68rem,1.4vh,0.9rem)] font-extrabold tracking-[0.18em] text-white/70">TOTAL VOTES</p>
              <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-black/25 px-3 py-1 text-[clamp(0.68rem,1.3vh,0.85rem)] font-extrabold">
                <span className={`h-2 w-2 rounded-full ${realtime ? 'bg-emerald-300' : 'bg-amber-200'}`} />
                {linkLabel}
              </p>
            </div>
          </header>

          <div className="relative flex flex-1 flex-col justify-center gap-[1.2vh] py-[1vh]">
            {problem && !game && (
              <div className="rounded-3xl border border-white/15 bg-black/30 p-6 text-center">
                <p className="font-display text-3xl">The race is still here</p>
                <p className="mt-2 text-white/75">{problem}</p>
                <button type="button" onClick={() => void refresh()} className="mt-4 rounded-full bg-white px-4 py-2 font-extrabold text-ink">
                  Try again
                </button>
              </div>
            )}
            {loading && !game ? (
              <div className="grid gap-6">
                <div className="h-28 animate-pulse rounded-full bg-white/10" />
                <div className="h-28 animate-pulse rounded-full bg-white/10" />
              </div>
            ) : (
              <>
                <RaceTrack team="girl" count={girl} total={total} bounceToken={girlBounce} />
                <RaceTrack team="boy" count={boy} total={total} bounceToken={boyBounce} />
              </>
            )}
            <AnimatePresence>
              {(plus || lead) && game?.reveal_state === 'race' && (
                <motion.div
                  className="pointer-events-none absolute left-1/2 top-1/2 z-20 flex w-[min(90%,42rem)] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3"
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  {lead && (
                    <div className="rounded-full bg-white px-6 py-3 text-center font-display text-[clamp(1.4rem,3.4vh,2.6rem)] text-ink shadow-2xl">
                      {lead.text}
                    </div>
                  )}
                  {plus && (
                    <div
                      className={`rounded-full px-6 py-3 text-center text-[clamp(1.2rem,3vh,2.2rem)] font-extrabold shadow-2xl ${
                        plus.team === 'boy' ? 'bg-babyblue text-[#123255]' : 'bg-blush text-[#4d1834]'
                      }`}
                    >
                      {plus.text}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <footer className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="rounded-3xl bg-white p-3 shadow-[0_12px_40px_rgba(0,0,0,0.28)]" aria-label="QR code to join the vote">
                <QRCodeSVG value={joinUrl} size={qrSize} level="Q" bgColor="#ffffff" fgColor="#1a1028" />
              </div>
              <div>
                <p className="font-display text-[clamp(1.35rem,3vh,2.5rem)] leading-tight">Scan to join the race!</p>
                <p className="mt-1 max-w-64 break-all text-[clamp(0.75rem,1.5vh,1rem)] font-bold text-white/70 sm:max-w-[34vw]">{joinUrl}</p>
                {game && !game.voting_open && game.reveal_state === 'race' && (
                  <p className="mt-2 text-sm font-extrabold text-white/80">Voting is locked</p>
                )}
                {problem && game && <p className="mt-2 text-sm font-bold text-amber-100">Showing the last totals while we reconnect.</p>}
                {fsNote && <p className="mt-2 max-w-xs text-sm text-white/70">{fsNote}</p>}
              </div>
            </div>
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-3 text-sm font-extrabold backdrop-blur hover:bg-white/15"
            >
              {full ? <Minimize2 className="h-5 w-5" aria-hidden="true" /> : <Maximize2 className="h-5 w-5" aria-hidden="true" />}
              {full ? 'Exit' : 'Fullscreen'}
            </button>
          </footer>
        </div>

        <AnimatePresence>
          {showCountdown && (
            <motion.div
              key="countdown"
              className="absolute inset-0 z-30 grid place-items-center bg-[#120a1c]/90 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div>
                <p className="text-sm font-extrabold tracking-[0.35em] text-white/70">THE CROWD HAS SPOKEN</p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={number}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.2, opacity: 0 }}
                    transition={{ duration: 0.28 }}
                    className="font-display text-[28vh] leading-none"
                  >
                    {number}
                  </motion.p>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
          {showPrediction && prediction && !showActual && (
            <motion.div
              key="prediction"
              className="absolute inset-0 z-30 grid place-items-center overflow-hidden bg-[#120a1c] text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Confetti tone={prediction.tone} />
              <div className="relative px-6">
                <p className="text-sm font-extrabold tracking-[0.32em] text-white/70">CROWD PREDICTION</p>
                <h2 className="mt-3 font-display text-[clamp(3.2rem,9vh,7.6rem)] font-bold uppercase leading-[0.9] tracking-tight">
                  {prediction.title}
                </h2>
                <p className="mt-4 text-[clamp(1.1rem,2.4vh,1.8rem)] font-extrabold text-white/80">{prediction.detail}</p>
                {prediction.score && <p className="mt-3 text-[clamp(1rem,2vh,1.5rem)] font-bold">{prediction.score}</p>}
              </div>
            </motion.div>
          )}
          {showActual && game?.actual_gender && (
            <motion.div
              key="actual"
              className="absolute inset-0 z-40 grid place-items-center overflow-hidden text-center text-ink"
              style={{
                background:
                  game.actual_gender === 'girl'
                    ? 'radial-gradient(circle at 50% 20%, #fff6ee, #ffb3d1 42%, #ff8fb8 78%)'
                    : 'radial-gradient(circle at 50% 20%, #fff6ee, #c5e4ff 45%, #8ec8ff 80%)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Confetti tone="actual" />
              <div className="relative px-6">
                <p className="text-sm font-extrabold tracking-[0.32em]">THE REAL REVEAL</p>
                <h2 className="mt-3 font-display text-[clamp(4rem,12vh,9rem)] italic leading-[0.88]">
                  {game.actual_gender === 'girl' ? "It's a girl!" : "It's a boy!"}
                </h2>
                <p className="mt-4 text-[clamp(1.1rem,2.4vh,1.8rem)] font-extrabold">
                  The votes were only a guess. Hello, baby.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
