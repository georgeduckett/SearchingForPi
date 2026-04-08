// ─── DOM Query Helpers ────────────────────────────────────────────────────────
// Utilities for querying and manipulating DOM elements in page factories.

import { queryRequired } from '../../../utils'

// ─── Canvas Setup ─────────────────────────────────────────────────────────────

/**
 * Gets the canvas element and its 2D context from the DOM.
 * Throws if not found or if 2D context is unavailable.
 */
export function getCanvasContext(): {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
} {
  const canvas = queryRequired(document, '#canvas', HTMLCanvasElement)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get 2D context')
  return { canvas, ctx }
}

// ─── Element Queries ──────────────────────────────────────────────────────────

/**
 * Gets a button element by ID, returns null if not found.
 */
export function getButton(id: string): HTMLButtonElement | null {
  const el = document.getElementById(id)
  return el instanceof HTMLButtonElement ? el : null
}

/**
 * Gets a required button element by ID, throws if not found.
 */
export function getRequiredButton(id: string): HTMLButtonElement {
  return queryRequired(document, `#${id}`, HTMLButtonElement)
}

/**
 * Gets an element by CSS selector, returns null if not found.
 */
export function getElement<T extends HTMLElement = HTMLElement>(selector: string): T | null {
  const el = document.querySelector(selector)
  return el instanceof HTMLElement ? (el as T) : null
}

/**
 * Gets a required element by CSS selector, throws if not found.
 */
export function getRequiredElement<T extends HTMLElement = HTMLElement>(
  selector: string,
  ctor: new () => T = HTMLElement as new () => T
): T {
  return queryRequired(document, selector, ctor)
}

/**
 * Gets an element by ID, returns null if not found.
 */
export function getElementById<T extends HTMLElement = HTMLElement>(id: string): T | null {
  const el = document.getElementById(id)
  return el instanceof HTMLElement ? (el as T) : null
}

/**
 * Gets a required element by ID, throws if not found.
 */
export function getRequiredElementById<T extends HTMLElement>(id: string, ctor: new () => T): T {
  return queryRequired(document, `#${id}`, ctor)
}

// ─── Context Helper Functions ─────────────────────────────────────────────────

/**
 * Creates the $ helper function for querying elements.
 */
export function create$Helper(): (selector: string) => HTMLElement {
  return (selector: string): HTMLElement => document.querySelector(selector) as HTMLElement
}

/**
 * Creates the $required helper function for querying required elements.
 */
export function create$RequiredHelper(): (selector: string) => HTMLElement {
  return (selector: string): HTMLElement => queryRequired(document, selector, HTMLElement)
}

/**
 * Creates the $id helper function for querying elements by ID.
 */
export function create$IdHelper(): <T extends HTMLElement>(id: string, ctor: new () => T) => T {
  return <T extends HTMLElement>(id: string, ctor: new () => T): T =>
    queryRequired(document, `#${id}`, ctor)
}

// ─── Stats Panel ──────────────────────────────────────────────────────────────

/**
 * Gets the stats panel element.
 */
export function getStatsPanel(): HTMLElement {
  return getRequiredElement('.stats-panel', HTMLElement)
}

// ─── Button Wiring ────────────────────────────────────────────────────────────

/**
 * Button click handler for start/pause toggle.
 */
export interface StartPauseHandlers {
  onStart: () => void
  onPause: () => void
}

/**
 * Wires up a start/pause button with toggle behavior.
 * Returns the current running state.
 */
export function wireStartPauseButton(
  button: HTMLButtonElement,
  handlers: StartPauseHandlers,
  getRunning: () => boolean,
  setRunning: (value: boolean) => void
): void {
  button.addEventListener('click', () => {
    if (getRunning()) {
      setRunning(false)
      button.textContent = 'Resume'
      handlers.onPause()
    } else {
      setRunning(true)
      button.textContent = 'Pause'
      handlers.onStart()
    }
  })
}

/**
 * Wires up a step button.
 */
export function wireStepButton(
  button: HTMLButtonElement,
  handler: () => void,
  options: {
    pauseIfRunning?: boolean
    getRunning?: () => boolean
    setRunning?: (value: boolean) => void
    startPauseButton?: HTMLButtonElement | null
  } = {}
): void {
  const { pauseIfRunning = true, getRunning, setRunning, startPauseButton } = options

  button.addEventListener('click', () => {
    if (pauseIfRunning && getRunning?.() && startPauseButton) {
      setRunning?.(false)
      startPauseButton.textContent = 'Resume'
    }
    handler()
  })
}

/**
 * Wires up a reset button.
 */
export function wireResetButton(
  button: HTMLButtonElement,
  handler: () => void,
  options: {
    startPauseButton?: HTMLButtonElement | null
    startLabel?: string
  } = {}
): void {
  const { startPauseButton, startLabel = 'Start' } = options

  button.addEventListener('click', () => {
    if (startPauseButton) {
      startPauseButton.textContent = startLabel
    }
    handler()
  })
}

// Note: Running state management is handled by the caller via the setRunning callback
