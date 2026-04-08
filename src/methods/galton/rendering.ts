// ─── Galton Board Rendering ─────────────────────────────────────────────────
// Canvas drawing functions for the Galton board visualization.

import {
  getBgColor,
  getInsideColor,
  getOutsideColor,
  getAmberColor,
  CANVAS_SIZE,
} from '../../colors'
import {
  State,
  ROWS,
  NUM_BINS,
  BALL_RADIUS,
  PEG_RADIUS,
  PEG_START_Y,
  PEG_SPACING_Y,
  PEG_SPACING_X,
} from './types'

// ─── Colors ──────────────────────────────────────────────────────────────────
const C_BALL = getInsideColor()
const C_PEG = '#666'
const C_BIN = getOutsideColor()

// ─── Drawing Functions ───────────────────────────────────────────────────────

/**
 * Draw the complete Galton board - pegs, bins, balls, and Gaussian overlay.
 */
export function draw(ctx: CanvasRenderingContext2D, state: State): void {
  const W = CANVAS_SIZE
  const H = CANVAS_SIZE
  const centerX = W / 2

  // Background
  ctx.fillStyle = getBgColor()
  ctx.fillRect(0, 0, W, H)

  // Draw bin separators
  const binY = PEG_START_Y + ROWS * PEG_SPACING_Y
  const binWidth = PEG_SPACING_X
  const binStartX = centerX - (NUM_BINS / 2) * binWidth

  ctx.strokeStyle = C_BIN
  ctx.lineWidth = 2
  for (let i = 0; i <= NUM_BINS; i++) {
    const x = binStartX + i * binWidth
    ctx.beginPath()
    ctx.moveTo(x, binY)
    ctx.lineTo(x, H - 20)
    ctx.stroke()
  }

  // Draw bin floor
  ctx.beginPath()
  ctx.moveTo(binStartX, H - 20)
  ctx.lineTo(binStartX + NUM_BINS * binWidth, H - 20)
  ctx.stroke()

  // Draw pegs
  ctx.fillStyle = C_PEG
  for (let row = 0; row < ROWS; row++) {
    const pegsInRow = row + 1
    const startY = PEG_START_Y + row * PEG_SPACING_Y
    const rowStartX = centerX - (pegsInRow / 2) * PEG_SPACING_X

    for (let peg = 0; peg < pegsInRow; peg++) {
      const x = rowStartX + (peg + 0.5) * PEG_SPACING_X
      ctx.beginPath()
      ctx.arc(x, startY, PEG_RADIUS, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Draw bin counts as bars
  const maxBin = Math.max(...state.bins, 1)
  const barMaxHeight = H - binY - 40
  ctx.globalAlpha = 0.5
  ctx.fillStyle = C_BALL
  for (let i = 0; i < NUM_BINS; i++) {
    const count = state.bins[i]
    const barHeight = (count / maxBin) * barMaxHeight
    const x = binStartX + i * binWidth + 2
    ctx.fillRect(x, H - 20 - barHeight, binWidth - 4, barHeight)
  }
  ctx.globalAlpha = 1

  // Draw active balls
  ctx.fillStyle = C_BALL
  for (const ball of state.balls) {
    if (ball.active) {
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Gaussian overlay (reference curve)
  if (state.dropped > 10) {
    drawGaussianOverlay(ctx, state, binStartX, binWidth, maxBin, barMaxHeight, H)
  }
}

/**
 * Draw the theoretical Gaussian distribution overlay.
 */
function drawGaussianOverlay(
  ctx: CanvasRenderingContext2D,
  _state: State,
  binStartX: number,
  binWidth: number,
  maxBin: number,
  barMaxHeight: number,
  canvasHeight: number
): void {
  const sigma = Math.sqrt(ROWS / 4)
  const mu = NUM_BINS / 2

  ctx.strokeStyle = getAmberColor()
  ctx.lineWidth = 2
  ctx.beginPath()

  for (let i = 0; i <= NUM_BINS; i += 0.5) {
    const gaussian = Math.exp(-((i - mu) ** 2) / (2 * sigma ** 2))
    const scaledHeight =
      (gaussian * maxBin * barMaxHeight) / (1 / Math.sqrt(2 * Math.PI * sigma ** 2))
    const x = binStartX + i * binWidth
    const y = canvasHeight - 20 - Math.min(scaledHeight, barMaxHeight) * (maxBin > 1 ? 1 : 0)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
}
