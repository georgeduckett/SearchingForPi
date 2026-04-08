// ─── Circle Packing Preview ──────────────────────────────────────────────────
// Preview renderer for the home page card.

import { getBgColor, getInsideColor, PREVIEW_SIZE } from '../../colors'
import { clearCanvas } from '../base/canvas'

// ─── Preview State ───────────────────────────────────────────────────────────
let previewCircles: { x: number; y: number; r: number }[] = []
let previewCycleStart = -1

// ─── Preview Constants ───────────────────────────────────────────────────────
const PADDING = 8
const MIN_R = 4
const MAX_R = 10
const CYCLE_DURATION = 8 // seconds for full animation cycle
const MAX_CIRCLES = 20

/**
 * Draw the preview animation for the circle packing method.
 * Shows circles being progressively placed with fade-in effect.
 */
export function drawPreview(ctx: CanvasRenderingContext2D, time: number): void {
  const s = PREVIEW_SIZE
  clearCanvas(ctx, s, s)

  // Start new cycle every CYCLE_DURATION seconds
  const currentCycle = Math.floor(time / CYCLE_DURATION)
  if (currentCycle !== previewCycleStart) {
    previewCycleStart = currentCycle
    previewCircles = []

    // Pre-generate all circles for this cycle
    const tempCircles: { x: number; y: number; r: number }[] = []
    for (let attempt = 0; attempt < 200 && tempCircles.length < MAX_CIRCLES; attempt++) {
      const r = MIN_R + Math.random() * (MAX_R - MIN_R)
      const x = PADDING + r + Math.random() * (s - 2 * PADDING - 2 * r)
      const y = PADDING + r + Math.random() * (s - 2 * PADDING - 2 * r)

      // Check for overlap
      let overlaps = false
      for (const c of tempCircles) {
        const dx = x - c.x
        const dy = y - c.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < r + c.r + 1) {
          overlaps = true
          break
        }
      }

      if (!overlaps) {
        tempCircles.push({ x, y, r })
      }
    }
    previewCircles = tempCircles
  }

  // Calculate how many circles to show based on time in cycle
  const timeInCycle = time % CYCLE_DURATION
  const circleAddInterval = CYCLE_DURATION / MAX_CIRCLES
  const circlesToShow = Math.min(Math.floor(timeInCycle / circleAddInterval), previewCircles.length)

  // Draw background
  ctx.fillStyle = getBgColor()
  ctx.fillRect(0, 0, s, s)

  // Draw circles progressively with fade-in
  for (let i = 0; i < circlesToShow; i++) {
    const circle = previewCircles[i]
    const timeSinceAdded = timeInCycle - (i + 1) * circleAddInterval
    const fadeInProgress = Math.min(1, timeSinceAdded * 4) // Quick fade over 0.25 seconds

    ctx.fillStyle = getInsideColor()
    ctx.globalAlpha = 0.2 + 0.1 * fadeInProgress
    ctx.beginPath()
    ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = getInsideColor()
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.5 + 0.3 * fadeInProgress
    ctx.stroke()
  }

  ctx.globalAlpha = 1
}
