import { useState, useEffect, useRef, useMemo } from 'react'
import './GumballMachine.css'

const CAPSULE_COLORS = [
  '#FF6B6B', '#FF8E53', '#FFC947', '#6BCB77',
  '#56CFE1', '#A855F7', '#EC4899', '#06B6D4',
  '#F97316', '#10B981', '#8B5CF6', '#F43F5E',
  '#FBBF24', '#34D399', '#60A5FA', '#E879F9',
]

function useTick(fps = 30) {
  const [t, setT] = useState(0)
  const rafRef = useRef(null)
  useEffect(() => {
    let last = 0
    const step = (ts) => {
      if (ts - last > 1000 / fps) {
        setT(ts * 0.001)
        last = ts
      }
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [fps])
  return t
}

/** Stable capsule positions generated once per mount */
function useCapsules(count = 20) {
  return useMemo(() => {
    const caps = []
    // Use a deterministic layout so SSR/hydration is stable
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2
      const jitter = (((i * 7 + 3) % 11) - 5) / 5
      const rx = 52 + ((i * 13) % 25)
      const ry = rx * 0.62
      caps.push({
        cx: 150 + Math.cos(a + jitter * 0.4) * rx,
        cy: 128 + Math.sin(a + jitter * 0.3) * ry,
        r:  9 + (i % 5) * 2.2,
        color: CAPSULE_COLORS[i % CAPSULE_COLORS.length],
        bobAmp:   3 + (i % 4),
        bobSpeed: 1.4 + (i % 7) * 0.2,
        bobOff:   (i * 1.3) % (Math.PI * 2),
      })
    }
    return caps
  }, [count])
}

export default function GumballMachine({ weather, onDispense, dispensing, count }) {
  const t        = useTick(24)
  const capsules = useCapsules(20)
  const [leverTilt, setLeverTilt] = useState(0)

  // Weather-driven dome tint hue
  const temp     = weather?.temperature ?? 18
  const clouds   = weather?.cloudCover  ?? 30
  const tintHue  = temp > 22 ? 38 : temp > 10 ? 170 : 215
  const tintSat  = clouds > 60 ? 22 : 65

  const handleKnob = () => {
    if (dispensing) return
    setLeverTilt(-35)
    setTimeout(() => setLeverTilt(0), 420)
    onDispense()
  }

  // Which capsule colour drops out
  const dropColor = CAPSULE_COLORS[count % CAPSULE_COLORS.length]

  return (
    <div className="gumball-machine">
      <svg
        viewBox="0 0 300 470"
        xmlns="http://www.w3.org/2000/svg"
        className={`machine-svg${dispensing ? ' machine-shaking' : ''}`}
        aria-label="Art Dispenser gumball machine"
        role="img"
      >
        <defs>
          <radialGradient id="domeGrad" cx="38%" cy="32%" r="65%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.55)" />
            <stop offset="40%"  stopColor={`hsla(${tintHue},${tintSat}%,85%,0.22)`} />
            <stop offset="100%" stopColor={`hsla(${tintHue},${tintSat}%,70%,0.08)`} />
          </radialGradient>

          <radialGradient id="bodyGrad" cx="30%" cy="25%" r="75%">
            <stop offset="0%"   stopColor="#f2f2f8" />
            <stop offset="100%" stopColor="#c8c8d8" />
          </radialGradient>

          <linearGradient id="ringGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#e5e5ee" />
            <stop offset="100%" stopColor="#b5b5c5" />
          </linearGradient>

          <filter id="machineShadow" x="-15%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="2" dy="8" stdDeviation="10" floodColor="#00000030" />
          </filter>

          <filter id="glowFilter" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>

          <clipPath id="domeClip">
            <circle cx="150" cy="128" r="111" />
          </clipPath>
        </defs>

        {/* ── Floor shadow ────────────────────────────────────────── */}
        <ellipse cx="150" cy="452" rx="92" ry="11" fill="rgba(0,0,0,0.18)" />

        {/* ── Feet ────────────────────────────────────────────────── */}
        <rect x="95"  y="410" width="32" height="34" rx="9" fill="#b2b2c2" />
        <rect x="173" y="410" width="32" height="34" rx="9" fill="#b2b2c2" />
        <rect x="80"  y="420" width="140" height="22" rx="7" fill="#c5c5d5" />

        {/* ── Machine body ─────────────────────────────────────────── */}
        <rect
          x="58" y="238" width="184" height="182" rx="22"
          fill="url(#bodyGrad)" stroke="#bbbbc8" strokeWidth="2"
          filter="url(#machineShadow)"
        />

        {/* inner panel */}
        <rect x="78" y="252" width="144" height="110" rx="14"
          fill="rgba(255,255,255,0.32)" stroke="rgba(180,180,200,0.4)" strokeWidth="1" />

        {/* label */}
        <text x="150" y="280" textAnchor="middle"
          fontFamily="'Segoe UI', system-ui, sans-serif" fontSize="14"
          fontWeight="800" fill="#5a3d9a" letterSpacing="3">
          ✦ ART ✦
        </text>
        <text x="150" y="298" textAnchor="middle"
          fontFamily="'Segoe UI', system-ui, sans-serif" fontSize="9"
          fontWeight="600" fill="#8870b8" letterSpacing="4">
          DISPENSER
        </text>

        {/* piece counter */}
        {count > 0 && (
          <text x="150" y="328" textAnchor="middle"
            fontFamily="monospace" fontSize="10" fill="#7060a8">
            #{count} dispensed
          </text>
        )}

        {/* decorative coin slot */}
        <rect x="122" y="350" width="56" height="8" rx="4" fill="#9898a8" />
        <text x="150" y="368" textAnchor="middle"
          fontFamily="system-ui" fontSize="7.5" fill="#9898a8" letterSpacing="1">
          COIN SLOT
        </text>

        {/* chute opening */}
        <rect x="112" y="388" width="76" height="24" rx="9" fill="#a5a5b5" stroke="#9090a0" strokeWidth="1" />
        <rect x="118" y="393" width="64" height="14" rx="5" fill="#808090" />

        {/* ── Ring connector ───────────────────────────────────────── */}
        <rect x="53" y="231" width="194" height="23" rx="9"
          fill="url(#ringGrad)" stroke="#b8b8c8" strokeWidth="1.5" />

        {/* ── Dome background (behind capsules) ────────────────────── */}
        <circle cx="150" cy="128" r="114"
          fill={`hsl(${tintHue}, 22%, 93%)`} opacity="0.55" />

        {/* ── Bobbing capsules ─────────────────────────────────────── */}
        <g clipPath="url(#domeClip)">
          {capsules.map((cap, i) => {
            const bob = Math.sin(t * cap.bobSpeed + cap.bobOff) * cap.bobAmp
            return (
              <g key={i} transform={`translate(0,${bob})`}>
                <circle cx={cap.cx} cy={cap.cy} r={cap.r}
                  fill={cap.color} opacity={0.88} />
                {/* shine */}
                <circle
                  cx={cap.cx - cap.r * 0.27} cy={cap.cy - cap.r * 0.29}
                  r={cap.r * 0.27} fill="rgba(255,255,255,0.45)" />
              </g>
            )
          })}
        </g>

        {/* ── Glass dome overlay ───────────────────────────────────── */}
        <circle cx="150" cy="128" r="114"
          fill="url(#domeGrad)"
          stroke="rgba(200,200,225,0.55)" strokeWidth="2.5" />

        {/* dome shine highlights */}
        <ellipse cx="108" cy="76" rx="40" ry="23"
          fill="rgba(255,255,255,0.32)" transform="rotate(-25,108,76)" />
        <ellipse cx="105" cy="74" rx="17" ry="9"
          fill="rgba(255,255,255,0.52)" transform="rotate(-25,105,74)" />

        {/* ── Dome cap ─────────────────────────────────────────────── */}
        <ellipse cx="150" cy="17" rx="30" ry="9" fill="#d0d0e0" stroke="#b8b8c8" strokeWidth="1" />
        <circle  cx="150" cy="11" r="7"  fill="#c5c5d5" stroke="#a8a8b8" strokeWidth="1" />
        <circle  cx="150" cy="11" r="3"  fill="#e5e5f0" />

        {/* ── Lever bracket ────────────────────────────────────────── */}
        <rect x="235" y="278" width="26" height="28" rx="6" fill="#b8b8c8" />

        {/* ── Lever / knob (interactive) ───────────────────────────── */}
        <g
          className={`machine-lever${dispensing ? ' lever-disabled' : ''}`}
          transform={`translate(253,294) rotate(${leverTilt})`}
          onClick={handleKnob}
          style={{ cursor: dispensing ? 'not-allowed' : 'pointer' }}
          role="button"
          aria-label="Turn knob to dispense art"
          tabIndex={0}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleKnob()}
        >
          {/* arm */}
          <rect x="-7" y="-28" width="14" height="32" rx="7" fill="#e74c3c" />
          {/* knob ball */}
          <circle cx="0" cy="-28" r="13" fill="#c0392b" stroke="#8e1f1f" strokeWidth="1.5" />
          <circle cx="-4" cy="-33"  r="4.5" fill="rgba(255,255,255,0.32)" />
          <text x="0" y="14" textAnchor="middle"
            fontFamily="system-ui" fontSize="7" fill="rgba(255,255,255,0.75)"
            pointerEvents="none">
            TURN
          </text>
        </g>

        {/* ── Dropping capsule animation ───────────────────────────── */}
        {dispensing && (
          <circle
            cx="150" cy="370"
            r="15"
            fill={dropColor}
            className="capsule-dropping"
          />
        )}
      </svg>

      {/* ── Big accessible dispense button ──────────────────────────── */}
      <button
        className={`dispense-btn${dispensing ? ' dispense-btn--busy' : ''}`}
        onClick={handleKnob}
        disabled={dispensing}
        aria-live="polite"
      >
        {dispensing ? '✨ Evolving your art…' : '🎰 Turn for Mini Art'}
      </button>
    </div>
  )
}
