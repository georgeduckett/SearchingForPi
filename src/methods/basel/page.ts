// ─── Basel Problem Page ──────────────────────────────────────────────────────
// Main page factory for the Basel problem method.

import { getInsideColor, getAmberColor, CANVAS_SIZE } from '../../colors'
import {
  createMethodPageFactory,
  statCard,
  legend,
  explanation,
  cleanupController,
} from '../base/page'
import { State, MAX_TERMS, createInitialState } from './types'
import { createBaselController, StatsElements } from './controller'

// ─── Page Factory ────────────────────────────────────────────────────────────
export const createBaselPage = createMethodPageFactory<State>(
  {
    title: 'Basel Problem',
    subtitle: 'The sum of reciprocal squares converges to π²/6.',
    index: '09',
    canvasWidth: CANVAS_SIZE,
    canvasHeight: CANVAS_SIZE,
    controls: `
      <button class="btn primary" id="btn-start">Start</button>
      <button class="btn" id="btn-step">Add Term</button>
      <button class="btn" id="btn-reset" disabled>Reset</button>
    `,
    statsPanel: `
      ${statCard('π estimate √(6×sum)', 'estimate', { valueClass: 'stat-value large', errorId: 'error' })}
      ${statCard('Current sum ∑1/n²', 'sum', { subtext: '→ π²/6 ≈ 1.6449' })}
      ${statCard('Terms added', 'terms', { subtext: `of ${MAX_TERMS} max` })}
      ${legend([
        { color: getInsideColor(), text: 'Cumulative sum' },
        { color: getAmberColor(), text: 'Limit π²/6' },
      ])}
      ${explanation(
        'How it works',
        [
          'Euler proved in 1734 that the sum of reciprocal squares equals π²/6. This was a famous open problem known as the Basel Problem.',
          'Each term 1/n² is visualized as a rectangle. The total height of all rectangles approaches π²/6 ≈ 1.6449. Therefore π ≈ √(6 × sum).',
        ],
        '∑₁^∞ 1/n² = π²/6'
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
        sum: $id('sum', HTMLElement),
        error: $id('error', HTMLElement),
      }

      // Create and store the controller
      const controller = createBaselController(ctx, statsElements)

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
