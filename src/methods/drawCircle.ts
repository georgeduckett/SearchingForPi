import { fmt, distance, getCanvasCoords } from '../utils'
import { C_BG, C_GRID, C_INSIDE, C_AMBER, C_SUCCESS, C_TEXT_MUTED, C_BORDER, C_TEXT_PRIMARY, CANVAS_SIZE, PREVIEW_SIZE, C_AMBER_BRIGHT } from '../colors'
import { clearCanvas } from './base/canvas'
import { createMethodPageFactory, statCard, legend, explanation } from './base/page'

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

  const totalSegments = 12
  const completedSegments = Math.floor(progress * totalSegments)
  const segmentProgress = (progress * totalSegments) % 1

  ctx.strokeStyle = C_AMBER
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()

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

  const currentSegmentStart = (completedSegments / totalSegments) * Math.PI * 2
  const currentSegmentEnd = ((completedSegments + 1) / totalSegments) * Math.PI * 2
  const pointAngle = currentSegmentStart + (currentSegmentEnd - currentSegmentStart) * segmentProgress

  ctx.fillStyle = C_AMBER_BRIGHT
  ctx.beginPath()
  ctx.arc(cx + r * Math.cos(pointAngle), cy + r * Math.sin(pointAngle), 4, 0, Math.PI * 2)
  ctx.fill()

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
  lastDrawPoint: { x: number, y: number } | null
  eventHandlers: {
    mouseMoveHandler: (e: MouseEvent) => void
    mouseUpHandler: (e: MouseEvent) => void
    touchEndHandler: (e: TouchEvent) => void
  } | null
}

