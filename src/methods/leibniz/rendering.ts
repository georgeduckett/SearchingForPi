// ─── Leibniz Series Rendering ────────────────────────────────────────────────
// Canvas drawing functions for the Leibniz series visualization.

import { C_BG, C_GRID, C_INSIDE, C_OUTSIDE, C_AMBER, C_TEXT_MUTED, C_BORDER } from '../../colors'
import { drawDashedLine } from '../base/canvas'
import { State, CANVAS_W, CANVAS_H } from './types'
import { leibnizTerm } from './series'

// Method-specific colors (using shared with local aliases)
const C_PLUS = C_INSIDE
const C_MINUS = C_OUTSIDE
const C_TEXT = C_TEXT_MUTED
const C_ZERO = C_BORDER

/**
 * Draw the complete Leibniz series visualization.
 */
export function draw(ctx: CanvasRenderingContext2D, state: State): void {
  const W = CANVAS_W
  const H = CANVAS_H
  ctx.fillStyle = C_BG
  ctx.fillRect(0, 0, W, H)

  const n = state.terms.length
  if (n === 0) {
    // Just a zero line
    ctx.strokeStyle = C_ZERO
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, H / 2)
    ctx.lineTo(W, H / 2)
    ctx.stroke()
    return
  }

  // Determine visible window
  const visible = Math.min(n, 80)
  const startIdx = Math.max(0, n - visible)
  const barW = W / visible
  const midY = H / 2

  // Grid lines at π and -π reference
  ctx.strokeStyle = C_GRID
  ctx.lineWidth = 1
  ;[0.25, 0.5, 0.75, 1].forEach(f => {
    ctx.beginPath()
    ctx.moveTo(0, H * f)
    ctx.lineTo(W, H * f)
    ctx.stroke()
  })

  // Zero line
  ctx.strokeStyle = C_ZERO
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(0, midY)
  ctx.lineTo(W, midY)
  ctx.stroke()

  // Draw bars for each term's contribution
  const scale = H * 0.4
  for (let i = 0; i < visible; i++) {
    const idx = startIdx + i
    if (idx === 0) continue
    const term = leibnizTerm(idx)
    const isPos = term > 0
    const barH = Math.abs(term) * scale * 10

    ctx.fillStyle = isPos ? C_PLUS : C_MINUS
    ctx.globalAlpha = 0.5
    const x = i * barW
    if (isPos) {
      ctx.fillRect(x, midY - barH, barW - 1, barH)
    } else {
      ctx.fillRect(x, midY, barW - 1, barH)
    }
  }
  ctx.globalAlpha = 1

  // Draw the running π estimate as a line
  ctx.strokeStyle = C_AMBER
  ctx.lineWidth = 2
  ctx.beginPath()
  const piScale = (H * 0.4) / Math.PI

  for (let i = 0; i < visible; i++) {
    const idx = startIdx + i
    const piEst = state.terms[idx]
    const y = midY - (piEst - Math.PI) * piScale * 6
    if (i === 0) ctx.moveTo(i * barW, y)
    else ctx.lineTo(i * barW + barW / 2, y)
  }
  ctx.stroke()

  // True π line
  ctx.globalAlpha = 0.2
  drawDashedLine(ctx, 0, midY, W, midY, C_AMBER, 1, [6, 4])
  ctx.globalAlpha = 1

  // Axis labels
  ctx.fillStyle = C_TEXT
  ctx.font = '10px "JetBrains Mono", monospace'
  ctx.fillText(`n = ${startIdx}`, 8, H - 8)
  ctx.fillText(`n = ${n - 1}`, W - 50, H - 8)
}
