// ─── Color Utilities ─────────────────────────────────────────────────────────
// Color manipulation and conversion functions.

import { lerp } from './geometry'

/**
 * Creates an RGBA color string.
 */
export function rgba(r: number, g: number, b: number, a: number): string {
  return `rgba(${r},${g},${b},${a})`
}

/**
 * Interpolates between two hex colors.
 */
export function lerpColor(color1: string, color2: string, t: number): string {
  // Parse hex colors
  const parseHex = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 }
  }

  const c1 = parseHex(color1)
  const c2 = parseHex(color2)

  const r = Math.round(lerp(c1.r, c2.r, t))
  const g = Math.round(lerp(c1.g, c2.g, t))
  const b = Math.round(lerp(c1.b, c2.b, t))

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}
