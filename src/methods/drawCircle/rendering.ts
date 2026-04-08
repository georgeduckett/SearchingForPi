// ─── Draw Circle Rendering ───────────────────────────────────────────────────
// Canvas drawing functions for the draw circle visualization.

import { getBgColor, getGridColor, getTextMutedColor, CANVAS_SIZE } from '../../colors'
import { distance } from '../../utils'
import { State, Point, C_DRAWN, C_APPROX, C_CENTER, C_RADIUS, C_PERFECT } from './types'

/**
 * Calculate center as average of all points.
 */
export function calculateCenter(points: Point[]): { x: number; y: number } {
  if (points.length === 0) return { x: 0, y: 0 }
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 })
  return { x: sum.x / points.length, y: sum.y / points.length }
}

/**
 * Calculate average radius from center.
 */
export function calculateAvgRadius(points: Point[], center: { x: number; y: number }): number {
  if (points.length === 0) return 0
  const sum = points.reduce((acc, p) => acc + distance(p, center), 0)
  return sum / points.length
}

/**
 * Draw the complete draw circle visualization.
 */
export function draw(ctx: CanvasRenderingContext2D, state: State): void {
  const s = CANVAS_SIZE
  ctx.fillStyle = getBgColor()
  ctx.fillRect(0, 0, s, s)

  // Draw grid
  ctx.strokeStyle = getGridColor()
  ctx.lineWidth = 1
  for (let x = 0; x <= s; x += s / 8) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, s)
    ctx.stroke()
  }
  for (let y = 0; y <= s; y += s / 8) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(s, y)
    ctx.stroke()
  }

  if (state.points.length === 0) {
    ctx.fillStyle = getTextMutedColor()
    ctx.font = '14px JetBrains Mono, monospace'
    ctx.textAlign = 'center'
    ctx.fillText('Click and drag to draw a circle', s / 2, s / 2)
    return
  }

  const center = state.center ?? calculateCenter(state.points)
  const radius = state.avgRadius > 0 ? state.avgRadius : calculateAvgRadius(state.points, center)

  // Draw perfect circle reference
  ctx.strokeStyle = C_PERFECT
  ctx.setLineDash([4, 4])
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])

  // Draw center point
  ctx.fillStyle = C_CENTER
  ctx.beginPath()
  ctx.arc(center.x, center.y, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = C_CENTER
  ctx.lineWidth = 2
  ctx.stroke()

  // Draw radius line to first point
  if (state.points.length > 0 && radius > 5) {
    ctx.strokeStyle = C_RADIUS
    ctx.lineWidth = 2
    ctx.setLineDash([6, 6])
    ctx.beginPath()
    ctx.moveTo(center.x, center.y)
    ctx.lineTo(state.points[0].x, state.points[0].y)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = C_RADIUS
    ctx.font = '12px JetBrains Mono, monospace'
    ctx.textAlign = 'center'
    const midX = (center.x + state.points[0].x) / 2
    const midY = (center.y + state.points[0].y) / 2
    ctx.fillText('r', midX, midY - 8)
  }

  // Draw drawn path
  if (state.points.length > 1) {
    ctx.strokeStyle = C_DRAWN
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(state.points[0].x, state.points[0].y)
    for (let i = 1; i < state.points.length; i++) {
      ctx.lineTo(state.points[i].x, state.points[i].y)
    }
    ctx.lineTo(state.points[0].x, state.points[0].y)
    ctx.stroke()
  }

  // Draw point dots
  ctx.fillStyle = C_APPROX
  for (const p of state.points) {
    ctx.beginPath()
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
    ctx.fill()
  }

  if (state.points.length > 5 && radius > 10) {
    ctx.fillStyle = C_CENTER
    ctx.font = '12px JetBrains Mono, monospace'
    ctx.textAlign = 'left'
    ctx.fillText('Center', center.x + 10, center.y - 10)
  }
}
