// ─── Draw Circle Types ───────────────────────────────────────────────────────
// Type definitions and constants for the draw circle method.

import { C_INSIDE, C_AMBER, C_SUCCESS, C_BORDER, C_TEXT_PRIMARY } from '../../colors'

// Method-specific colors
export const C_DRAWN = C_INSIDE
export const C_APPROX = C_AMBER
export const C_CENTER = C_TEXT_PRIMARY
export const C_RADIUS = C_SUCCESS
export const C_PERFECT = C_BORDER

// ─── Types ───────────────────────────────────────────────────────────────────
export interface Point {
  x: number
  y: number
  angle: number
}

export interface State {
  points: Point[]
  center: { x: number, y: number } | null
  avgRadius: number
  perimeter: number
  isDrawing: boolean
  segmentLength: number
  lastDrawPoint: { x: number, y: number } | null
  eventHandlers: {
    mouseMoveHandler: (e: MouseEvent) => void
    mouseUpHandler: (e: MouseEvent) => void
    touchEndHandler: (e: TouchEvent) => void
  } | null
}

// ─── State Factory ───────────────────────────────────────────────────────────
export function createInitialState(): State {
  return {
    points: [],
    center: null,
    avgRadius: 0,
    perimeter: 0,
    isDrawing: false,
    segmentLength: 50,
    lastDrawPoint: null,
    eventHandlers: null
  }
}
