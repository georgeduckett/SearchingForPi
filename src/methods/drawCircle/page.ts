// ─── Draw Circle Page ────────────────────────────────────────────────────────
// Main page factory for the draw circle method.

import { fmt, distance, getCanvasCoords } from '../../utils'
import { CANVAS_SIZE } from '../../colors'
import { createMethodPageFactory, statCard, legend, explanation } from '../base/page'
import {
  State,
  C_DRAWN,
  C_APPROX,
  C_CENTER,
  C_RADIUS,
  C_PERFECT,
  createInitialState,
} from './types'
import { draw, calculateCenter, calculateAvgRadius } from './rendering'

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
      ${explanation(
        'How it works',
        [
          'Draw a circle by clicking and dragging. Your circle is made of straight lines that connect the points you create. This means we know its exact length. The center is calculated as the average of all your points, with the radius being the average distance from that center.',
          'The better your circle, the closer your approximation will be to π. Using smaller line segments gives smoother circles and better accuracy.',
        ],
        'π ≈ perimeter / (2 × r)'
      )}
    `,
  },
  createInitialState(),
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
        draw(ctx2d, state)
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

          const center = calculateCenter(state.points)
          state.center = center
          state.avgRadius = calculateAvgRadius(state.points, center)

          if (state.center) {
            for (const p of state.points) {
              p.angle = Math.atan2(p.y - center.y, p.x - center.x)
            }
          }

          updateStats()
          draw(ctx2d, state)
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

          const center = calculateCenter(state.points)
          state.center = center
          state.avgRadius = calculateAvgRadius(state.points, center)
          updateStats()
          draw(ctx2d, state)
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
        draw(ctx2d, state)
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

          const center = calculateCenter(state.points)
          state.center = center
          state.avgRadius = calculateAvgRadius(state.points, center)

          if (state.center) {
            for (const p of state.points) {
              p.angle = Math.atan2(p.y - center.y, p.x - center.x)
            }
          }

          updateStats()
          draw(ctx2d, state)
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
        draw(ctx2d, state)
      }

      // Store event handlers for cleanup
      state.eventHandlers = {
        mouseMoveHandler: onMouseMove,
        mouseUpHandler: onMouseUp,
        touchEndHandler: onMouseUp,
      }

      // Initial draw
      draw(ctx2d, state)

      // Wire up events
      ctx.canvas.addEventListener('mousedown', onMouseDown)
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)

      ctx.canvas.addEventListener('touchstart', e => {
        e.preventDefault()
        handleTouchStart(e)
      })

      ctx.canvas.addEventListener('touchmove', e => {
        e.preventDefault()
        handleTouchMove(e)
      })

      window.addEventListener('touchend', onMouseUp)

      btnClear.addEventListener('click', clear)

      sliderLength.addEventListener('input', e => {
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
