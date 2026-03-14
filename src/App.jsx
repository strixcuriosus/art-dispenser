import { useState, useEffect } from 'react'
import GumballMachine from './components/GumballMachine.jsx'
import CapsuleReveal  from './components/CapsuleReveal.jsx'
import { fetchWeather, getHuePalette, getSeed, describeWeather } from './data/weather.js'
import { pickMessage } from './data/messages.js'
import { evolveArt }   from './genetic/algorithm.js'

export default function App() {
  const [weather,    setWeather]    = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [dispensing, setDispensing] = useState(false)
  const [artPiece,   setArtPiece]   = useState(null)   // { genome, message, hues }
  const [count,      setCount]      = useState(0)

  useEffect(() => {
    fetchWeather().then(w => {
      setWeather(w)
      setLoading(false)
    })
  }, [])

  const handleDispense = () => {
    if (dispensing || !weather) return
    setDispensing(true)

    const hues    = getHuePalette(weather)
    const seed    = getSeed(weather, count)
    const genome  = evolveArt(seed, hues)
    const message = pickMessage(weather)

    const next = count + 1
    setCount(next)

    // Brief pause so the machine shake animation has time to play
    setTimeout(() => {
      setArtPiece({ genome, message, hues, pieceNumber: next })
      setDispensing(false)
    }, 950)
  }

  const handleAnother = () => {
    setArtPiece(null)
  }

  const wx = weather ? describeWeather(weather) : null

  if (artPiece) {
    return (
      <CapsuleReveal
        genome={artPiece.genome}
        message={artPiece.message}
        hues={artPiece.hues}
        weather={weather}
        onAnother={handleAnother}
        pieceNumber={artPiece.pieceNumber}
      />
    )
  }

  return (
    <div className="app">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="app-header">
        <h1 className="app-title">✨ Art Dispenser</h1>
        <p className="app-sub">Genetic mini art · freshly evolved from the world around you</p>

        {wx && (
          <div className="weather-chip">
            <span className="weather-emoji">{wx.emoji}</span>
            <span className="weather-label">
              {wx.label} · {Math.round(weather.temperature)}°C
              {weather.city ? ` · ${weather.city}` : ''}
            </span>
          </div>
        )}
      </header>

      {/* ── Main ───────────────────────────────────────────────── */}
      <main className="app-main">
        {loading ? (
          <div className="loading-state">
            <div className="loading-orb" />
            <p className="loading-text">Tuning into the world's frequency…</p>
          </div>
        ) : (
          <GumballMachine
            weather={weather}
            onDispense={handleDispense}
            dispensing={dispensing}
            count={count}
          />
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      {!loading && (
        <footer className="app-footer">
          {count === 0
            ? 'Each piece is unique — evolved just for right now.'
            : `${count} piece${count !== 1 ? 's' : ''} dispensed this session`}
        </footer>
      )}
    </div>
  )
}
