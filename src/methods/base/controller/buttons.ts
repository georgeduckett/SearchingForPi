// ─── Button Binding Utilities ─────────────────────────────────────────────────
// Simple button binding for pages that need manual control.

import type { StandardButtonsConfig, SimpleButtonBinder } from './types'

/**
 * Creates a simple button binder for manual control.
 * Use this when you need custom animation logic but still want standard button wiring.
 *
 * @example
 * ```ts
 * const binder = bindButtons({ btnStart, btnStep, btnReset })
 * binder.onStart(() => { startAnimation() })
 * binder.onStep(() => { singleStep() })
 * binder.onReset(() => { resetState() })
 * binder.setRunning(true) // Update button labels
 * ```
 */
export function bindButtons(buttons: StandardButtonsConfig): SimpleButtonBinder {
  const {
    btnStart,
    btnStep,
    btnReset,
    runningLabel = 'Running…',
    resumeLabel = 'Resume',
    doneLabel = 'Done',
  } = buttons

  let startHandler: (() => void) | null = null
  let stepHandler: (() => void) | null = null
  let resetHandler: (() => void) | null = null

  btnStart.addEventListener('click', () => startHandler?.())
  btnStep?.addEventListener('click', () => stepHandler?.())
  btnReset.addEventListener('click', () => resetHandler?.())

  return {
    onStart(handler) {
      startHandler = handler
    },
    onStep(handler) {
      stepHandler = handler
    },
    onReset(handler) {
      resetHandler = handler
    },
    setRunning(running) {
      btnStart.textContent = running ? runningLabel : resumeLabel
      btnStart.disabled = running
      if (running) {
        btnReset.disabled = false
      }
    },
    setComplete() {
      btnStart.textContent = doneLabel
      btnStart.disabled = true
    },
  }
}
