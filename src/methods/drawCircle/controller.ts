// ─── Draw Circle Controller ───────────────────────────────────────────────────
// Mouse interaction control logic for the draw circle method.
// Extracted from page.ts for better separation of concerns.

import { fmt, distance, getCanvasCoords } from '../../utils'
import type { MethodPageContext } from '../base/page/types'
import { State } from './types'
import { draw, calculateCenter, calculateAvgRadius } from './rendering'

// ─── Stats Element References ──────────────────────────────────────────────────

export interface StatsElements {
  points: HTMLElement
  perimeter: HTMLElement
  radius: HTMLElement
  approx: HTMLElement
  error: HTMLElement
}

// ─── Stats Management ──────────────────────────────────────────────────────────

/**
 * Creates a stats updater function for DrawCircle method.
 */
export function createStatsUpdater(elements: StatsElements, state: State): () => void {
  return function updateStats(): void {
    if (state.center === null) {
      elements.points.textContent = '0 points'
      elements.perimeter.textContent = '—'
      elements.radius.textContent = '—'
      elements.approx.textContent = '—'
      elements.error.textContent = '—'
      return
    }

    elements.points.textContent = `${state.points.length} points`

    let perimeter = 0
    for (let i = 0; i < state.points.length; i++) {
      const next = state.points[(i + 1) % state.points.length]
      perimeter += distance(state.points[i], next)
    }
    state.perimeter = perimeter
    elements.perimeter.textContent = `${fmt(perimeter, 4)} px`

    elements.radius.textContent = `${fmt(state.avgRadius, 4)} px`

    const piApprox = state.avgRadius > 0 ? perimeter / (2 * state.avgRadius) : 0
    const error = Math.abs(piApprox - Math.PI)
    const errorPct = (error / Math.PI) * 100

    elements.approx.textContent = fmt(piApprox, 8)

    if (errorPct > 10) {
      elements.error.innerHTML = `Error: ${fmt(errorPct, 2)}% <span style="color:var(--text-muted)">(draw more!)</span>`
    } else if (errorPct > 1) {
      elements.error.innerHTML = `Error: <span style="color:var(--text-muted)">${fmt(errorPct, 2)}%</span>`
    } else if (errorPct > 0.1) {
      elements.error.innerHTML = `Error: <span style="color:#4ecb71">${fmt(errorPct, 2)}%</span>`
    } else {
      elements.error.innerHTML = `Error: <span style="color:#4ecb71">Excellent! ${fmt(errorPct, 3)}%</span>`
    }
  }
}

// ─── Mouse Event Handlers ──────────────────────────────────────────────────────

/**
 * Handle mouse down - start drawing.
 */
export function onMouseDown(
  e: MouseEvent,
  ctx: MethodPageContext<State>,
  updateStats: () => void
): void {
  const { canvas, ctx: ctx2d, state } = ctx
  const coords = getCanvasCoords(canvas, e)
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

/**
 * Handle mouse move - continue drawing.
 */
export function onMouseMove(
  e: MouseEvent,
  ctx: MethodPageContext<State>,
  updateStats: () => void
): void {
  const { canvas, ctx: ctx2d, state } = ctx
  if (!state.isDrawing || state.lastDrawPoint === null) return

  const coords = getCanvasCoords(canvas, e)
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

    draw(ctx2d, state)
    updateStats()
  }
}

/**
 * Handle mouse up - finish drawing.
 */
export function onMouseUp(ctx: MethodPageContext<State>, updateStats: () => void): void {
  const { ctx: ctx2d, state } = ctx
  state.isDrawing = false
  state.lastDrawPoint = null

  if (state.points.length > 0) {
    const center = calculateCenter(state.points)
    state.center = center
    state.avgRadius = calculateAvgRadius(state.points, center)
    draw(ctx2d, state)
    updateStats()
  }
}

/**
 * Handle touch start - start drawing on mobile.
 */
export function onTouchStart(
  e: TouchEvent,
  ctx: MethodPageContext<State>,
  updateStats: () => void
): void {
  e.preventDefault()
  const { canvas, ctx: ctx2d, state } = ctx
  const coords = getCanvasCoords(canvas, e)
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

/**
 * Handle touch move - continue drawing on mobile.
 */
export function onTouchMove(
  e: TouchEvent,
  ctx: MethodPageContext<State>,
  updateStats: () => void
): void {
  e.preventDefault()
  const { canvas, ctx: ctx2d, state } = ctx
  if (!state.isDrawing || state.lastDrawPoint === null) return

  const coords = getCanvasCoords(canvas, e)
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

    draw(ctx2d, state)
    updateStats()
  }
}

