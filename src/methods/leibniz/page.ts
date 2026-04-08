// ─── Leibniz Series Page ─────────────────────────────────────────────────────
// Main page factory for the Leibniz series method.

import { getInsideColor, getOutsideColor, getAmberColor } from '../../colors'
import {
  createMethodPageFactory,
  statCard,
  legend,
  explanation,
  cleanupController,
} from '../base/page'
import { State, CANVAS_W, CANVAS_H, MAX_TERMS, createInitialState } from './types'
import { createLeibnizController, StatsElements } from './controller'

// ─── Page Factory ────────────────────────────────────────────────────────────
export const createLeibnizPage = createMethodPageFactory<State>(
  {
    title: 'Leibniz Series',
    subtitle: 'An infinite alternating series with an unexpectedly beautiful limit.',
    index: '02',
    canvasWidth: CANVAS_W,
    canvasHeight: CANVAS_H,
    controls: `
	<button class="btn primary" id="btn-start">Start</button>
	<button class="btn" id="btn-step">Step</button>
	<button class="btn" id="btn-reset" disabled>Reset</button>
	`,
    statsPanel: `
	${statCard('π estimate', 'estimate', { valueClass: 'stat-value large' })}
	<div class="stat-card">
		<div class="stat-label">Error vs true π</div>
		<div class="stat-value" style="font-size:1.4rem" id="error">—</div>
	</div>
	${statCard('Terms computed', 'terms', { subtext: `of ${MAX_TERMS.toLocaleString()} max` })}
	<div class="stat-card">
		<div class="stat-label">Current term value</div>
		<div class="stat-value" style="font-size:1.1rem; color: var(--text-secondary)" id="current-term">—</div>
	</div>
	${legend([
    { color: getInsideColor(), text: 'Positive term (+1/(2n+1))' },
    { color: getOutsideColor(), text: 'Negative term (−1/(2n+1))' },
    { color: getAmberColor(), text: 'Running π estimate' },
  ])}
	${explanation(
    'The Leibniz Formula',
    [
      'Discovered by Leibniz in 1676 (and by Madhava two centuries earlier), each term alternately overshoots and undershoots π/4. The series converges — but slowly. After 500 terms the error is still around 0.002.',
      'Use <em>Step</em> to add one term at a time, or <em>Start</em> to run automatically.',
    ],
    'π/4 = 1 − 1/3 + 1/5 − 1/7 + …'
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
        terms: $id('terms', HTMLElement),
        currentTerm: $id('current-term', HTMLElement),
        error: $id('error', HTMLElement),
      }

      // Create and store the controller
      const controller = createLeibnizController(ctx, statsElements)

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
