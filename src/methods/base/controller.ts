// ─── Animation Controller ─────────────────────────────────────────────────────
// A high-level controller that combines animation loops with button wiring
// and state management for common method page patterns.

import type { MethodPageContext } from './page/types'
import { createFrameAnimation, createIntervalAnimation, type FrameAnimationLoop, type IntervalAnimationLoop } from './animation'

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Base state interface for animation controllers.
 * Pages using the controller must extend this interface.
 */
export interface AnimationStateBase {
  /** Whether the animation is currently running */
  running: boolean
  /** Animation frame or interval ID for cleanup */
  rafId?: number | null
  intervalId?: ReturnType<typeof setInterval> | null
}

/**
 * Configuration for standard Start/Step/Reset buttons.
 */
export interface StandardButtonsConfig {
  /** Start button element */
  btnStart: HTMLButtonElement
  /** Step button element (optional) */
  btnStep?: HTMLButtonElement | null
  /** Reset button element */
  btnReset: HTMLButtonElement
  /** Label for start button when ready to start (default: 'Start') */
  startLabel?: string
  /** Label for start button when running (default: 'Running…') */
  runningLabel?: string
  /** Label for start button when paused (default: 'Resume') */
  resumeLabel?: string
  /** Label for start button when complete (default: 'Done') */
  doneLabel?: string
}

/**
 * Configuration for frame-based animation controller.
 */
export interface FrameControllerConfig<S extends AnimationStateBase> {
  /** The page context */
  ctx: MethodPageContext<S>
  /** Button configuration */
  buttons: StandardButtonsConfig
  /** Called each frame to update state */
  update: (state: S, dt: number) => void
  /** Called each frame to render */
  draw: (ctx: MethodPageContext<S>) => void
  /** Called to check if animation should stop (beyond running flag) */
  isComplete?: (state: S) => boolean
  /** Called when animation completes naturally */
  onComplete?: () => void
  /** Called when reset is triggered */
  onReset: () => void
  /** Called for step button click (if btnStep provided) */
  onStep?: () => void
  /** Called after starting */
  onStart?: () => void
  /** Called after stopping */
  onStop?: () => void
}

/**
 * Configuration for interval-based animation controller.
 */
export interface IntervalControllerConfig<S extends AnimationStateBase> {
  /** The page context */
  ctx: MethodPageContext<S>
  /** Button configuration */
  buttons: StandardButtonsConfig
  /** Interval in milliseconds between ticks */
  intervalMs: number
  /** Called each interval tick */
  tick: (ctx: MethodPageContext<S>) => void
  /** Called to check if animation should stop (beyond running flag) */
  isComplete?: (state: S) => boolean
  /** Called when animation completes naturally */
  onComplete?: () => void
  /** Called when reset is triggered */
  onReset: () => void
  /** Called for step button click (if btnStep provided) */
  onStep?: () => void
  /** Called after starting */
  onStart?: () => void
  /** Called after stopping */
  onStop?: () => void
}

/**
 * Controller interface returned by factory functions.
 * Provides a unified API for controlling animations regardless of the underlying implementation.
 */
export interface AnimationController {
  /** Start the animation (resumes from paused state if applicable) */
  start(): void
  /** Stop/pause the animation (preserves current state) */
  stop(): void
  /** Toggle between running and paused states */
  toggle(): void
  /** Reset to initial state and stop animation */
  reset(): void
  /** Perform a single step (only works when not running) */
  step(): void
  /** Check if animation is currently running */
  isRunning(): boolean
  /** Cleanup resources (stop animation, remove listeners) */
  cleanup(): void
}

// ─── Frame-Based Controller ───────────────────────────────────────────────────