/**
 * Handle touch end.
 */
export function onTouchEnd(
  e: TouchEvent,
  ctx: MethodPageContext<State>,
  updateStats: () => void
): void {
  e.preventDefault()
  onMouseUp(ctx, updateStats)
}

// ─── Controller Actions ────────────────────────────────────────────────────────

/**
 * Clear the canvas and reset state.
 */
export function clear(
  state: State,
  ctx2d: CanvasRenderingContext2D,
  updateStats: () => void
): void {
  state.points = []
  state.center = null
  state.avgRadius = 0
  state.perimeter = 0
  state.isDrawing = false
  state.lastDrawPoint = null
  draw(ctx2d, state)
  updateStats()
}

// ─── Controller Factory ────────────────────────────────────────────────────────

/**
 * Creates the full interaction controller for DrawCircle method.
 * This wires up all mouse/touch events and manages the lifecycle.
 */
export function createDrawCircleController(
  ctx: MethodPageContext<State>,
  elements: StatsElements
): {
  clear: () => void
  setSegmentLength: (length: number) => void
  cleanup: () => void
} {
  const { canvas, ctx: ctx2d, state, $id } = ctx

  // Get element references
  const btnClear = $id('btn-clear', HTMLButtonElement)
  const sliderLength = $id('length-slider', HTMLInputElement)
  const elLength = $id('length-val', HTMLElement)

  // Create stats updater
  const updateStats = createStatsUpdater(elements, state)

  // Create bound event handlers
  const boundMouseDown = (e: MouseEvent) => onMouseDown(e, ctx, updateStats)
  const boundMouseMove = (e: MouseEvent) => onMouseMove(e, ctx, updateStats)
  const boundMouseUp = () => onMouseUp(ctx, updateStats)
  const boundTouchStart = (e: TouchEvent) => onTouchStart(e, ctx, updateStats)
  const boundTouchMove = (e: TouchEvent) => onTouchMove(e, ctx, updateStats)
  const boundTouchEnd = (e: TouchEvent) => onTouchEnd(e, ctx, updateStats)

  // Store event handlers in state for cleanup
  state.eventHandlers = {
    mouseMoveHandler: boundMouseMove,
    mouseUpHandler: boundMouseUp,
    touchStartHandler: boundTouchStart,
    touchMoveHandler: boundTouchMove,
    touchEndHandler: boundTouchEnd,
  }

  // Wire up canvas events
  canvas.addEventListener('mousedown', boundMouseDown)
  canvas.addEventListener('mousemove', boundMouseMove)
  canvas.addEventListener('mouseup', boundMouseUp)
  canvas.addEventListener('mouseleave', boundMouseUp)
  canvas.addEventListener('touchstart', boundTouchStart, { passive: false })
  canvas.addEventListener('touchmove', boundTouchMove, { passive: false })
  canvas.addEventListener('touchend', boundTouchEnd)

  // Wire up controls
  btnClear.addEventListener('click', () => clear(state, ctx2d, updateStats))

  sliderLength.addEventListener('input', e => {
    const length = parseInt((e.target as HTMLInputElement).value)
    state.segmentLength = length
    elLength.textContent = `${length}px`
  })

  // Initial draw
  draw(ctx2d, state)
  updateStats()

  return {
    clear: () => clear(state, ctx2d, updateStats),
    setSegmentLength: (length: number) => {
      state.segmentLength = length
      sliderLength.value = length.toString()
      elLength.textContent = `${length}px`
    },
    cleanup: () => {
      canvas.removeEventListener('mousedown', boundMouseDown)
      canvas.removeEventListener('mousemove', boundMouseMove)
      canvas.removeEventListener('mouseup', boundMouseUp)
      canvas.removeEventListener('mouseleave', boundMouseUp)
      canvas.removeEventListener('touchstart', boundTouchStart)
      canvas.removeEventListener('touchmove', boundTouchMove)
      canvas.removeEventListener('touchend', boundTouchEnd)
    },
  }
}
