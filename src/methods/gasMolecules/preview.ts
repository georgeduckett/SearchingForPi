// ─── Gas Molecules Preview ───────────────────────────────────────────────────
// Preview renderer for the home page.

import { getBgColor, getBorderColor, PREVIEW_SIZE } from '../../colors'

// ─── Preview State ────────────────────────────────────────────────────────────
interface PreviewParticle {
  x: number
  y: number
  vx: number
  vy: number
}

const previewParticles: PreviewParticle[] = []
let previewInitialized = false

function initPreviewParticles(): void {
  if (previewInitialized) return
  previewInitialized = true

  const s = PREVIEW_SIZE
  const margin = 15
  const radius = 4

  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 1 + Math.random() * 1.5
    previewParticles.push({
      x: margin + radius + Math.random() * (s - margin * 2 - radius * 2),
      y: margin + radius + Math.random() * (s - margin * 2 - radius * 2),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    })
  }
}

/**
 * Draw animated gas molecules preview for the home page.
 */
export function drawPreview(ctx: CanvasRenderingContext2D, _time: number): void {
  initPreviewParticles()

  const s = PREVIEW_SIZE
  const margin = 5
  const radius = 4
  const innerMargin = margin + radius

  ctx.fillStyle = getBgColor()
  ctx.fillRect(0, 0, s, s)

  ctx.strokeStyle = getBorderColor()
  ctx.lineWidth = 1
  ctx.strokeRect(margin, margin, s - margin * 2, s - margin * 2)

  // Update and draw particles with physics
  for (const p of previewParticles) {
    // Update position
    p.x += p.vx
    p.y += p.vy

    // Bounce off walls (elastic collision)
    if (p.x < innerMargin) {
      p.x = innerMargin
      p.vx = Math.abs(p.vx)
    } else if (p.x > s - innerMargin) {
      p.x = s - innerMargin
      p.vx = -Math.abs(p.vx)
    }
    if (p.y < innerMargin) {
      p.y = innerMargin
      p.vy = Math.abs(p.vy)
    } else if (p.y > s - innerMargin) {
      p.y = s - innerMargin
      p.vy = -Math.abs(p.vy)
    }

    // Draw particle with velocity-based coloring (same as main simulation)
    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
    const maxSpeed = 3
    const normalizedSpeed = Math.min(speed / maxSpeed, 1)
    const hue = 200 - normalizedSpeed * 60
    ctx.fillStyle = `hsl(${hue}, 70%, 55%)`

    ctx.beginPath()
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
    ctx.fill()
  }
}
