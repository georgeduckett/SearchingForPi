// ─── Wallis Product Rendering ────────────────────────────────────────────────
// Canvas drawing functions for the Wallis product visualization.

import {
  getBgColor,
  getInsideColor,
  getOutsideColor,
  getAmberColor,
  getTextMutedColor,
  CANVAS_SIZE,
} from '../../colors'
import { drawDashedLine, drawText } from '../base/canvas'
import { State, MAX_FACTORS, getFactor, getTarget } from './types'

// Method-specific colors
const C_OVER = getInsideColor()
const C_UNDER = getOutsideColor()

/**
 * Draw the complete Wallis visualization - deviation bars and product indicator.
 */
export function draw(ctx: CanvasRenderingContext2D, state: State): void {
  const W = CANVAS_SIZE
  const H = CANVAS_SIZE

  ctx.fillStyle = getBgColor()
  ctx.fillRect(0, 0, W, H)

  // Reference line at π/2
  const target = getTarget()
  const maxVal = 4 // Scale for visualization
  const pad = 50
  const plotH = H - pad * 2
  const plotW = W - pad * 2
  const baseY = pad + plotH
  const scale = plotH / maxVal

  // Grid lines
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 1
  for (let i = 0; i <= 8; i++) {
    const y = pad + (plotH * i) / 8
    ctx.beginPath()
    ctx.moveTo(pad, y)
    ctx.lineTo(W - pad, y)
    ctx.stroke()
  }

  // π/2 reference line
  const piY = baseY - target * scale
  drawDashedLine(ctx, pad, piY, W - pad, piY, getAmberColor(), 2, [8, 4])

  // Label
  drawText(
    ctx,
    'π/2 ≈ 1.5708',
    W - pad - 80,
    piY - 5,
    getTextMutedColor(),
    '11px "JetBrains Mono", monospace'
  )

  // Draw bars showing deviation at each factor step
  if (state.factors > 0) {
    const barW = Math.min(4, plotW / MAX_FACTORS)
    let currentProduct = 1

    for (let n = 1; n <= state.factors; n++) {
      currentProduct *= getFactor(n)
      const x = pad + (n / MAX_FACTORS) * plotW
      const deviation = currentProduct - target
      const isOver = currentProduct > target

      // Draw bar showing deviation from target
      const barY = piY
      const barH = Math.abs(deviation) * scale * 3 // Amplify for visibility

      ctx.fillStyle = isOver ? C_OVER : C_UNDER
      ctx.globalAlpha = 0.7
      if (isOver) {
        ctx.fillRect(x - barW / 2, barY - barH, barW, barH)
      } else {
        ctx.fillRect(x - barW / 2, barY, barW, barH)
      }
      ctx.globalAlpha = 1
    }
  }

  // Current product indicator
  if (state.factors > 0) {
    const x = pad + (state.factors / MAX_FACTORS) * plotW
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x, baseY)
    ctx.lineTo(x, baseY - state.product * scale)
    ctx.stroke()

    // Dot at current value
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(x, baseY - state.product * scale, 4, 0, Math.PI * 2)
    ctx.fill()
  }

  // Axis
  ctx.strokeStyle = getTextMutedColor()
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(pad, baseY)
  ctx.lineTo(W - pad, baseY)
  ctx.stroke()

  // Y-axis
  ctx.beginPath()
  ctx.moveTo(pad, pad)
  ctx.lineTo(pad, baseY)
  ctx.stroke()
}
