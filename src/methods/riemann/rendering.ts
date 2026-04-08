// ─── Riemann Rendering ───────────────────────────────────────────────────────
// Canvas drawing functions for the Riemann integral visualization.

import {
  getBgColor,
  getGridColor,
  getInsideColor,
  getAmberColor,
  getTextMutedColor,
  CANVAS_SIZE,
} from '../../colors'
import { State, f } from './types'

/**
 * Draw the complete Riemann integral visualization.
 */
export function draw(ctx: CanvasRenderingContext2D, state: State): void {
  const W = CANVAS_SIZE
  const H = CANVAS_SIZE
  const pad = 40
  const plotW = W - pad * 2
  const plotH = H - pad * 2

  ctx.fillStyle = getBgColor()
  ctx.fillRect(0, 0, W, H)

  // Grid
  ctx.strokeStyle = getGridColor()
  ctx.lineWidth = 1
  for (let i = 0; i <= 10; i++) {
    const x = pad + (plotW * i) / 10
    const y = pad + (plotH * i) / 10
    ctx.beginPath()
    ctx.moveTo(x, pad)
    ctx.lineTo(x, H - pad)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(pad, y)
    ctx.lineTo(W - pad, y)
    ctx.stroke()
  }

  // Draw rectangles (Riemann sum)
  if (state.rects > 0) {
    const n = state.rects
    const dx = 1 / n
    ctx.fillStyle = getInsideColor()
    ctx.globalAlpha = 0.6

    for (let i = 0; i < n; i++) {
      const x0 = i * dx
      const y = f(x0) // left endpoint
      const screenX = pad + x0 * plotW
      const screenW = dx * plotW
      const screenH = (y / 4) * plotH
      ctx.fillRect(screenX, H - pad - screenH, screenW, screenH)
    }
    ctx.globalAlpha = 1
  }

  // Draw the curve
  ctx.strokeStyle = getAmberColor()
  ctx.lineWidth = 2.5
  ctx.beginPath()
  for (let i = 0; i <= plotW; i++) {
    const x = i / plotW
    const y = f(x)
    const screenX = pad + i
    const screenY = H - pad - (y / 4) * plotH
    if (i === 0) ctx.moveTo(screenX, screenY)
    else ctx.lineTo(screenX, screenY)
  }
  ctx.stroke()

  // Axes
  ctx.strokeStyle = getTextMutedColor()
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(pad, pad)
  ctx.lineTo(pad, H - pad)
  ctx.lineTo(W - pad, H - pad)
  ctx.stroke()

  // Labels
  ctx.fillStyle = getTextMutedColor()
  ctx.font = '12px "JetBrains Mono", monospace'
  ctx.fillText('0', pad - 12, H - pad + 15)
  ctx.fillText('1', W - pad - 5, H - pad + 15)
  ctx.fillText('4', pad - 20, pad + 5)
  ctx.fillText('y = 4/(1+x²)', W - pad - 95, pad + 20)
}
