// ─── Animation Loop Helper ───────────────────────────────────────────────────
// Provides a requestAnimationFrame-based animation loop with lifecycle management.

import type { PageContext } from './page'

/**
 * Options for configuring an animation loop.
 */
export interface AnimationOptions<S> {
  /** Called each frame with delta time in seconds */
  update(state: S, dt: number): void
  /** Called each frame to render */
  draw(ctx: PageContext<S>): void
  /** Check if animation should continue */
  isRunning(state: S): boolean
}

/**
 * Animation loop controller returned by createAnimationLoop.
 */
export interface AnimationLoop {
  /** Start the animation loop */
  start: () => void
  /** Stop the animation loop */
  stop: () => void
  /** Check if the loop is currently running */
  isRunning: () => boolean
}

/**
 * Creates a requestAnimationFrame-based animation loop.
 * Handles starting, stopping, and cleanup automatically.
 *
 * @example
 * ```ts
 * const loop = createAnimationLoop(context, {
 *   update: (state, dt) => { state.progress += dt },
 *   draw: (ctx) => { renderState(ctx) },
 *   isRunning: (state) => state.running
 * })
 * loop.start()
 * ```
 */
export function createAnimationLoop<S>(
  context: PageContext<S>,
  options: AnimationOptions<S>
): AnimationLoop {
  let animationId: number | null = null
  let lastTime = 0

  function tick(timestamp: number): void {
    if (!options.isRunning(context.state)) {
      animationId = null
      return
    }

    const dt = lastTime ? (timestamp - lastTime) / 1000 : 0
    lastTime = timestamp

    options.update(context.state, dt)
    options.draw(context)

    animationId = requestAnimationFrame(tick)
  }

  return {
    start() {
      if (animationId === null) {
        lastTime = 0
        animationId = requestAnimationFrame(tick)
      }
    },
    stop() {
      if (animationId !== null) {
        cancelAnimationFrame(animationId)
        animationId = null
      }
    },
    isRunning() {
      return animationId !== null
    },
  }
}
