// ─── Bouncing Boxes Page ─────────────────────────────────────────────────────
// Main page factory for the bouncing boxes method.

import { createMethodPageFactory, statCard, explanation, cleanupController } from '../base/page'
import { State, BASE_CANVAS_W, BASE_CANVAS_H, createInitialState } from './types'
import { createBouncingBoxesController } from './controller'

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
      const { state, $id } = ctx

      // Get element references
      const elK = $id('select-k', HTMLSelectElement)
      const elHits = $id('hits', HTMLElement)
      const elPiApprox = $id('pi-approx', HTMLElement)
      const btnStart = $id('btn-start', HTMLButtonElement)
      const btnReset = $id('btn-reset', HTMLButtonElement)

      // Create controller
      const controller = createBouncingBoxesController(ctx, {
        hits: elHits,
        piApprox: elPiApprox,
        elK,
      })

      // Wire up events
      btnStart.addEventListener('click', controller.start)
      btnReset.addEventListener('click', controller.reset)
      elK.addEventListener('change', () => {
        if (!state.running) {
          state.k = parseInt(elK.value)
          state.m2 = 100 ** state.k
          controller.updateCanvasSize()
        }
      })

      // Store controller for cleanup
      state._controller = controller
    },

    draw(_ctx) {
      // Drawing is handled in init and animation loop
    },

    cleanup(ctx) {
      cleanupController(ctx.state)
      // Also clean up resize observer
      if (ctx.state.resizeObserver) {
        ctx.state.resizeObserver.disconnect()
      }
    },
  }
)