// ─── Page Factory ─────────────────────────────────────────────────────────────
export const createDrawCirclePage = createMethodPageFactory<State>(
  {
    title: 'Draw a Circle',
    subtitle: 'Approximate π by manually drawing a circle and measuring its perimeter.',
    index: '07',
    canvasWidth: CANVAS_SIZE,
    canvasHeight: CANVAS_SIZE,
    controls: `
      <div style="display:flex;flex-direction:column;gap:8px;flex:1;">
        <label style="font-family:var(--font-mono);font-size:0.65rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);">
          Line segment length: <span id="length-val">50px</span>
        </label>
        <input type="range" id="length-slider" min="5" max="100" value="50" step="5" style="width:100%;cursor:pointer;">
      </div>
      <button class="btn" id="btn-clear">Clear</button>
    `,
    statsPanel: `
      <div class="stat-card">
        <div class="stat-label">π approximation</div>
        <div class="stat-value large" id="approx" style="color:${C_APPROX}">—</div>
        <div class="stat-error neutral" id="error">—</div>
      </div>
      ${statCard('Points drawn', 'points')}
      <div class="stat-card">
        <div class="stat-label">Perimeter (C)</div>
        <div class="stat-value" id="perimeter" style="color:${C_DRAWN}">—</div>
        <div class="stat-sub">Sum of all line segments</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Radius</div>
        <div class="stat-value" id="radius" style="color:${C_RADIUS}">—</div>
        <div class="stat-sub">Average distance to center</div>
      </div>
      ${legend([
        { color: C_DRAWN, text: 'Your circle (using straight lines)' },
        { color: C_PERFECT, text: 'Perfect circle (same center/radius)' },
        { color: C_CENTER, text: 'Center (average of all points)' },
        { color: C_RADIUS, text: 'Radius (from center to first point)' },
      ])}
      ${explanation('How it works', [
        'Draw a circle by clicking and dragging. Your circle is made of straight lines that connect the points you create. This means we know its exact length. The center is calculated as the average of all your points, with the radius being the average distance from that center.',
        'The better your circle, the closer your approximation will be to π. Using smaller line segments gives smoother circles and better accuracy.',
      ], 'π ≈ perimeter / (2 × r)')}
    `,
  },
  {
    points: [],
    center: null,
    avgRadius: 0,
    perimeter: 0,
    isDrawing: false,
    segmentLength: 50,
    lastDrawPoint: null,
    eventHandlers: null,
  },
  {
    init(ctx) {
      const { ctx: ctx2d, state, $id } = ctx

      // Get element references
      const btnClear = $id('btn-clear', HTMLButtonElement)
      const elPoints = $id('points', HTMLElement)
      const elPerimeter = $id('perimeter', HTMLElement)
      const elRadius = $id('radius', HTMLElement)
      const elApprox = $id('approx', HTMLElement)
      const elError = $id('error', HTMLElement)
      const sliderLength = $id('length-slider', HTMLInputElement)
      const elLength = $id('length-val', HTMLElement)

      // Calculate center as average of all points
      function calculateCenter(): { x: number, y: number } {
        if (state.points.length === 0) return { x: 0, y: 0 }
        const sum = state.points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 })
        return { x: sum.x / state.points.length, y: sum.y / state.points.length }
      }

      // Calculate average radius from center
      function calculateAvgRadius(center: { x: number, y: number }): number {
        if (state.points.length === 0) return 0
        const sum = state.points.reduce((acc, p) => acc + distance(p, center), 0)
        return sum / state.points.length
      }

      // Draw function
      function draw(): void {
        const s = CANVAS_SIZE
        ctx2d.fillStyle = C_BG
        ctx2d.fillRect(0, 0, s, s)

        // Draw grid
        ctx2d.strokeStyle = C_GRID
        ctx2d.lineWidth = 1
        for (let x = 0; x <= s; x += s / 8) {
          ctx2d.beginPath(); ctx2d.moveTo(x, 0); ctx2d.lineTo(x, s); ctx2d.stroke()
        }
        for (let y = 0; y <= s; y += s / 8) {
          ctx2d.beginPath(); ctx2d.moveTo(0, y); ctx2d.lineTo(s, y); ctx2d.stroke()
        }

        if (state.points.length === 0) {
          ctx2d.fillStyle = C_TEXT_MUTED
          ctx2d.font = '14px JetBrains Mono, monospace'
          ctx2d.textAlign = 'center'
          ctx2d.fillText('Click and drag to draw a circle', s / 2, s / 2)
          return
        }

        const center = state.center ?? calculateCenter()
        const radius = state.avgRadius > 0 ? state.avgRadius : calculateAvgRadius(center)

        // Draw perfect circle reference
        ctx2d.strokeStyle = C_PERFECT
        ctx2d.setLineDash([4, 4])
        ctx2d.lineWidth = 1.5
        ctx2d.beginPath()
        ctx2d.arc(center.x, center.y, radius, 0, Math.PI * 2)
        ctx2d.stroke()
        ctx2d.setLineDash([])

        // Draw center point
        ctx2d.fillStyle = C_CENTER
        ctx2d.beginPath()
        ctx2d.arc(center.x, center.y, 6, 0, Math.PI * 2)
        ctx2d.fill()
        ctx2d.strokeStyle = C_CENTER
        ctx2d.lineWidth = 2
        ctx2d.stroke()

        // Draw radius line to first point
        if (state.points.length > 0 && radius > 5) {
          ctx2d.strokeStyle = C_RADIUS
          ctx2d.lineWidth = 2
          ctx2d.setLineDash([6, 6])
          ctx2d.beginPath()
          ctx2d.moveTo(center.x, center.y)
          ctx2d.lineTo(state.points[0].x, state.points[0].y)
          ctx2d.stroke()
          ctx2d.setLineDash([])

          ctx2d.fillStyle = C_RADIUS
          ctx2d.font = '12px JetBrains Mono, monospace'
          ctx2d.textAlign = 'center'
          const midX = (center.x + state.points[0].x) / 2
          const midY = (center.y + state.points[0].y) / 2
          ctx2d.fillText('r', midX, midY - 8)
        }

        // Draw drawn path
        if (state.points.length > 1) {
          ctx2d.strokeStyle = C_DRAWN
          ctx2d.lineWidth = 2.5
          ctx2d.lineCap = 'round'
          ctx2d.lineJoin = 'round'
          ctx2d.beginPath()
          ctx2d.moveTo(state.points[0].x, state.points[0].y)
          for (let i = 1; i < state.points.length; i++) {
            ctx2d.lineTo(state.points[i].x, state.points[i].y)
          }
          ctx2d.lineTo(state.points[0].x, state.points[0].y)
          ctx2d.stroke()
        }

        // Draw point dots
        ctx2d.fillStyle = C_APPROX
        for (const p of state.points) {
          ctx2d.beginPath()
          ctx2d.arc(p.x, p.y, 3, 0, Math.PI * 2)
          ctx2d.fill()
        }

        if (state.points.length > 5 && radius > 10) {
          ctx2d.fillStyle = C_CENTER
          ctx2d.font = '12px JetBrains Mono, monospace'
          ctx2d.textAlign = 'left'
          ctx2d.fillText('Center', center.x + 10, center.y - 10)
        }
      }

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

        let perimeter = 0
        for (let i = 0; i < state.points.length; i++) {
          const next = state.points[(i + 1) % state.points.length]
          perimeter += distance(state.points[i], next)
        }
        state.perimeter = perimeter
        elPerimeter.textContent = `${fmt(perimeter, 4)} px`

        elRadius.textContent = `${fmt(state.avgRadius, 4)} px`

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

      function onMouseDown(e: MouseEvent): void {
        const coords = getCanvasCoords(ctx.canvas, e)
        state.points = []
        state.center = null
        state.avgRadius = 0
        state.perimeter = 0
        state.isDrawing = true
        state.lastDrawPoint = coords
        state.points.push({ ...coords, angle: 0 })
        updateStats()
        draw()
      }

      function onMouseMove(e: MouseEvent): void {
        if (!state.isDrawing || state.lastDrawPoint === null) return

        const coords = getCanvasCoords(ctx.canvas, e)
        const dist = distance(state.lastDrawPoint, coords)

        if (dist >= state.segmentLength) {
          let angle = 0
          if (state.center) {
            angle = Math.atan2(coords.y - state.center.y, coords.x - state.center.x)
          }

          state.points.push({ ...coords, angle })
          state.lastDrawPoint = coords

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

      function onMouseUp(): void {
        if (!state.isDrawing) return
        state.isDrawing = false
        state.lastDrawPoint = null

        if (state.points.length >= 2 && state.center) {
          const first = state.points[0]
          const last = state.points[state.points.length - 1]
          const gap = distance(first, last)

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

          const center = calculateCenter()
          state.center = center
          state.avgRadius = calculateAvgRadius(center)
          updateStats()
          draw()
        }
      }

      function handleTouchStart(e: TouchEvent): void {
        if (!e.touches[0]) return
        const coords = getCanvasCoords(ctx.canvas, e)
        state.points = []
        state.center = null
        state.avgRadius = 0
        state.perimeter = 0
        state.isDrawing = true
        state.lastDrawPoint = coords
        state.points.push({ ...coords, angle: 0 })
        updateStats()
        draw()
      }

      function handleTouchMove(e: TouchEvent): void {
        if (!state.isDrawing || state.lastDrawPoint === null || !e.touches[0]) return

        const coords = getCanvasCoords(ctx.canvas, e)
        const dist = distance(state.lastDrawPoint, coords)

        if (dist >= state.segmentLength) {
          let angle = 0
          if (state.center) {
            angle = Math.atan2(coords.y - state.center.y, coords.x - state.center.x)
          }

          state.points.push({ ...coords, angle })
          state.lastDrawPoint = coords

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
        state.lastDrawPoint = null
        updateStats()
        draw()
      }

      // Store event handlers for cleanup
      state.eventHandlers = {
        mouseMoveHandler: onMouseMove,
        mouseUpHandler: onMouseUp,
        touchEndHandler: onMouseUp,
      }

      // Initial draw
      draw()

      // Wire up events
      ctx.canvas.addEventListener('mousedown', onMouseDown)
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)

      ctx.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault()
        handleTouchStart(e)
      })

      ctx.canvas.addEventListener('touchmove', (e) => {
        e.preventDefault()
        handleTouchMove(e)
      })

      window.addEventListener('touchend', onMouseUp)

      btnClear.addEventListener('click', clear)

      sliderLength.addEventListener('input', (e) => {
        state.segmentLength = parseInt((e.target as HTMLInputElement).value)
        elLength.textContent = `${state.segmentLength}px`
      })
    },

    cleanup(ctx) {
      const { state } = ctx
      state.isDrawing = false
      if (state.eventHandlers) {
        window.removeEventListener('mousemove', state.eventHandlers.mouseMoveHandler)
        window.removeEventListener('mouseup', state.eventHandlers.mouseUpHandler)
        window.removeEventListener('touchend', state.eventHandlers.touchEndHandler)
      }
    },
  }
)
