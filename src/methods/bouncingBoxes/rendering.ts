// ─── Bouncing Boxes Rendering ────────────────────────────────────────────────
// Canvas drawing functions for the bouncing boxes visualization.

import {
  getBgColor,
  getTextMutedColor,
  getInsideColor,
  getAmberColor,
  getTextColor,
} from '../../colors'
import { State, BASE_BOX_SIZE, BASE_WALL_X } from './types'
import { getBox2Size } from './physics'

// ─── Colors ──────────────────────────────────────────────────────────────────
const C_WALL = getTextMutedColor()
const C_BOX1 = getInsideColor()
const C_BOX2 = getAmberColor()
const C_TEXT = getTextColor()

// ─── Drawing Functions ───────────────────────────────────────────────────────

/**
 * Draw the complete scene - wall, boxes, and labels.
 */
export function draw(
  ctx: CanvasRenderingContext2D,
  state: State,
  canvasW: number,
  canvasH: number
): void {
  const scale = state.scale

  // Background
  ctx.fillStyle = getBgColor()
  ctx.fillRect(0, 0, canvasW, canvasH)

  // Wall
  const wallX = BASE_WALL_X * scale
  ctx.strokeStyle = C_WALL
  ctx.lineWidth = Math.max(1, scale)
  ctx.beginPath()
  ctx.moveTo(wallX, 0)
  ctx.lineTo(wallX, canvasH)
  ctx.stroke()

  // Calculate box sizes
  const box2Size = getBox2Size(state.m2)
  const boxSize = BASE_BOX_SIZE * scale
  const scaledBox2Size = box2Size * scale

  // Vibration effect
  const vibrationX = state.vibrationOffset * scale

  // Small box (Box 1)
  ctx.fillStyle = C_BOX1
  ctx.fillRect(
    state.smallBoxX * scale - boxSize / 2 + vibrationX,
    canvasH / 2 - boxSize / 2,
    boxSize,
    boxSize
  )

  // Large box (Box 2)
  ctx.fillStyle = C_BOX2
  ctx.fillRect(
    state.largeBoxX * scale - scaledBox2Size / 2,
    canvasH / 2 - scaledBox2Size / 2,
    scaledBox2Size,
    scaledBox2Size
  )

  // Labels
  ctx.fillStyle = C_TEXT
  ctx.font = `${Math.max(10, Math.round(12 * scale))}px monospace`
  const labelOffset = Math.round(40 * scale)
  ctx.fillText('Box 1 (m=1)', state.smallBoxX * scale - 30 * scale, canvasH / 2 + labelOffset)
  ctx.fillText(
    `Box 2 (m=${state.m2})`,
    state.largeBoxX * scale - 30 * scale,
    canvasH / 2 + labelOffset + Math.round(15 * scale)
  )
}

/**
 * Calculate canvas dimensions based on container and viewport.
 */
export function calculateCanvasSize(
  containerWidth: number,
  viewportWidth: number,
  baseWidth: number,
  baseHeight: number,
  mobileBreakpoint: number
): { width: number; height: number; scale: number } {
  const isMobile = viewportWidth <= mobileBreakpoint

  if (isMobile) {
    const canvasWidth = containerWidth
    const canvasHeight = Math.round(canvasWidth * (baseHeight / baseWidth))
    return {
      width: canvasWidth,
      height: canvasHeight,
      scale: canvasWidth / baseWidth,
    }
  } else {
    return {
      width: baseWidth,
      height: baseHeight,
      scale: 1,
    }
  }
}
