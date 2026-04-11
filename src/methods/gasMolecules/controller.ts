// ─── Gas Molecules Controller ──────────────────────────────────────────────────
// Animation control logic for the gas molecules method.
// Extracted from page.ts for better separation of concerns.

import { fmt } from '../../utils'
import type { MethodPageContext } from '../base/page/types'
import {
  State,
  MAX_PARTICLES,
  TICKS_PER_FRAME,
  CONTAINER_PAD,
  PARTICLE_RADIUS,
  gaussianRandom,
  estimatePi,
  calculateAvgSpeed,
} from './types'
import { physicsStep } from './physics'
import { draw } from './rendering'

// ─── Stats Element References ──────────────────────────────────────────────────

export interface StatsElements {
  estimate: HTMLElement
  particles: HTMLElement
  avgSpeed: HTMLElement
  error: HTMLElement
}

// ─── Stats Management ──────────────────────────────────────────────────────────

/**
 * Creates a stats updater function for GasMolecules method.
 */
export function createStatsUpdater(elements: StatsElements, state: State): () => void {
  return function updateStats(): void {
    const piEstimate = estimatePi(state.particles, state.temperature)
    const error = Math.abs(piEstimate - Math.PI)
    const avgSpeed = calculateAvgSpeed(state.particles)

    elements.estimate.textContent = state.particles.length < 10 ? '—' : fmt(piEstimate)
    elements.particles.textContent = state.particles.length.toLocaleString()
    elements.avgSpeed.textContent = avgSpeed.toFixed(2)

    if (state.particles.length >= 10) {
      elements.error.textContent = `Error: ${fmt(error)}`
      elements.error.className = 'stat-error ' + (error < 0.5 ? 'improving' : 'neutral')
    } else {
      elements.error.textContent = 'Error: —'
      elements.error.className = 'stat-error neutral'
    }
  }
}

// ─── Controller Actions ────────────────────────────────────────────────────────

/**
 * Add a particle with random velocity based on temperature.
 */
export function addParticle(state: State, canvasWidth: number, canvasHeight: number): void {
  const W = canvasWidth - CONTAINER_PAD * 2 - PARTICLE_RADIUS * 2
  const H = canvasHeight - CONTAINER_PAD * 2 - PARTICLE_RADIUS * 2

  // Maxwell-Boltzmann uses Gaussian velocity components
  const sigma = Math.sqrt(state.temperature)
  const vx = gaussianRandom() * sigma
  const vy = gaussianRandom() * sigma

  state.particles.push({
    x: CONTAINER_PAD + PARTICLE_RADIUS + Math.random() * W,
    y: CONTAINER_PAD + PARTICLE_RADIUS + Math.random() * H,
    vx,
    vy,
  })
}

/**
 * Add multiple particles.
 */
export function addParticles(
  state: State,
  count: number,
  canvasWidth: number,
  canvasHeight: number,
  ctx2d: CanvasRenderingContext2D,
  updateStats: () => void
): void {
  for (let i = 0; i < count && state.particles.length < MAX_PARTICLES; i++) {
    addParticle(state, canvasWidth, canvasHeight)
  }
  draw(ctx2d, state)
  updateStats()
}

/**
 * Animation tick for frame-based animation.
 */
export function tick(
  state: State,
  canvasWidth: number,
  canvasHeight: number,
  ctx2d: CanvasRenderingContext2D,
  updateStats: () => void
): void {
  if (!state.running) return

  for (let i = 0; i < TICKS_PER_FRAME; i++) {
    physicsStep(state.particles, canvasWidth, canvasHeight, state.temperature, state.steps)
    state.steps++
  }

  draw(ctx2d, state)
  updateStats()
  state.rafId = requestAnimationFrame(() =>
    tick(state, canvasWidth, canvasHeight, ctx2d, updateStats)
  )
}

/**
 * Start the automatic animation.
 */
export function start(
  state: State,
  canvasWidth: number,
  canvasHeight: number,
  ctx2d: CanvasRenderingContext2D,
  updateStats: () => void,
  buttons: { btnStart: HTMLButtonElement; btnReset: HTMLButtonElement }
): void {
  if (state.particles.length === 0) {
    addParticles(state, 50, canvasWidth, canvasHeight, ctx2d, updateStats)
  }
  state.running = true
  buttons.btnStart.disabled = true
  buttons.btnReset.disabled = false
  buttons.btnStart.textContent = 'Running…'
  state.rafId = requestAnimationFrame(() =>
    tick(state, canvasWidth, canvasHeight, ctx2d, updateStats)
  )
}

/**
 * Reset to initial state.
 */
export function reset(
  state: State,
  _canvasWidth: number,
  _canvasHeight: number,
  ctx2d: CanvasRenderingContext2D,
  buttons: { btnStart: HTMLButtonElement; btnReset: HTMLButtonElement },
  updateStats: () => void
): void {
  state.running = false
  if (state.rafId !== null) cancelAnimationFrame(state.rafId)
  state.particles = []
  state.steps = 0
  draw(ctx2d, state)
  updateStats()
  buttons.btnStart.disabled = false
  buttons.btnStart.textContent = 'Start'
  buttons.btnReset.disabled = true
}

// ─── Controller Factory ────────────────────────────────────────────────────────

/**
 * Creates the full animation controller for GasMolecules method.
 * This wires up all buttons and manages the animation lifecycle.
 */
export function createGasMoleculesController(
  ctx: MethodPageContext<State>,
  elements: StatsElements
): {
  start: () => void
  reset: () => void
  addParticles: (count: number) => void
  setTemperature: (temp: number) => void
  cleanup: () => void
} {
  const { canvas, ctx: ctx2d, state } = ctx
  const $required = ctx.$required.bind(ctx)

  // Get button references
  const btnStart = $required('#gm-start') as HTMLButtonElement
  const btnAdd = $required('#gm-add') as HTMLButtonElement
  const btnReset = $required('#gm-reset') as HTMLButtonElement
  const tempSlider = $required('#gm-temp') as HTMLInputElement
  const tempVal = $required('#gm-temp-val')

  const buttons = { btnStart, btnReset }

  // Create stats updater
  const updateStats = createStatsUpdater(elements, state)

  // Initial draw
  draw(ctx2d, state)
  updateStats()

  // Wire up buttons
  btnStart.addEventListener('click', () => {
    if (!state.running) {
      start(state, canvas.width, canvas.height, ctx2d, updateStats, buttons)
    }
  })

  btnAdd.addEventListener('click', () => {
    if (!state.running) {
      addParticles(state, 10, canvas.width, canvas.height, ctx2d, updateStats)
      btnReset.disabled = false
    }
  })

  btnReset.addEventListener('click', () => {
    reset(state, canvas.width, canvas.height, ctx2d, buttons, updateStats)
  })

  // Temperature slider
  tempSlider.addEventListener('input', e => {
    const temp = parseFloat((e.target as HTMLInputElement).value)
    state.temperature = temp
    tempVal.textContent = temp.toFixed(1)
  })

  return {
    start: () => start(state, canvas.width, canvas.height, ctx2d, updateStats, buttons),
    reset: () => reset(state, canvas.width, canvas.height, ctx2d, buttons, updateStats),
    addParticles: (count: number) =>
      addParticles(state, count, canvas.width, canvas.height, ctx2d, updateStats),
    setTemperature: (temp: number) => {
      state.temperature = temp
      tempSlider.value = temp.toString()
      tempVal.textContent = temp.toFixed(1)
    },
    cleanup: () => {
      state.running = false
      if (state.rafId !== null) {
        cancelAnimationFrame(state.rafId)
        state.rafId = null
      }
    },
  }
}
