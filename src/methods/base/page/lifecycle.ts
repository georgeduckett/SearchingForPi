// ─── Animation Lifecycle Management ───────────────────────────────────────────
// Utilities for managing animation frame lifecycle in page factories.

/**
 * Tracks animation state and provides lifecycle management.
 */
export interface AnimationLifecycle {
  /** Current animation frame ID, if running */
  animationId: number | null
  /** Whether the animation is currently running */
  running: boolean
}

/**
 * Creates a new animation lifecycle tracker.
 */
export function createAnimationLifecycle(): AnimationLifecycle {
  return {
    animationId: null,
    running: false,
  }
}

/**
 * Cancels any pending animation frame and resets state.
 */
export function cancelAnimation(lifecycle: AnimationLifecycle): void {
  if (lifecycle.animationId !== null) {
    cancelAnimationFrame(lifecycle.animationId)
    lifecycle.animationId = null
  }
  lifecycle.running = false
}

/**
 * Starts an animation loop using requestAnimationFrame.
 * Returns a function to stop the animation.
 */
export function startAnimationLoop(
  lifecycle: AnimationLifecycle,
  callback: (timestamp: number) => void
): () => void {
  let stopped = false

  function tick(timestamp: number): void {
    if (stopped) return
    lifecycle.animationId = requestAnimationFrame(tick)
    callback(timestamp)
  }

  lifecycle.animationId = requestAnimationFrame(tick)
  lifecycle.running = true

  return () => {
    stopped = true
    cancelAnimation(lifecycle)
  }
}

// ─── State Management ─────────────────────────────────────────────────────────

/**
 * Creates a deep copy of the initial state for a page.
 * Uses JSON serialization for a simple deep clone.
 */
export function cloneState<S>(initialState: S): S {
  return JSON.parse(JSON.stringify(initialState))
}

// ─── Page Lifecycle Helpers ───────────────────────────────────────────────────

/**
 * Creates a deferred initialization that runs after the current call stack.
 * This is useful for running setup code after DOM elements are available.
 */
export function deferInit(callback: () => void, delay = 0): void {
  setTimeout(callback, delay)
}

/**
 * Creates a cleanup function that cancels animations and calls optional cleanup.
 */
export function createCleanupFunction(
  lifecycle: AnimationLifecycle,
  onCleanup?: () => void
): () => void {
  return () => {
    cancelAnimation(lifecycle)
    onCleanup?.()
  }
}

// ─── Controller Cleanup Helper ────────────────────────────────────────────────

/**
 * State interface for pages that store a controller reference.
 */
export interface ControllerState {
  /** Controller instance for cleanup (set during init) */
  _controller?: { cleanup(): void }
}

/**
 * Cleans up a controller stored in the state.
 * This is a convenience helper for the common cleanup pattern.
 *
 * @example
 * ```ts
 * cleanup(ctx) {
 *   cleanupController(ctx.state)
 * }
 * ```
 */
export function cleanupController<S extends ControllerState>(state: S): void {
  state._controller?.cleanup()
}
