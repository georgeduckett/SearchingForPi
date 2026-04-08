// ─── Draw Circle Types ───────────────────────────────────────────────────────
// Type definitions and constants for the draw circle method.

import {
  getInsideColor,
  getAmberColor,
  getSuccessColor,
  getBorderColor,
  getTextColor,
} from '../../colors'

// Method-specific colors
export const C_DRAWN = getInsideColor()
export const C_APPROX = getAmberColor()
export const C_CENTER = getTextColor()
export const C_RADIUS = getSuccessColor()
export const C_PERFECT = getBorderColor()

// ─── Types ───────────────────────────────────────────────────────────────────
export interface Point {
  x: number
  y: number
  angle: number
}

export interface State {
  points: Point[]
  center: { x: number; y: number } | null
  avgRadius: number
  perimeter: number
  isDrawing: boolean
  segmentLength: number
  lastDrawPoint: { x: number; y: number } | null
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
    eventHandlers: null,
  }
}
