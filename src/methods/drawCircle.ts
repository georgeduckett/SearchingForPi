import type { Page } from '../router'
import { fmt, distance, getCanvasCoords, queryRequired } from '../utils'
import { C_BG, C_GRID, C_INSIDE, C_AMBER, C_SUCCESS, C_TEXT_MUTED, C_BORDER, C_TEXT_PRIMARY, CANVAS_SIZE, PREVIEW_SIZE, C_AMBER_BRIGHT } from '../colors'
import { clearCanvas } from './base/canvas'

// ─── Colours (method-specific) ──────────────────────────────────────────────
const C_DRAWN = C_INSIDE
const C_APPROX = C_AMBER
const C_CENTER = C_TEXT_PRIMARY
const C_RADIUS = C_SUCCESS
const C_PERFECT = C_BORDER

// ─── Preview Renderer ────────────────────────────────────────────────────────
export function drawPreview(ctx: CanvasRenderingContext2D, time: number): void {
const s = PREVIEW_SIZE
clearCanvas(ctx, s, s)

  const progress = (time * 0.3) % 1
  const cx = s / 2
  const cy = s / 2
  const r = s / 2 - 15

  // Draw circle using line segments (12 segments total)
  const totalSegments = 12
  const completedSegments = Math.floor(progress * totalSegments)
  const segmentProgress = (progress * totalSegments) % 1

  ctx.strokeStyle = C_AMBER
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()

  // Only draw completed segments
  for (let i = 0; i < completedSegments; i++) {
    const startAngle = (i / totalSegments) * Math.PI * 2
    const endAngle = ((i + 1) / totalSegments) * Math.PI * 2
    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle)
    const y2 = cy + r * Math.sin(endAngle)

    if (i === 0) {
      ctx.moveTo(x1, y1)
    }
    ctx.lineTo(x2, y2)
  }

  ctx.stroke()

  // Draw line from last completed segment to the current dot position
  if (completedSegments < totalSegments) {
    const lastCompletedAngle = (completedSegments / totalSegments) * Math.PI * 2
    const lastX = cx + r * Math.cos(lastCompletedAngle)
    const lastY = cy + r * Math.sin(lastCompletedAngle)
    const currentSegmentEnd = ((completedSegments + 1) / totalSegments) * Math.PI * 2
    const pointAngle = lastCompletedAngle + (currentSegmentEnd - lastCompletedAngle) * segmentProgress
    const dotX = cx + r * Math.cos(pointAngle)
    const dotY = cy + r * Math.sin(pointAngle)

    ctx.strokeStyle = C_AMBER
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(lastX, lastY)
    ctx.lineTo(dotX, dotY)
    ctx.stroke()
  }

  // Draw the current drawing point (moving ahead of the drawn segments)
  const currentSegmentStart = (completedSegments / totalSegments) * Math.PI * 2
  const currentSegmentEnd = ((completedSegments + 1) / totalSegments) * Math.PI * 2
  const pointAngle = currentSegmentStart + (currentSegmentEnd - currentSegmentStart) * segmentProgress

  ctx.fillStyle = C_AMBER_BRIGHT
  ctx.beginPath()
  ctx.arc(cx + r * Math.cos(pointAngle), cy + r * Math.sin(pointAngle), 4, 0, Math.PI * 2)
  ctx.fill()

  // Draw segment dots at completed vertices
  ctx.fillStyle = C_DRAWN
  for (let i = 0; i <= completedSegments && i < totalSegments; i++) {
    const angle = (i / totalSegments) * Math.PI * 2
    ctx.beginPath()
    ctx.arc(cx + r * Math.cos(angle), cy + r * Math.sin(angle), 2.5, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = C_TEXT_MUTED
  ctx.font = '12px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('π = C/d', s / 2, 3 * s / 4)
}

// ─── State ───────────────────────────────────────────────────────────────────
interface Point {
  x: number
  y: number
  angle: number
}

interface State {
  points: Point[]
  center: { x: number, y: number } | null
  avgRadius: number
  perimeter: number
  isDrawing: boolean
  segmentLength: number
}

// ─── Page Factory ─────────────────────────────────────────────────────────────
export function createDrawCirclePage(): Page {
  const state: State = {
    points: [],
    center: null,
    avgRadius: 0,
    perimeter: 0,
    isDrawing: false,
    segmentLength: 50
  }

  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D
  let btnClear: HTMLButtonElement
  let elPoints: HTMLElement
  let elPerimeter: HTMLElement
  let elRadius: HTMLElement
  let elApprox: HTMLElement
  let elError: HTMLElement
  let sliderLength: HTMLInputElement
  let elLength: HTMLElement
  let lastDrawPoint: { x: number, y: number } | null = null

  // ── Calculate center as average of all points ──────────────────────────────
  function calculateCenter(): { x: number, y: number } {
    if (state.points.length === 0) return { x: 0, y: 0 }
    const sum = state.points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 })
    return { x: sum.x / state.points.length, y: sum.y / state.points.length }
  }

  // ── Calculate average radius from center ───────────────────────────────────
  function calculateAvgRadius(center: { x: number, y: number }): number {
    if (state.points.length === 0) return 0
    const sum = state.points.reduce((acc, p) => acc + distance(p, center), 0)
    return sum / state.points.length
  }

  // ── Draw the visualization ──────────────────────────────────────────────────
  function draw(): void {
    const s = CANVAS_SIZE
    ctx.fillStyle = C_BG
    ctx.fillRect(0, 0, s, s)

    // Draw grid
    ctx.strokeStyle = C_GRID
    ctx.lineWidth = 1
    for (let x = 0; x <= s; x += s / 8) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, s); ctx.stroke()
    }
    for (let y = 0; y <= s; y += s / 8) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s, y); ctx.stroke()
    }

    if (state.points.length === 0) {
      // Draw hint text
      ctx.fillStyle = C_TEXT_MUTED
      ctx.font = '14px JetBrains Mono, monospace'
      ctx.textAlign = 'center'
      ctx.fillText('Click and drag to draw a circle', s / 2, s / 2)
      return
    }

    // Calculate center/radius if not already set
    const center = state.center ?? calculateCenter()
    const radius = state.avgRadius > 0 ? state.avgRadius : calculateAvgRadius(center)

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

      // Label the radius
      ctx.fillStyle = C_RADIUS
      ctx.font = '12px JetBrains Mono, monospace'
      ctx.textAlign = 'center'
      const midX = (center.x + state.points[0].x) / 2
      const midY = (center.y + state.points[0].y) / 2
      ctx.fillText('r', midX, midY - 8)
    }

    // Draw drawn path (circle composed of straight lines)
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
      // Close the circle
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

    // Draw label for center (only if we have a reasonable circle formed)
    if (state.points.length > 5 && radius > 10) {
      ctx.fillStyle = C_CENTER
      ctx.font = '12px JetBrains Mono, monospace'
      ctx.textAlign = 'left'
      ctx.fillText('Center', center.x + 10, center.y - 10)
    }
  }

  // ── Update stats display ────────────────────────────────────────────────────
  function updateStats(): void {
    if (state.center === null) {
      elPoints.textContent = '0 points'
      elPerimeter.textContent = '—'
      elRadius.textContent = '—'
      elApprox.textContent = '—'
      elError.textContent = '—'
      return
    }

    elPoints.textContent = `${state.points.length} points`

    // Calculate perimeter: sum of all segment lengths
    let perimeter = 0
    for (let i = 0; i < state.points.length; i++) {
      const next = state.points[(i + 1) % state.points.length]
      perimeter += distance(state.points[i], next)
    }
    state.perimeter = perimeter
    elPerimeter.textContent = `${fmt(perimeter, 4)} px`

    elRadius.textContent = `${fmt(state.avgRadius, 4)} px`

    // Calculate π approximation: perimeter / (2 * radius)
    const piApprox = state.avgRadius > 0 ? perimeter / (2 * state.avgRadius) : 0
    const error = Math.abs(piApprox - Math.PI)
    const errorPct = (error / Math.PI) * 100

    elApprox.textContent = fmt(piApprox, 8)

    if (errorPct > 10) {
      elError.innerHTML = `Error: ${fmt(errorPct, 2)}% <span style="color:var(--text-muted)">(draw more!)</span>`
    } else if (errorPct > 1) {
      elError.innerHTML = `Error: <span style="color:${C_DRAWN}">${fmt(errorPct, 2)}%</span>`
    } else if (errorPct > 0.1) {
      elError.innerHTML = `Error: <span style="color:#4ecb71">${fmt(errorPct, 2)}%</span>`
    } else {
      elError.innerHTML = `Error: <span style="color:#4ecb71">Excellent! ${fmt(errorPct, 3)}%</span>`
    }
  }

  // ── Mouse handlers ─────────────────────────────────────────────────────────
  function onMouseDown(e: MouseEvent): void {
    const coords = getCanvasCoords(canvas, e)
    state.points = []
    state.center = null
    state.avgRadius = 0
    state.perimeter = 0
    state.isDrawing = true
    lastDrawPoint = coords
    state.points.push({ ...coords, angle: 0 })
    updateStats()
    draw()
  }

  function onMouseMove(e: MouseEvent): void {
    if (!state.isDrawing || lastDrawPoint === null) return

    const coords = getCanvasCoords(canvas, e)
    const dist = distance(lastDrawPoint, coords)

    // Only add points if they're far enough apart
    if (dist >= state.segmentLength) {
      // Calculate angle from center (if we have one)
      let angle = 0
      if (state.center) {
        angle = Math.atan2(coords.y - state.center.y, coords.x - state.center.x)
      }

      state.points.push({ ...coords, angle })
      lastDrawPoint = coords

      // Update center and radius
      const center = calculateCenter()
      state.center = center
      state.avgRadius = calculateAvgRadius(center)

      // Update angles for all points
      if (state.center) {
        for (const p of state.points) {
          p.angle = Math.atan2(p.y - center.y, p.x - center.x)
        }
      }

      updateStats()
      draw()
    }
  }

  function onMouseUp(): void {
    if (!state.isDrawing) return
    state.isDrawing = false
    lastDrawPoint = null

    // Close the circle: check if endpoints are far enough apart to add more points
    if (state.points.length >= 2 && state.center) {
      const first = state.points[0]
      const last = state.points[state.points.length - 1]
      const gap = distance(first, last)

      // Fill in the gap if needed
      if (gap > state.segmentLength) {
        const steps = Math.ceil(gap / state.segmentLength)
        for (let i = 1; i < steps; i++) {
          const t = i / steps
          const x = last.x + (first.x - last.x) * t
          const y = last.y + (first.y - last.y) * t
          const angle = Math.atan2(y - state.center.y, x - state.center.x)
          state.points.push({ x, y, angle })
        }
      }

      // Recalculate with all points
      const center = calculateCenter()
      state.center = center
      state.avgRadius = calculateAvgRadius(center)
      updateStats()
      draw()
    }
  }

  // Touch event handlers that work directly with coordinates
  function handleTouchStart(e: TouchEvent): void {
    if (!e.touches[0]) return
    const coords = getCanvasCoords(canvas, e)
    state.points = []
    state.center = null
    state.avgRadius = 0
    state.perimeter = 0
    state.isDrawing = true
    lastDrawPoint = coords
    state.points.push({ ...coords, angle: 0 })
    updateStats()
    draw()
  }

  function handleTouchMove(e: TouchEvent): void {
    if (!state.isDrawing || lastDrawPoint === null || !e.touches[0]) return

    const coords = getCanvasCoords(canvas, e)
    const dist = distance(lastDrawPoint, coords)

    if (dist >= state.segmentLength) {
      let angle = 0
      if (state.center) {
        angle = Math.atan2(coords.y - state.center.y, coords.x - state.center.x)
      }

      state.points.push({ ...coords, angle })
      lastDrawPoint = coords

      const center = calculateCenter()
      state.center = center
      state.avgRadius = calculateAvgRadius(center)

      if (state.center) {
        for (const p of state.points) {
          p.angle = Math.atan2(p.y - center.y, p.x - center.x)
        }
      }

      updateStats()
      draw()
    }
  }

  function clear(): void {
    state.points = []
    state.center = null
    state.avgRadius = 0
    state.perimeter = 0
    state.isDrawing = false
    lastDrawPoint = null
    updateStats()
    draw()
  }

  // ── Build DOM ─────────────────────────────────────────────────────────────
  function render(): HTMLElement {
    const page = document.createElement('div')
    page.className = 'page'

    page.innerHTML = `
      <header class="page-header">
        <span class="page-index">Method 07</span>
        <h2 class="page-title">Draw a Circle</h2>
        <p class="page-subtitle">
          Approximate π by manually drawing a circle and measuring its perimeter.
        </p>
      </header>

      <div class="viz-layout">
        <!-- Canvas -->
        <div>
          <div class="canvas-wrapper">
            <canvas id="draw-canvas" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}"></canvas>
          </div>
          <div style="margin-top:14px;display:flex;justify-content:space-between;align-items:center;gap:20px;">
            <div style="display:flex;flex-direction:column;gap:8px;flex:1;">
              <label style="font-family:var(--font-mono);font-size:0.65rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);">
                Line segment length: <span id="draw-length-val">${state.segmentLength}px</span>
              </label>
              <input type="range" id="draw-length" min="5" max="100" value="${state.segmentLength}" step="5"
                style="width:100%;cursor:pointer;">
            </div>
            <button id="draw-clear" class="btn">Clear</button>
          </div>
        </div>

        <!-- Stats + info -->
        <div class="stats-panel">
          <div class="stat-card">
            <div class="stat-label">π approximation</div>
            <div class="stat-value large" id="draw-approx" style="color:${C_APPROX}">—</div>
            <div class="stat-error neutral" id="draw-error">—</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Points drawn</div>
            <div class="stat-value" id="draw-points">0 points</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Perimeter (C)</div>
            <div class="stat-value" id="draw-perimeter" style="color:${C_DRAWN}">—</div>
            <div class="stat-sub">Sum of all line segments</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Radius</div>
            <div class="stat-value" id="draw-radius" style="color:${C_RADIUS}">—</div>
            <div class="stat-sub">Average distance to center</div>
          </div>

          <div class="legend">
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_DRAWN}"></div>
              Your circle (using straight lines)
            </div>
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_PERFECT};border:1px dashed"></div>
              Perfect circle (same center/radius)
            </div>
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_CENTER}"></div>
              Center (average of all points)
            </div>
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_RADIUS}"></div>
              Radius (from center to first point)
            </div>
          </div>

          <div class="explanation">
            <h3>How it works</h3>
            <p>
              Draw a circle by clicking and dragging. Your circle is made of straight lines
              that connect the points you create. This means we know its exact length. The center is calculated as the average
              of all your points, with the radius being the average distance from that center.
              We can then use these measurements to approximate π using the formula:
            </p>
            <div class="formula">π ≈ perimeter / (2 × r)</div>
            <p>
              The better your circle, the closer your approximation will be to π.
              Using smaller line segments gives smoother circles and better accuracy.
            </p>
          </div>
        </div>
      </div>
    `

    // Grab element refs using queryRequired for safety
    canvas = queryRequired(page, '#draw-canvas', HTMLCanvasElement)
    ctx = canvas.getContext('2d')!
    btnClear = queryRequired(page, '#draw-clear', HTMLButtonElement)
    elPoints = queryRequired(page, '#draw-points')
    elPerimeter = queryRequired(page, '#draw-perimeter')
    elRadius = queryRequired(page, '#draw-radius')
    elApprox = queryRequired(page, '#draw-approx')
    elError = queryRequired(page, '#draw-error')
    sliderLength = queryRequired(page, '#draw-length', HTMLInputElement)
    elLength = queryRequired(page, '#draw-length-val')

    draw()

    // Mouse/Pointer events for drawing
    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    // Touch support - create adapter to convert touch events to coordinates
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault()
      handleTouchStart(e)
    })

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault()
      handleTouchMove(e)
    })

    window.addEventListener('touchend', onMouseUp)

    // Clear button
    btnClear.addEventListener('click', clear)

    // Segment length slider
    sliderLength.addEventListener('input', (e) => {
      state.segmentLength = parseInt((e.target as HTMLInputElement).value)
      elLength.textContent = `${state.segmentLength}px`
    })

    return page
  }

  function cleanup(): void {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    window.removeEventListener('touchend', onMouseUp)
    state.isDrawing = false
  }

  return { render, cleanup }
}
