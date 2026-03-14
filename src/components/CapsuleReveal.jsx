import { useState, useEffect, useRef, useMemo } from 'react'
import { renderGenome } from '../genetic/renderer.js'
import { describeWeather } from '../data/weather.js'
import './CapsuleReveal.css'

const CAPSULE_COLORS = [
  '#FF6B6B', '#FF8E53', '#FFC947', '#6BCB77',
  '#56CFE1', '#A855F7', '#EC4899', '#06B6D4',
  '#F97316', '#10B981', '#8B5CF6', '#F43F5E',
  '#FBBF24', '#34D399', '#60A5FA', '#E879F9',
]

// Phases: 'falling' → 'landed' → 'cracking' → 'open'
const PHASE_TIMINGS = { landed: 650, cracking: 1100, open: 1750 }

/** Deterministic sparkle positions so render is stable. */
function useSparkles(n = 28) {
  return useMemo(() => (
    Array.from({ length: n }, (_, i) => ({
      left:  `${((i * 37 + 11) % 97)}%`,
      top:   `${((i * 53 +  7) % 93)}%`,
      delay: `${((i * 0.38) % 3).toFixed(2)}s`,
      size:  2 + (i % 4),
      drift: ((i % 3) - 1) * 30,
    }))
  ), [n])
}

export default function CapsuleReveal({ genome, message, weather, onAnother, pieceNumber, hues }) {
  const canvasRef = useRef(null)
  const [phase, setPhase]     = useState('falling')
  const [copied, setCopied]   = useState(false)
  const sparkles = useSparkles(28)

  const capsuleColor = CAPSULE_COLORS[(pieceNumber - 1) % CAPSULE_COLORS.length]
  const capsuleColorDark = capsuleColor + 'bb'   // slightly transparent for bottom half

  const wx = weather ? describeWeather(weather) : null

  // Advance through phases
  useEffect(() => {
    const timers = Object.entries(PHASE_TIMINGS).map(([p, ms]) =>
      setTimeout(() => setPhase(p), ms)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  // Render genome onto canvas once we reach 'open'
  useEffect(() => {
    if (phase === 'open' && canvasRef.current && genome) {
      renderGenome(canvasRef.current, genome, hues)
    }
  }, [phase, genome, hues])

  const handleSave = () => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = `mini-art-${pieceNumber}.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }

  const handleCopy = async () => {
    if (!canvasRef.current) return
    try {
      canvasRef.current.toBlob(async (blob) => {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        setCopied(true)
        setTimeout(() => setCopied(false), 2200)
      })
    } catch { /* ignore permission errors */ }
  }

  const bgHue = weather
    ? (weather.temperature > 20 ? 35 : weather.temperature > 10 ? 260 : 220)
    : 260

  return (
    <div className={`capsule-reveal phase-${phase}`} style={{ '--bg-hue': bgHue, '--cap-color': capsuleColor }}>

      {/* ── Sparkle background ────────────────────────────────────── */}
      <div className="sparkle-field" aria-hidden="true">
        {sparkles.map((s, i) => (
          <div
            key={i}
            className="sparkle"
            style={{
              left:            s.left,
              top:             s.top,
              width:           `${s.size}px`,
              height:          `${s.size}px`,
              animationDelay:  s.delay,
              '--drift':       `${s.drift}px`,
            }}
          />
        ))}
      </div>

      {/* ── Capsule ───────────────────────────────────────────────── */}
      <div className="capsule-wrap">

        {/* Top half */}
        <div
          className="capsule-half cap-top"
          style={{ background: `linear-gradient(135deg, ${capsuleColor}ee, ${capsuleColor}99)` }}
        >
          <div className="cap-shine cap-shine--top" />
        </div>

        {/* Art canvas — visible only once open */}
        <div className={`art-window${phase === 'open' ? ' art-window--open' : ''}`}>
          <canvas
            ref={canvasRef}
            width={220}
            height={220}
            className="mini-art-canvas"
            aria-label={`Unique mini art piece #${pieceNumber}`}
          />
          <div
            className="art-glow"
            style={{ background: `radial-gradient(circle, ${capsuleColor}55, transparent 70%)` }}
          />
        </div>

        {/* Bottom half */}
        <div
          className="capsule-half cap-bottom"
          style={{ background: `linear-gradient(135deg, ${capsuleColorDark}, ${capsuleColor}66)` }}
        >
          <div className="cap-shine cap-shine--bottom" />
        </div>
      </div>

      {/* ── Message ───────────────────────────────────────────────── */}
      <div className={`reveal-message${phase === 'open' ? ' reveal-message--visible' : ''}`}>
        <p className="message-text">{message}</p>
        {wx && (
          <p className="weather-credit">
            Evolved from today's {wx.emoji} {wx.label}
            {weather.city ? ` in ${weather.city}` : ''}
            {' '}· {Math.round(weather.temperature)}°C
          </p>
        )}
      </div>

      {/* ── Piece badge ───────────────────────────────────────────── */}
      {phase === 'open' && (
        <div className="piece-badge">
          <span className="badge-label">Mini Art</span>
          <span className="badge-num">#{pieceNumber}</span>
          <span className="badge-tag">1 of 1</span>
        </div>
      )}

      {/* ── Actions ───────────────────────────────────────────────── */}
      <div className={`reveal-actions${phase === 'open' ? ' reveal-actions--visible' : ''}`}>
        <button className="action-btn action-btn--primary" onClick={onAnother}>
          🎰 Dispense Another
        </button>
        <div className="action-row">
          <button className="action-btn action-btn--ghost" onClick={handleSave} title="Download PNG">
            ⬇ Save
          </button>
          <button className="action-btn action-btn--ghost" onClick={handleCopy} title="Copy to clipboard">
            {copied ? '✓ Copied!' : '⧉ Copy'}
          </button>
        </div>
      </div>

    </div>
  )
}