/**
 * Creates a frame-based animation controller with standard button wiring.
 *
 * This controller uses requestAnimationFrame for smooth, frame-based animations.
 * Best suited for continuous simulations and physics-based methods where
 * delta time between frames matters (e.g., Monte Carlo, Bouncing Boxes).
 *
 * @typeParam S - The state type, must extend AnimationStateBase
 * @param config - Configuration object containing:
 *   - ctx: The page context with state and canvas
 *   - buttons: Button element references and label options
 *   - update: Function called each frame with delta time
 *   - draw: Function called each frame to render
 *   - isComplete: Optional function to check if animation should stop
 *   - onComplete: Optional callback when animation completes
 *   - onReset: Required callback to reset state
 *   - onStep: Optional callback for single-step mode
 *   - onStart: Optional callback after starting
 *   - onStop: Optional callback after stopping
 * @returns AnimationController with start, stop, toggle, reset, step, isRunning, cleanup
 *
 * @example
 * ```ts
 * const controller = createFrameController({
 * ctx,
 * buttons: { btnStart, btnStep, btnReset },
 * update: (state, dt) => { state.progress += dt },
 * draw: (ctx) => { render(ctx) },
 * onReset: () => { resetState() },
 * onStep: () => { addSingleDot() },
 * })
 *
 * // Buttons are automatically wired up
 * // Just call cleanup() in the page's cleanup method
 * ```
 */
export function createFrameController<S extends AnimationStateBase>(
  config: FrameControllerConfig<S>
): AnimationController {
  const { ctx, buttons, update, draw, isComplete, onComplete, onReset, onStep, onStart, onStop } = config
  const { btnStart, btnStep, btnReset, startLabel = 'Start', runningLabel = 'Running…', resumeLabel = 'Resume', doneLabel = 'Done' } = buttons

  let animation: FrameAnimationLoop | null = null

  // Create the animation loop
  animation = createFrameAnimation(ctx, {
    update,
    draw,
    isRunning: (state) => state.running && !isComplete?.(state),
    onComplete: () => {
      btnStart.textContent = doneLabel
      btnStart.disabled = true
      onComplete?.()
    },
  })

  function start(): void {
    if (ctx.state.running) return
    ctx.state.running = true
    btnStart.textContent = runningLabel
    btnStart.disabled = true
    btnReset.disabled = false
    animation?.start()
    if ('rafId' in ctx.state) {
      ctx.state.rafId = animation?.getFrameId() ?? null
    }
    onStart?.()
  }

  function stop(): void {
    if (!ctx.state.running) return
    ctx.state.running = false
    animation?.stop()
    btnStart.textContent = resumeLabel
    btnStart.disabled = false
    onStop?.()
  }

  function toggle(): void {
    if (ctx.state.running) {
      stop()
    } else {
      start()
    }
  }

  function reset(): void {
    animation?.stop()
    ctx.state.running = false
    onReset()
    btnStart.textContent = startLabel
    btnStart.disabled = false
    btnReset.disabled = true
  }

  function step(): void {
    if (ctx.state.running) return
    onStep?.()
  }

  function cleanup(): void {
    animation?.stop()
  }

  // Wire up buttons
  btnStart.addEventListener('click', () => {
    if (isComplete?.(ctx.state)) {
      reset()
      start()
    } else {
      toggle()
    }
  })

  if (btnStep) {
    btnStep.addEventListener('click', () => {
      step()
    })
  }

  btnReset.addEventListener('click', reset)

  return { start, stop, toggle, reset, step, isRunning: () => ctx.state.running, cleanup }
}

// ─── Interval-Based Controller ────────────────────────────────────────────────

