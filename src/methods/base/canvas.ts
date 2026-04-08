import { getBgColor, getGridColor, getAmberColor } from '../../colors'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Point {
  x: number
  y: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

// ─── Background Drawing ──────────────────────────────────────────────────────

/**
 * Fills the canvas with the background color.
 */
export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = getBgColor()
  ctx.fillRect(0, 0, width, height)
}

/**
 * Draws a standard grid pattern on the canvas.
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  divisions = 8
): void {
  ctx.strokeStyle = getGridColor()
  ctx.lineWidth = 1

  for (let x = 0; x <= width; x += width / divisions) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }

  for (let y = 0; y <= height; y += height / divisions) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
}

/**
 * Clears the canvas and draws a grid background (common pattern).
 */
export function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  divisions = 8
): void {
  clearCanvas(ctx, width, height)
  drawGrid(ctx, width, height, divisions)
}

// ─── Shape Drawing ───────────────────────────────────────────────────────────

/**
 * Draws a circle outline.
 */
export function drawCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  strokeStyle?: string,
  lineWidth = 1.5
): void {
  ctx.strokeStyle = strokeStyle ?? getAmberColor()
  ctx.lineWidth = lineWidth
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.stroke()
}

/**
 * Draws a filled circle.
 */
export function fillCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  fillStyle: string
): void {
  ctx.fillStyle = fillStyle
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fill()
}

/**
 * Draws a line between two points.
 */
export function drawLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  strokeStyle?: string,
  lineWidth = 1
): void {
  ctx.strokeStyle = strokeStyle ?? getAmberColor()
  ctx.lineWidth = lineWidth
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

/**
 * Draws a polygon from an array of points.
 */
export function drawPolygon(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  strokeStyle: string,
  lineWidth = 1.5,
  dashed = false
): void {
  if (points.length < 2) return

  ctx.strokeStyle = strokeStyle
  ctx.lineWidth = lineWidth
  if (dashed) ctx.setLineDash([5, 5])
  else ctx.setLineDash([])

  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.closePath()
  ctx.stroke()
  ctx.setLineDash([])
}

/**
 * Draws a regular polygon centered at (cx, cy).
 */
export function drawRegularPolygon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  sides: number,
  strokeStyle: string,
  lineWidth = 1.5,
  startAngle = -Math.PI / 2
): void {
  const points: Point[] = []
  for (let i = 0; i < sides; i++) {
    const angle = startAngle + (i / sides) * Math.PI * 2
    points.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    })
  }
  drawPolygon(ctx, points, strokeStyle, lineWidth)
}

// ─── Text Drawing ────────────────────────────────────────────────────────────

/**
 * Draws text at a position with optional alignment.
 */
export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fillStyle: string,
  font = '12px "JetBrains Mono", monospace',
  align: CanvasTextAlign = 'left',
  baseline: CanvasTextBaseline = 'middle'
): void {
  ctx.fillStyle = fillStyle
  ctx.font = font
  ctx.textAlign = align
  ctx.textBaseline = baseline
  ctx.fillText(text, x, y)
}

/**
 * Draws a label with a background box.
 */
export function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fillStyle: string,
  bgStyle: string,
  padding = 4
): void {
  ctx.font = '11px "JetBrains Mono", monospace'
  const metrics = ctx.measureText(text)
  const width = metrics.width + padding * 2
  const height = 14 + padding * 2

  ctx.fillStyle = bgStyle
  ctx.fillRect(x - padding, y - height / 2 - padding, width, height)

  ctx.fillStyle = fillStyle
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y)
}

// ─── Math Helpers ───────────────────────────────────────────────────────────

/**
 * Checks if a point is inside a circle.
 */
export function isInsideCircle(
  x: number,
  y: number,
  cx: number,
  cy: number,
  radius: number
): boolean {
  const dx = x - cx
  const dy = y - cy
  return dx * dx + dy * dy <= radius * radius
}

/**
 * Generates a random point in a rectangle.
 */
export function randomPoint(width: number, height: number): Point {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
  }
}

/**
 * Generates a random point in a circle.
 */
export function randomPointInCircle(cx: number, cy: number, radius: number): Point {
  const angle = Math.random() * Math.PI * 2
  const r = Math.sqrt(Math.random()) * radius
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  }
}

/**
 * Linear interpolation between two values.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Clamps a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Maps a value from one range to another.
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin)
}

// ─── Animation Helpers ──────────────────────────────────────────────────────

/**
 * Easing function: ease in out quad.
 */
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

/**
 * Easing function: ease out elastic.
 */
export function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

/**
 * Creates a smooth pulse between 0 and 1.
 */
export function pulse(time: number, speed = 1): number {
  return (Math.sin(time * speed) + 1) / 2
}

// ─── Color Utilities ────────────────────────────────────────────────────────

/**
 * Creates an RGBA color string.
 */
export function rgba(r: number, g: number, b: number, a: number): string {
  return `rgba(${r},${g},${b},${a})`
}

/**
 * Interpolates between two colors.
 */
export function lerpColor(color1: string, color2: string, t: number): string {
  // Parse hex colors
  const parseHex = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 }
  }

  const c1 = parseHex(color1)
  const c2 = parseHex(color2)

  const r = Math.round(lerp(c1.r, c2.r, t))
  const g = Math.round(lerp(c1.g, c2.g, t))
  const b = Math.round(lerp(c1.b, c2.b, t))

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

// ─── Drawing Helpers ────────────────────────────────────────────────────────

/**
 * Draws a dashed line.
 */
export function drawDashedLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  lineWidth = 1,
  dashPattern: number[] = [5, 5]
): void {
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.setLineDash(dashPattern)
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.setLineDash([])
}
