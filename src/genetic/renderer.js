/**
 * Renders a genome (array of genes) onto a canvas element.
 * Each gene is drawn as a layered, blended shape.
 */

function drawShape(ctx, gene, W, H) {
  const { shape, x, y, size, aspect, rot, hue, sat, lit, alpha, blend, pts } = gene
  const cx = x * W
  const cy = y * H
  const r  = size * Math.min(W, H) * 0.5

  ctx.save()
  ctx.globalAlpha            = Math.max(0.05, Math.min(1, alpha))
  ctx.globalCompositeOperation = blend
  ctx.fillStyle   = `hsl(${hue % 360}, ${sat}%, ${lit}%)`
  ctx.strokeStyle = `hsla(${(hue + 30) % 360}, ${sat * 0.7}%, ${lit * 0.55}%, 0.4)`
  ctx.lineWidth   = 0.7

  ctx.translate(cx, cy)
  ctx.rotate(rot)

  ctx.beginPath()

  switch (shape) {
    case 'circle':
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      break

    case 'ellipse':
      ctx.ellipse(0, 0, r, r * Math.max(0.2, aspect), 0, 0, Math.PI * 2)
      break

    case 'rect': {
      const hw = r * Math.max(0.2, aspect) * 0.5
      const hh = r * 0.5
      ctx.rect(-hw, -hh, hw * 2, hh * 2)
      break
    }

    case 'triangle': {
      const h = r * 0.95
      ctx.moveTo(0, -h)
      ctx.lineTo( r * 0.87,  h * 0.5)
      ctx.lineTo(-r * 0.87,  h * 0.5)
      ctx.closePath()
      break
    }

    case 'star': {
      const n = Math.max(3, Math.min(8, pts || 5))
      const inner = r * 0.42
      for (let i = 0; i < n * 2; i++) {
        const a  = (i * Math.PI / n) - Math.PI / 2
        const rr = i % 2 === 0 ? r : inner
        const px = Math.cos(a) * rr
        const py = Math.sin(a) * rr
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.closePath()
      break
    }

    case 'crescent': {
      // Draw a filled circle then punch out an offset circle
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      // Punch
      ctx.save()
      ctx.globalCompositeOperation = 'destination-out'
      ctx.globalAlpha = alpha
      ctx.translate(cx, cy)
      ctx.rotate(rot)
      ctx.beginPath()
      ctx.arc(r * 0.38, 0, r * 0.7, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      return
    }

    default:
      ctx.arc(0, 0, r, 0, Math.PI * 2)
  }

  ctx.fill()
  ctx.restore()
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {Array}             genome  – array of gene objects
 * @param {number[]}          bgHues  – two hues for background gradient (optional)
 */
export function renderGenome(canvas, genome, bgHues = null) {
  const ctx = canvas.getContext('2d')
  const W   = canvas.width
  const H   = canvas.height

  ctx.clearRect(0, 0, W, H)

  // ── Background ────────────────────────────────────────────────────────
  const [h1, h2] = bgHues && bgHues.length >= 2 ? bgHues : [250, 220]
  const bg = ctx.createRadialGradient(W * 0.4, H * 0.35, 0, W / 2, H / 2, W * 0.85)
  bg.addColorStop(0, `hsl(${h1}, 35%, 14%)`)
  bg.addColorStop(1, `hsl(${h2}, 45%, 7%)`)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // ── Shapes ────────────────────────────────────────────────────────────
  for (const gene of genome) {
    drawShape(ctx, gene, W, H)
  }

  // ── Subtle vignette ───────────────────────────────────────────────────
  const vig = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.72)
  vig.addColorStop(0, 'rgba(0,0,0,0)')
  vig.addColorStop(1, 'rgba(0,0,0,0.45)')
  ctx.globalCompositeOperation = 'multiply'
  ctx.fillStyle = vig
  ctx.fillRect(0, 0, W, H)
  ctx.globalCompositeOperation = 'source-over'
}
