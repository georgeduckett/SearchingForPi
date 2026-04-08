// ─── Shared Color Constants ───────────────────────────────────────────────────
// Colors are read from CSS custom properties defined in style.css.
// This ensures a single source of truth for colors across JS and CSS.

import { getCSSVarCached } from './cssVars'

// ─── Color Getters ────────────────────────────────────────────────────────────
// These functions read from CSS variables at runtime, supporting theme changes.
// Use these for canvas rendering where CSS classes can't be applied.

/** Background surface color (--bg-surface) */
export function getBgColor(): string {
  return getCSSVarCached('bg-surface', '#13161f')
}

/** Grid line color */
export function getGridColor(): string {
  return getCSSVarCached('bg-raised', '#1a1e2b')
}

/** Border color */
export function getBorderColor(): string {
  return getCSSVarCached('border', '#2a2f42')
}

/** Muted text color */
export function getTextMutedColor(): string {
  return getCSSVarCached('text-muted', '#4a5068')
}

/** Primary text color */
export function getTextColor(): string {
  return getCSSVarCached('text-primary', '#e8e4d9')
}

/** Amber accent color */
export function getAmberColor(): string {
  return getCSSVarCached('amber', '#c8922a')
}

/** Bright amber accent color */
export function getAmberBrightColor(): string {
  return getCSSVarCached('amber-bright', '#e8ac42')
}

/** Inside/positive semantic color */
export function getInsideColor(): string {
  return getCSSVarCached('inside', '#4a9eff')
}

/** Outside/negative semantic color */
export function getOutsideColor(): string {
  return getCSSVarCached('outside', '#ff6b6b')
}

/** Success/positive semantic color */
export function getSuccessColor(): string {
  return getCSSVarCached('success', '#4ecb71')
}

// ─── Canvas Size Constants ────────────────────────────────────────────────────
// These are layout constants, not colors, but are kept here for convenience.

export const CANVAS_SIZE = 560
export const PREVIEW_SIZE = 140
