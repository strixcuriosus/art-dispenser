/**
 * Inspiring messages selected based on current weather mood.
 * Each message is short, warm, and positive.
 */

const SUNNY = [
  "Today has your name written all over it. ☀️",
  "The sun woke up early just for this. 🌻",
  "Warmth is the universe saying: keep going. ✨",
  "Your light is contagious — keep shining. 💛",
  "Bright days are proof the world is on your side. 🌸",
  "Something good is gathering momentum right now. 🌟",
  "You were made for days exactly like this. 🌈",
]

const CLOUDY = [
  "Quiet skies hold the most interesting thoughts. 🌤️",
  "Silver light makes the colours inside you brighter. 🎨",
  "Mystery is just wonder in a softer coat. 💭",
  "The best things often arrive gently. 🌫️",
  "You're exactly where you're meant to be. 🌙",
  "Texture is what makes a painting interesting. ☁️",
  "Cool days were made for warm ideas. 🫶",
]

const RAINY = [
  "Rain is the sky writing love letters to the earth. 🌧️",
  "Every drop carries a little bit of ocean memory. 💧",
  "Puddles are portals if you look at them right. 🌊",
  "Growing days look exactly like this. 🌱",
  "There's magic in wet pavement and warm light. ✨",
  "The earth is singing in a minor key today. 🎵",
  "Petrichor is the smell of possibility. 🌿",
]

const SNOWY = [
  "The world just hit pause to show you something beautiful. ❄️",
  "Every snowflake is a one-of-a-kind like you. 🌨️",
  "Stillness is not emptiness — it's full of potential. 🤍",
  "Cold outside just means warmer inside. 🔥",
  "The softest days grow the deepest roots. 🌲",
]

const UNIVERSAL = [
  "This piece exists because you do. 🌟",
  "Art is just attention turned into something you can keep. 👁️",
  "Each moment is a limited edition — collect them all. 🎁",
  "The universe conspired to make exactly this. ⚡",
  "Rare things find the people who look for them. 💎",
  "Creativity is joy that didn't know where else to go. 🎨",
  "You found this. Keep finding things. 🔍",
  "Some things only make sense when you step back and smile. 😊",
  "Your unique vision matters more than you know. 🌈",
  "Something beautiful just happened. Notice it. 🌟",
  "The world gets a little better every time someone makes something. 🛠️",
  "You are the rare intersection of right now and right here. ✨",
]

/**
 * Pick a message appropriate for the given weather object.
 * Uses a tiny seed from the current minute so it feels fresh each time.
 */
export function pickMessage(weather) {
  const { precipitation, cloudCover, temperature, weatherCode } = weather

  const isSnow  = weatherCode >= 71 && weatherCode <= 77
  const isRain  = precipitation > 0.3 || (weatherCode >= 51 && weatherCode <= 82 && !isSnow)
  const isCloudy = cloudCover > 62 && !isRain && !isSnow
  const isSunny  = cloudCover < 28 && !isRain && !isSnow

  let mood
  if      (isSnow)   mood = SNOWY
  else if (isRain)   mood = RAINY
  else if (isCloudy) mood = CLOUDY
  else if (isSunny)  mood = SUNNY
  else               mood = UNIVERSAL

  // Mix in universals for variety
  const pool = [...mood, ...UNIVERSAL, ...UNIVERSAL]

  // Seed with minute so you get a fresh one each time but it's deterministic
  const minuteSeed = Math.floor(Date.now() / 60000)
  const idx = minuteSeed % pool.length
  return pool[idx]
}