/**
 * Creates an interval-based animation controller with standard button wiring.
 *
 * This controller uses setInterval for fixed-timestep animations.
 * Best suited for series/sequence visualizations where consistent timing
 * matters more than frame-perfect rendering (e.g., Leibniz Series).
 *
 * @typeParam S - The state type, must extend AnimationStateBase
 * @param config - Configuration object containing:
 *   - ctx: The page context with state and canvas
 *   - buttons: Button element references and label options
 *   - intervalMs: Milliseconds between each tick
 *   - tick: Function called each interval
 *   - isComplete: Optional function to check if animation should stop
 *   - onComplete: Optional callback when animation completes
 *   - onReset: Required callback to reset state
 *   - onStep: Optional callback for single-step mode
 *   - onStart: Optional callback after starting
 *   - onStop: Optional callback after stopping
 * @returns AnimationController with start, stop, toggle, reset, step, isRunning, cleanup
 *
 * @example
 * ```ts
 * const controller = createIntervalController({
 * ctx,
 * buttons: { btnStart, btnStep, btnReset },
 * intervalMs: 40,
 * tick: (ctx) => { addTerm(ctx.state) },
 * onReset: () => { resetState() },
 * onStep: () => { addSingleTerm() },
 * })
 * ```
 */
export function createIntervalController<S extends AnimationStateBase>(
  config: IntervalControllerConfig<S>
): AnimationController {
  const { ctx, buttons, intervalMs, tick, isComplete, onComplete, onReset, onStep, onStart, onStop } = config
  const { btnStart, btnStep, btnReset, startLabel = 'Start', runningLabel = 'Running…', resumeLabel = 'Resume', doneLabel = 'Done' } = buttons

  let animation: IntervalAnimationLoop | null = null

  // Create the animation loop
  animation = createIntervalAnimation(ctx, {
    intervalMs,
    tick,
    isRunning: (state) => state.running && !isComplete?.(state),
    onComplete: () => {
      btnStart.textContent = doneLabel
      btnStart.disabled = true
      onComplete?.()
    },
  })

  function start(): void {
    if (ctx.state.running) return
    ctx.state.running = true
    btnStart.textContent = runningLabel
    btnStart.disabled = true
    btnReset.disabled = false
    animation?.start()
    if ('intervalId' in ctx.state) {
      ctx.state.intervalId = animation?.getIntervalId() ?? null
    }
    onStart?.()
  }

  function stop(): void {
    if (!ctx.state.running) return
    ctx.state.running = false
    animation?.stop()
    btnStart.textContent = resumeLabel
    btnStart.disabled = false
    onStop?.()
  }

  function toggle(): void {
    if (ctx.state.running) {
      stop()
    } else {
      start()
    }
  }

  function reset(): void {
    animation?.stop()
    ctx.state.running = false
    onReset()
    btnStart.textContent = startLabel
    btnStart.disabled = false
    btnReset.disabled = true
  }

  function step(): void {
    if (ctx.state.running) return
    onStep?.()
  }

  function cleanup(): void {
    animation?.stop()
  }

  // Wire up buttons
  btnStart.addEventListener('click', () => {
    if (isComplete?.(ctx.state)) {
      reset()
      start()
    } else {
      toggle()
    }
  })

  if (btnStep) {
    btnStep.addEventListener('click', () => {
      step()
    })
  }

  btnReset.addEventListener('click', reset)

  return { start, stop, toggle, reset, step, isRunning: () => ctx.state.running, cleanup }
}

// ─── Simple Button Binder ─────────────────────────────────────────────────────

/**
 * Simple button binding for pages that need manual control.
 * Use this when you need custom animation logic but still want standard button wiring.
 */
export interface SimpleButtonBinder {
  /** Bind start button with handler */
  onStart(handler: () => void): void
  /** Bind step button with handler (if exists) */
  onStep(handler: () => void): void
  /** Bind reset button with handler */
  onReset(handler: () => void): void
  /** Update button states for running */
  setRunning(running: boolean): void
  /** Update button states for completion */
  setComplete(): void
}

/**
 * Creates a simple button binder for manual control.
 */
export function bindButtons(buttons: StandardButtonsConfig): SimpleButtonBinder {
  const { btnStart, btnStep, btnReset, runningLabel = 'Running…', resumeLabel = 'Resume', doneLabel = 'Done' } = buttons

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
