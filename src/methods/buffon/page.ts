// ─── Buffon's Needle Page ────────────────────────────────────────────────────
// Main page factory for the Buffon's needle method.

import { createMethodPageFactory, statCard, explanation, cleanupController } from '../base/page'
import { State, NEEDLE_LENGTH, MAX_NEEDLES, createInitialState } from './types'
import { createBuffonController, StatsElements } from './controller'

// ─── Page Factory ────────────────────────────────────────────────────────────
export const createBuffonPage = createMethodPageFactory<State>(
  {
    title: "Buffon's Needle",
    subtitle: 'A 1777 probability puzzle whose answer is written in π.',
    index: '03',
    canvasWidth: 560,
    canvasHeight: 420,
    controls: `
      <button class="btn primary" id="btn-start">Start</button>
      <button class="btn" id="btn-step">Drop one</button>
      <button class="btn" id="btn-reset" disabled>Reset</button>
    `,
    statsPanel: `
      ${statCard('π estimate', 'estimate', { valueClass: 'stat-value large', errorId: 'error', progressId: 'progress' })}
      ${statCard('Needles dropped', 'total', { subtext: `of ${MAX_NEEDLES.toLocaleString()} total` })}
      ${statCard('Crossings', 'crosses')}
      ${explanation(
        'How it works',
        [
          `Drop a needle of length <em>l</em> at random onto a surface ruled with parallel lines spaced <em>d</em> apart (here both are ${NEEDLE_LENGTH}px). The probability it crosses a line is:`,
          'Rearranging: π = 2l / (d × P). We estimate P by counting crossings over many throws.',
          'A needle crosses when its perpendicular projection reaches a ruled line — i.e. when ½l·|sin θ| ≥ distance to nearest line.',
          'Use <em>Drop one</em> to watch individual needles fall, or <em>Start</em> to run the full simulation.',
        ],
        'P = 2l / (d × π)'
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
        crosses: $id('crosses', HTMLElement),
        error: $id('error', HTMLElement),
        progress: $id('progress', HTMLElement),
      }

      // Create and store the controller
      const controller = createBuffonController(ctx, statsElements)

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
