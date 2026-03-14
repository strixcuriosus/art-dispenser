/**
 * A genome is an array of shape genes.
 * Each gene encodes one drawn shape.
 *
 * gene = {
 *   shape:  'circle'|'ellipse'|'rect'|'triangle'|'star'|'crescent'
 *   x, y:   normalised position [0,1]
 *   size:   normalised radius    [0,1]
 *   aspect: w/h ratio           [0.3, 2.5]
 *   rot:    rotation in radians  [0, 2π]
 *   hue:    colour hue           [0, 360)
 *   sat:    saturation %         [45, 100]
 *   lit:    lightness %          [25, 75]
 *   alpha:  opacity              [0.15, 0.95]
 *   blend:  composite operation
 *   pts:    star point count     [3, 8]
 * }
 */

const SHAPES = ['circle', 'ellipse', 'rect', 'triangle', 'star', 'crescent']
const BLENDS = ['normal', 'multiply', 'screen', 'overlay', 'soft-light', 'color-dodge']

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v))
}

export function makeGene(rng, hues) {
  const baseHue = hues[Math.floor(rng() * hues.length)]
  const hue = ((baseHue + (rng() - 0.5) * 50) % 360 + 360) % 360
  return {
    shape:  SHAPES[Math.floor(rng() * SHAPES.length)],
    x:      rng(),
    y:      rng(),
    size:   rng() * 0.38 + 0.06,
    aspect: rng() * 2.0 + 0.4,
    rot:    rng() * Math.PI * 2,
    hue,
    sat:    rng() * 40 + 55,
    lit:    rng() * 40 + 28,
    alpha:  rng() * 0.65 + 0.2,
    blend:  BLENDS[Math.floor(rng() * BLENDS.length)],
    pts:    Math.floor(rng() * 5) + 3,
  }
}

export function makeGenome(rng, hues) {
  const n = Math.floor(rng() * 10) + 12
  return Array.from({ length: n }, () => makeGene(rng, hues))
}

export function crossover(rng, a, b) {
  const len = Math.round((a.length + b.length) / 2)
  return Array.from({ length: len }, (_, i) =>
    rng() < 0.5 ? { ...a[i % a.length] } : { ...b[i % b.length] }
  )
}

export function mutate(rng, genome, rate, hues) {
  return genome.map(gene => {
    if (rng() > rate) return gene
    const g = { ...gene }
    const r = rng()
    if      (r < 0.12) g.shape  = SHAPES[Math.floor(rng() * SHAPES.length)]
    else if (r < 0.28) { g.x = clamp(g.x + (rng() - 0.5) * 0.3, 0, 1); g.y = clamp(g.y + (rng() - 0.5) * 0.3, 0, 1) }
    else if (r < 0.42) g.size   = clamp(g.size + (rng() - 0.5) * 0.15, 0.03, 0.55)
    else if (r < 0.56) g.hue    = (((hues[Math.floor(rng() * hues.length)] + (rng() - 0.5) * 60)) % 360 + 360) % 360
    else if (r < 0.68) g.alpha  = clamp(g.alpha + (rng() - 0.5) * 0.3, 0.1, 0.95)
    else if (r < 0.80) g.blend  = BLENDS[Math.floor(rng() * BLENDS.length)]
    else if (r < 0.90) g.rot    = rng() * Math.PI * 2
    else               g.aspect = clamp(g.aspect + (rng() - 0.5) * 0.6, 0.3, 2.5)
    return g
  })
}
