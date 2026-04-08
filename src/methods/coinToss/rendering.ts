// ─── Coin Toss Rendering ─────────────────────────────────────────────────────
// Canvas drawing functions for the coin toss visualization.

import { getBgColor, getInsideColor, getAmberColor, getTextMutedColor } from '../../colors'
import { State, Sequence, CANVAS_W, CANVAS_H, MAX_GRID_COLS, MAX_GRID_ROWS } from './types'

// Method-specific colors
const C_RATIO = getInsideColor()
const C_TARGET = getAmberColor()
const C_TEXT = getTextMutedColor()

/**
 * Draw the complete coin toss visualization.
 */
export function draw(ctx: CanvasRenderingContext2D, state: State): void {
  ctx.fillStyle = getBgColor()
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

  drawGraph(ctx, state)
  drawSequenceGrid(ctx, state)
}

/**
 * Draw the running estimate graph showing convergence to π/4.
 */
function drawGraph(ctx: CanvasRenderingContext2D, state: State): void {
  const n = state.sequences.length
  if (n === 0) return

  // Draw target line and text first
  const targetScale = Math.max(0, Math.min(1, (Math.PI / 4 - 0.6) / 0.3))
  const targetY = CANVAS_H - targetScale * CANVAS_H
  ctx.strokeStyle = C_TARGET
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5])
  ctx.beginPath()
  ctx.moveTo(0, targetY)
  ctx.lineTo(CANVAS_W, targetY)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = C_TEXT
  ctx.font = '12px monospace'
  ctx.fillText(`π/4 ${(Math.PI / 4).toFixed(2)}`, CANVAS_W - 70, targetY - 5)

  // Then draw running estimate graph
  ctx.strokeStyle = C_RATIO
  ctx.lineWidth = 2
  ctx.beginPath()
  let cumulativeSum = 0
  for (let i = 0; i < n; i++) {
    cumulativeSum += state.sequences[i].ratio
    const avg = cumulativeSum / (i + 1)
    const x = (i / Math.max(n - 1, 1)) * CANVAS_W
    const scale = Math.max(0, Math.min(1, (avg - 0.6) / 0.3))
    const y = CANVAS_H - scale * CANVAS_H
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  const lastX = ((n - 1) / Math.max(n - 1, 1)) * CANVAS_W
  const lastScale = Math.max(0, Math.min(1, (cumulativeSum / n - 0.6) / 0.3))
  const lastY = CANVAS_H - lastScale * CANVAS_H
  ctx.fillStyle = C_RATIO
  ctx.beginPath()
  ctx.arc(lastX, lastY, 4, 0, Math.PI * 2)
  ctx.fill()
}

/**
 * Draw the grid of coin toss sequences.
 */
function drawSequenceGrid(ctx: CanvasRenderingContext2D, state: State): void {
  const combined: Sequence[] = [...state.sequenceBatch]
  if (state.currentSequence) combined.push(state.currentSequence)
  if (combined.length === 0) return

  const rows = Math.min(combined.length, MAX_GRID_ROWS)
  const visible = combined.slice(-rows)
  const rowHeight = CANVAS_H / MAX_GRID_ROWS

  for (let r = 0; r < visible.length; r++) {
    const seq = visible[r]
    const displayRow = r
    const rowY = displayRow * rowHeight + rowHeight / 2
    const tosses = seq.tosses
    const finished = seq !== state.currentSequence

    for (let j = 0; j < Math.min(tosses.length, MAX_GRID_COLS); j++) {
      const x = j * (CANVAS_W / MAX_GRID_COLS) + 15
      const isHead = tosses[j]
      const isNew = !finished && j === state.newCoinIndex
      ctx.fillStyle = isHead ? C_RATIO : '#888'
      ctx.globalAlpha = finished ? 1 : 0.8
      ctx.beginPath()
      ctx.arc(x, rowY, 10, 0, Math.PI * 2)
      ctx.fill()

      if (isNew) {
        ctx.strokeStyle = 'white'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      ctx.fillStyle = 'white'
      ctx.font = '12px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(isHead ? 'H' : 'T', x, rowY + 5)
    }

    ctx.globalAlpha = 1
    if (!finished) {
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'
      ctx.lineWidth = 2
      ctx.strokeRect(5, rowY - rowHeight / 2 + 4, CANVAS_W - 10, rowHeight - 8)
    }

    ctx.fillStyle = '#ffffff'
    ctx.font = '10px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`${seq.heads}/${seq.total} = ${seq.ratio.toFixed(2)}`, 10, rowY - rowHeight / 4)
  }
}
