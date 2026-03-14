/**
 * Fetches live weather from Open-Meteo (free, no API key).
 * Tries IP geolocation first, falls back to Paris.
 *
 * Weather fields are used to:
 *   • seed the genetic algorithm (temperature + wind → deterministic hash)
 *   • derive a colour palette   (temperature → hue, clouds → saturation)
 *   • pick an inspiring message (rain / clouds / sun)
 */

const FALLBACK = {
  temperature: 18,
  windSpeed:   8,
  cloudCover:  30,
  humidity:    55,
  precipitation: 0,
  weatherCode: 1,
  lat: 48.85,
  lon: 2.35,
  city: 'Somewhere nice',
}

async function getLocation() {
  try {
    const res = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(3500),
    })
    if (!res.ok) return null
    const d = await res.json()
    if (d.latitude && d.longitude) {
      return { lat: d.latitude, lon: d.longitude, city: d.city || '' }
    }
  } catch { /* ignore */ }
  return null
}

export async function fetchWeather() {
  try {
    const loc = await getLocation()
    const lat  = loc?.lat  ?? FALLBACK.lat
    const lon  = loc?.lon  ?? FALLBACK.lon
    const city = loc?.city ?? FALLBACK.city

    const params = [
      'temperature_2m',
      'wind_speed_10m',
      'cloud_cover',
      'relative_humidity_2m',
      'precipitation',
      'weather_code',
    ].join(',')

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=${params}`
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) throw new Error('weather API error')

    const json = await res.json()
    const c    = json.current

    return {
      temperature:   c.temperature_2m   ?? FALLBACK.temperature,
      windSpeed:     c.wind_speed_10m   ?? FALLBACK.windSpeed,
      cloudCover:    c.cloud_cover      ?? FALLBACK.cloudCover,
      humidity:      c.relative_humidity_2m ?? FALLBACK.humidity,
      precipitation: c.precipitation    ?? 0,
      weatherCode:   c.weather_code     ?? 1,
      lat, lon, city,
    }
  } catch {
    return FALLBACK
  }
}

/**
 * Derives a 5-hue palette from weather.
 * Temperature maps to base hue (cold=blue, warm=orange/red).
 * Wind speed adds harmonic spread.
 */
export function getHuePalette(weather) {
  const { temperature, cloudCover, windSpeed } = weather

  // Normalise temperature roughly -15°C → 40°C → 0→1
  const t = Math.max(0, Math.min(1, (temperature + 15) / 55))
  // cold=ice-blue(200) → mild=teal(160) → warm=amber(40) → hot=red(5)
  const baseHue = 200 - t * 195

  // Wind creates complementary spread
  const spread = Math.min(80, windSpeed * 3 + 18)

  // Clouds add a moody violet undertone
  const cloudHue = cloudCover > 55 ? 270 : (baseHue + 60) % 360

  return [
    Math.round(((baseHue         ) % 360 + 360) % 360),
    Math.round(((baseHue + spread) % 360 + 360) % 360),
    Math.round(((baseHue - spread) % 360 + 360) % 360),
    Math.round(((baseHue + 180  ) % 360 + 360) % 360),
    Math.round((cloudHue          % 360 + 360) % 360),
  ]
}

/**
 * Produces a deterministic uint32 seed from weather + a counter.
 * Same weather + same counter → same art every time (reproducible).
 */
export function getSeed(weather, counter = 0) {
  const now = new Date()
  const key = [
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    Math.round(weather.temperature),
    Math.round(weather.windSpeed),
    Math.round(weather.cloudCover),
    counter,
  ].join('-')

  let h = 0x811c9dc5
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h  = (h * 0x01000193) >>> 0
  }
  return h
}

/** Returns a human-readable weather description + emoji. */
export function describeWeather(weather) {
  const code = weather.weatherCode
  if (code === 0)               return { emoji: '☀️',  label: 'Clear' }
  if (code <= 3)                return { emoji: '⛅',  label: 'Partly cloudy' }
  if (code <= 48)               return { emoji: '🌫️', label: 'Foggy' }
  if (code <= 57)               return { emoji: '🌦️', label: 'Drizzle' }
  if (code <= 67)               return { emoji: '🌧️', label: 'Rainy' }
  if (code <= 77)               return { emoji: '❄️',  label: 'Snowy' }
  if (code <= 82)               return { emoji: '🌦️', label: 'Rain showers' }
  if (code <= 99)               return { emoji: '⛈️', label: 'Stormy' }
  return                               { emoji: '🌤️', label: 'Mixed' }
}
