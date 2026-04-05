// ─── Bouncing Boxes Page ─────────────────────────────────────────────────────
// Main page factory for the bouncing boxes method.

import { createMethodPageFactory, statCard, explanation } from '../base/page'
import { State, BASE_CANVAS_W, BASE_CANVAS_H, BASE_INITIAL_X1, BASE_INITIAL_X2, V0, MOBILE_BREAKPOINT, createInitialState } from './types'
import { updatePhysics, isSimulationComplete, calculatePiApprox } from './physics'
import { createSoundManager } from './sound'
import { draw, calculateCanvasSize } from './rendering'

// ─── Page Factory ────────────────────────────────────────────────────────────
export const createBouncingBoxesPage = createMethodPageFactory<State>(
  {
    title: 'Bouncing Boxes',
    subtitle: "Elastic collisions between two masses reveal π's digits.",
    index: '05',
    canvasWidth: BASE_CANVAS_W,
    canvasHeight: BASE_CANVAS_H,
    controls: `
      <select id="select-k" class="control-select">
        <option value="0">k=0</option>
        <option value="1">k=1</option>
        <option value="2">k=2</option>
        <option value="3">k=3</option>
        <option value="4">k=4</option>
      </select>
      <button class="btn primary" id="btn-start">Start</button>
      <button class="btn" id="btn-reset">Reset</button>
    `,
    statsPanel: `
      ${statCard('π approximation', 'pi-approx', { valueClass: 'stat-value large' })}
      ${statCard('Collisions', 'hits')}
      ${explanation('The Bouncing Boxes Method', [
        'Two boxes with masses 1 and 100^k collide elastically. The number of times the smaller box hits the wall after the first collision gives the first k+1 digits of π.',
        'For k=1, 31 hits → π ≈ 3.1<br>For k=2, 314 hits → π ≈ 3.14',
      ])}
    `,
  },
  createInitialState(),
  {
    init(ctx) {
      const { ctx: ctx2d, state, $id } = ctx

      // Get element references
      const elK = $id('select-k', HTMLSelectElement)
      const elHits = $id('hits', HTMLElement)
      const elPiApprox = $id('pi-approx', HTMLElement)
      const btnStart = $id('btn-start', HTMLButtonElement)
      const btnReset = $id('btn-reset', HTMLButtonElement)

      // Create sound manager
      const soundManager = createSoundManager()

      // Canvas sizing
      function updateCanvasSize(): void {
        const container = ctx.canvas.parentElement
        if (!container) return

        const { width, height, scale } = calculateCanvasSize(
          container.clientWidth,
          window.innerWidth,
          BASE_CANVAS_W,
          BASE_CANVAS_H,
          MOBILE_BREAKPOINT
        )

        ctx.canvas.width = width
        ctx.canvas.height = height
        state.scale = scale

        render()
      }

      // Render current state
      function render(): void {
        draw(ctx2d, state, ctx.canvas.width, ctx.canvas.height)
      }

      // Animation tick
      function tick(timestamp: number): void {
        if (!state.running) return

        updatePhysics(state, timestamp, () => soundManager.playCollision())
        render()

        // Update stats
        elHits.textContent = state.collisions.toString()
        const piApprox = calculatePiApprox(state.collisions, state.k)
        elPiApprox.textContent = piApprox.toFixed(state.k)

        // Check for completion
        if (isSimulationComplete(state)) {
          state.simulationComplete = true
          stop()
        }

        if (state.running) {
          state.rafId = requestAnimationFrame(tick)
        }
      }

      function start(): void {
        if (state.running) return
        resetState()
        state.k = parseInt(elK.value)
        state.m2 = 100 ** state.k
        state.running = true
        elK.disabled = true
        btnStart.textContent = 'Running…'
        state.rafId = requestAnimationFrame(tick)
      }

      function stop(): void {
        state.running = false
        elK.disabled = false
        btnStart.textContent = 'Start'
        if (state.rafId !== null) {
          cancelAnimationFrame(state.rafId)
          state.rafId = null
        }
      }

      function resetState(): void {
        state.k = 0
        state.m2 = 100 ** state.k
        state.smallBoxX = BASE_INITIAL_X1
        state.smallBoxV = 0
        state.largeBoxX = BASE_INITIAL_X2
        state.largeBoxV = -V0
        state.collisions = 0
        state.running = false
        state.rafId = null
        state.time = 0
        state.pendingCollisions = 0
        state.simulationComplete = false
        state.vibrationOffset = 0
      }

      function reset(): void {
        stop()
        resetState()
        render()
        elHits.textContent = '0'
        elPiApprox.textContent = '0'
      }

      function onKChange(): void {
        if (state.running) return
        state.k = parseInt(elK.value)
        state.m2 = 100 ** state.k
        render()
      }

      // Set up resize handling
      state.resizeObserver = new ResizeObserver(() => {
        updateCanvasSize()
      })
      state.resizeObserver.observe(ctx.canvas.parentElement!)

      // Initial size
      updateCanvasSize()

      // Wire up events
      btnStart.addEventListener('click', start)
      btnReset.addEventListener('click', reset)
      elK.addEventListener('change', onKChange)
    },

    cleanup(ctx) {
      const { state } = ctx
      state.running = false
      if (state.rafId !== null) {
        cancelAnimationFrame(state.rafId)
        state.rafId = null
      }
      if (state.soundTimeout) clearTimeout(state.soundTimeout)
      if (state.resizeObserver) state.resizeObserver.disconnect()
    },
  }
)
