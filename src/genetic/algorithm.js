import { mulberry32 } from './prng.js'
import { makeGenome, crossover, mutate } from './genome.js'

/**
 * Aesthetic fitness score for a genome.
 * Rewards: colour spread, visual balance, size variety, transparency range.
 */
function fitness(genome) {
  const n = genome.length
  if (n === 0) return 0

  // ── Hue spread ──────────────────────────────────────────────────────────
  const hues = genome.map(g => g.hue)
  const minH = Math.min(...hues), maxH = Math.max(...hues)
  const hueSpread = Math.min(1, (maxH - minH) / 120)

  // ── Visual balance (centre of mass near canvas centre) ──────────────────
  const cx = genome.reduce((s, g) => s + g.x, 0) / n
  const cy = genome.reduce((s, g) => s + g.y, 0) / n
  const balance = Math.max(0, 1 - Math.sqrt((cx - 0.5) ** 2 + (cy - 0.5) ** 2) * 3)

  // ── Size variety ────────────────────────────────────────────────────────
  const sizes = genome.map(g => g.size)
  const avgSz = sizes.reduce((a, b) => a + b, 0) / n
  const szStd = Math.sqrt(sizes.reduce((s, z) => s + (z - avgSz) ** 2, 0) / n)
  const sizeVar = Math.min(1, szStd * 9)

  // ── Alpha range ─────────────────────────────────────────────────────────
  const alphas = genome.map(g => g.alpha)
  const alphaRange = Math.min(1, (Math.max(...alphas) - Math.min(...alphas)) * 2.5)

  // ── Blend diversity ─────────────────────────────────────────────────────
  const uniqueBlends = new Set(genome.map(g => g.blend)).size
  const blendScore = Math.min(1, uniqueBlends / 4)

  return (
    hueSpread  * 0.30 +
    balance    * 0.25 +
    sizeVar    * 0.22 +
    alphaRange * 0.13 +
    blendScore * 0.10
  )
}

/**
 * Run a genetic algorithm and return the fittest genome.
 *
 * @param {number}   seed  – deterministic seed
 * @param {number[]} hues  – base hue palette from weather
 * @param {object}   opts  – { pop, gens }
 * @returns {Array}  fittest genome (array of genes)
 */
export function evolveArt(seed, hues, { pop = 22, gens = 18 } = {}) {
  const rng = mulberry32(seed)

  let population = Array.from({ length: pop }, () => makeGenome(rng, hues))

  for (let g = 0; g < gens; g++) {
    const scored = population
      .map(genome => ({ genome, score: fitness(genome) }))
      .sort((a, b) => b.score - a.score)

    const eliteCount = Math.ceil(pop * 0.35)
    const elite = scored.slice(0, eliteCount).map(s => s.genome)

    const next = [...elite]
    while (next.length < pop) {
      const p1 = elite[Math.floor(rng() * elite.length)]
      const p2 = elite[Math.floor(rng() * elite.length)]
      next.push(mutate(rng, crossover(rng, p1, p2), 0.22, hues))
    }
    population = next
  }

  return population
    .map(genome => ({ genome, score: fitness(genome) }))
    .sort((a, b) => b.score - a.score)[0].genome
}
