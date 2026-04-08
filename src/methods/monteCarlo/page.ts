// ─── Monte Carlo Page ────────────────────────────────────────────────────────
// Main page factory for the Monte Carlo method.

import { getInsideColor, getOutsideColor, CANVAS_SIZE } from '../../colors'
import {
  createMethodPageFactory,
  statCard,
  legend,
  explanation,
  cleanupController,
} from '../base/page'
import { State, MAX_DOTS, createInitialState } from './types'
import { createMonteCarloController, StatsElements } from './controller'

// ─── Page Factory ────────────────────────────────────────────────────────────
export const createMonteCarloPage = createMethodPageFactory<State>(
  {
    title: 'Monte Carlo',
    subtitle: 'Random sampling reveals structure — and π.',
    index: '01',
    canvasWidth: CANVAS_SIZE,
    canvasHeight: CANVAS_SIZE,
    controls: `
	<button class="btn primary" id="btn-start">Start</button>
	<button class="btn" id="btn-step">Add 10</button>
	<button class="btn" id="btn-reset" disabled>Reset</button>
	`,
    statsPanel: `
	${statCard('π estimate', 'estimate', { valueClass: 'stat-value large', errorId: 'error', progressId: 'progress' })}
	${statCard('Points plotted', 'total', { subtext: `of ${MAX_DOTS.toLocaleString()} total` })}
	${legend([
    { color: getInsideColor(), text: 'Inside circle' },
    { color: getOutsideColor(), text: 'Outside circle' },
  ])}
	${explanation(
    'How it works',
    [
      'We scatter random points inside a unit square that contains an inscribed circle of radius ½.',
      'Because the area of the circle is πr² and the square is (2r)², the probability of a random point landing inside the circle is π/4.',
      'The more points we sample, the closer our estimate converges to π — but the convergence is slow: halving the error requires quadrupling the samples.',
    ],
    'π ≈ 4 × (inside / total)'
  )}
	`,
  },
  createInitialState(),
  {
    init(ctx) {
      const { $id } = ctx

      // Get stats element references
      const statsElements: StatsElements = {
        estimate: $id('estimate', HTMLElement),
        total: $id('total', HTMLElement),
        error: $id('error', HTMLElement),
        progress: $id('progress', HTMLElement),
      }

      // Create and store the controller
      const controller = createMonteCarloController(ctx, statsElements)

      // Store controller for cleanup
      ctx.state._controller = controller
    },

    draw(_ctx) {
      // Drawing is handled in init and animation loop
    },

    cleanup(ctx) {
      cleanupController(ctx.state)
    },
  }
)
