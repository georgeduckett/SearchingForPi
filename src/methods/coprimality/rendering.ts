// ─── Coprimality Rendering ───────────────────────────────────────────────────
// Canvas drawing functions for the coprimality visualization.

import { getBgColor, getTextMutedColor, CANVAS_SIZE } from '../../colors'
import { State, GRID_SIZE, C_COPRIME, C_NOT_COPRIME } from './types'

/**
 * Draw the complete coprimality visualization.
 */
export function draw(ctx: CanvasRenderingContext2D, state: State): void {
  const W = CANVAS_SIZE
  const H = CANVAS_SIZE

  ctx.fillStyle = getBgColor()
  ctx.fillRect(0, 0, W, H)

  const cellSize = Math.min((W - 40) / GRID_SIZE, (H - 40) / GRID_SIZE)
  const offsetX = (W - GRID_SIZE * cellSize) / 2
  const offsetY = (H - GRID_SIZE * cellSize) / 2

  // Draw grid background
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 0.5
  for (let i = 0; i <= GRID_SIZE; i++) {
    ctx.beginPath()
    ctx.moveTo(offsetX + i * cellSize, offsetY)
    ctx.lineTo(offsetX + i * cellSize, offsetY + GRID_SIZE * cellSize)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(offsetX, offsetY + i * cellSize)
    ctx.lineTo(offsetX + GRID_SIZE * cellSize, offsetY + i * cellSize)
    ctx.stroke()
  }

  // Draw pairs that are coprime
  const maxDisplay = GRID_SIZE * GRID_SIZE
  const displayLimit = Math.min(state.pairs.length, maxDisplay)

  for (let i = 0; i < displayLimit; i++) {
    const pair = state.pairs[state.pairs.length - 1 - i]
    if (!pair) continue

    // Map to grid position
    const gridX = pair.a % GRID_SIZE
    const gridY = pair.b % GRID_SIZE
    const x = offsetX + gridX * cellSize
    const y = offsetY + gridY * cellSize

    ctx.fillStyle = pair.coprime ? C_COPRIME : C_NOT_COPRIME
    ctx.globalAlpha = 0.8
    ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2)
  }
  ctx.globalAlpha = 1

  // Labels
  ctx.fillStyle = getTextMutedColor()
  ctx.font = '11px "JetBrains Mono", monospace'
  ctx.fillText('a', offsetX - 10, offsetY + (GRID_SIZE * cellSize) / 2)
  ctx.fillText('b', offsetX + (GRID_SIZE * cellSize) / 2 - 10, offsetY - 5)
}
