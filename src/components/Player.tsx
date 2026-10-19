// Site-wide podcast player — a React port of assets/player.js. Reuses the .dock
// markup + collapse CSS from hub.css: a sticky bottom dock that collapses to a
// pill when not hovered and expands on hover/focus, with sessionStorage resume.
import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { PlayIcons } from './icons'

export type Track = { src: string; title: string; img?: string; url?: string }
type Ctx = { current: Track | null; playing: boolean; play: (t: Track) => void }
const PlayerCtx = createContext<Ctx>({ current: null, playing: false, play: () => {} })
export const usePlayer = () => useContext(PlayerCtx)

const KEY = 'bw-player'
const SPEEDS = [1, 1.25, 1.5, 2, 0.75]
const fmt = (s: number) => {
  if (!isFinite(s) || s < 0) return '0:00'
  s = Math.floor(s)
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${r}` : `${m}:${r}`
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  if (!audioRef.current && typeof Audio !== 'undefined') audioRef.current = new Audio()
  const audio = audioRef.current!

  const [current, setCurrent] = useState<Track | null>(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [dur, setDur] = useState(0)
  const [rate, setRate] = useState(1)
  const [open, setOpen] = useState(false)
  const resumeAt = useRef(0)
  const openT = useRef<number>()

  // restore the previous session's track (paused) without autoplay
  useEffect(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem(KEY) || 'null')
      if (s && s.src) {
        setCurrent({ src: s.src, title: s.title, img: s.img, url: s.url })
        setRate(s.rate || 1)
        audio.src = s.src
        audio.playbackRate = s.rate || 1
        resumeAt.current = s.time || 0
      }
    } catch {}
  }, [])

  const save = () => {
    if (!current) return
    try {
      sessionStorage.setItem(KEY, JSON.stringify({
        ...current, time: audio.currentTime || resumeAt.current || 0, rate: audio.playbackRate, playing: !audio.paused,
      }))
    } catch {}
  }

  useEffect(() => {
    let last = 0
    const onTime = () => {
      if (!audio.duration) return
      setTime(audio.currentTime)
      if (audio.currentTime > 0) resumeAt.current = 0
      if (Date.now() - last > 2000) { last = Date.now(); save() }
    }
    const onMeta = () => setDur(audio.duration)
    const onState = () => setPlaying(!audio.paused)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('play', onState)
    audio.addEventListener('pause', onState)
    audio.addEventListener('ended', onState)
    return () => {
      audio.removeEventListener('timeupdate', onTime); audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('play', onState); audio.removeEventListener('pause', onState); audio.removeEventListener('ended', onState)
    }
  }, [current])

  const play = (t: Track) => {
    if (current && current.src === t.src) {
      audio.paused ? audio.play().catch(() => {}) : audio.pause()
      return
    }
    setCurrent(t)
    audio.src = t.src
    resumeAt.current = 0
    setOpen(true)
    window.clearTimeout(openT.current)
    openT.current = window.setTimeout(() => setOpen(false), 2600)
    audio.play().catch(() => {})
  }

  const toggle = () => {
    if (audio.paused && resumeAt.current && !audio.currentTime) {
      const once = () => { try { audio.currentTime = resumeAt.current } catch {}; audio.removeEventListener('loadedmetadata', once) }
      audio.addEventListener('loadedmetadata', once)
    }
    audio.paused ? audio.play().catch(() => {}) : audio.pause()
  }
  const close = () => { audio.pause(); setCurrent(null); try { sessionStorage.removeItem(KEY) } catch {} }
  const seek = (v: number) => { resumeAt.current = 0; if (audio.duration) audio.currentTime = (v / 1000) * audio.duration }
  const cycleRate = () => { const n = SPEEDS[(SPEEDS.indexOf(audio.playbackRate) + 1) % SPEEDS.length]; audio.playbackRate = n; setRate(n); save() }

  const pct = dur ? (time / dur) * 100 : 0

  return (
    <PlayerCtx.Provider value={{ current, playing, play }}>
      {children}
      <div className={'dock' + (playing ? '' : ' is-paused') + (open ? ' is-open' : '')} hidden={!current} style={{ ['--p' as any]: pct + '%' }}>
        <div className="dock-in">
          {current?.img ? <img className="dock-art" alt="" width={56} height={56} src={current.img} /> : <span className="dock-art" />}
          <div className="dock-meta">
            <a className="dock-title" href={current?.url || '#'} target="_blank" rel="noopener">{current?.title || 'Episode'}</a>
            <div className="dock-time">
              <span>{fmt(time || resumeAt.current)}</span>
              <input className="scrub" type="range" min={0} max={1000} value={Math.round(pct * 10)} aria-label="Seek"
                style={{ ['--p' as any]: pct + '%' }} onChange={(e) => seek(+e.target.value)} />
              <span>{fmt(dur)}</span>
            </div>
          </div>
          <div className="dock-ctrl">
            <button type="button" className="icon-btn" aria-label="Back 15 seconds" onClick={() => (audio.currentTime = Math.max(0, audio.currentTime - 15))}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 12a8 8 0 1 0 2.4-5.7" /><path d="M4 4v4h4" /><text x="12" y="15.6" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="currentColor" stroke="none">15</text></svg>
            </button>
            <button type="button" className="play-btn" aria-label="Play" onClick={toggle}><PlayIcons /></button>
            <button type="button" className="icon-btn" aria-label="Forward 15 seconds" onClick={() => (audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 15))}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 12a8 8 0 1 1-2.4-5.7" /><path d="M20 4v4h-4" /><text x="12" y="15.6" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="currentColor" stroke="none">15</text></svg>
            </button>
            <button type="button" className="rate" aria-label="Playback speed" onClick={cycleRate}>{rate}×</button>
            <button type="button" className="icon-btn" aria-label="Close player" onClick={close}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
        </div>
      </div>
    </PlayerCtx.Provider>
  )
}

// play affordance on episode artwork / cards
export function PlayButton({ track, className = 'ep-play' }: { track?: Track; className?: string }) {
  const { current, playing, play } = usePlayer()
  if (!track?.src) return null
  const on = current?.src === track.src && playing
  return (
    <button type="button" className={className + (on ? ' is-playing' : '')} aria-label={`Play ${track.title}`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); play(track) }}>
      <PlayIcons />
    </button>
  )
}
