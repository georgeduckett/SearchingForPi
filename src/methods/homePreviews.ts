import { drawPreview as drawMonteCarlo } from './monteCarlo'
import { drawPreview as drawLeibniz } from './leibniz'
import { drawPreview as drawBuffon } from './buffon'
import { drawPreview as drawCoinToss } from './coinToss'
import { drawPreview as drawBouncingBoxes } from './bouncingBoxes'
import { drawPreview as drawArchimedes } from './archimedes'
import { drawPreview as drawDrawCircle } from './drawCircle'
import { drawPreview as drawRiemann } from './riemann'
import { drawPreview as drawBasel } from './basel'
import { drawPreview as drawWallis } from './wallis'
import { drawPreview as drawCoprimality } from './coprimality'
import { drawPreview as drawGalton } from './galton'
import { drawPreview as drawCirclePacking } from './circlePacking'
import { drawPreview as drawGasMolecules } from './gasMolecules'
import { PREVIEW_SIZE } from '../colors'

// Re-export PREVIEW_SIZE for use in home.ts
export { PREVIEW_SIZE }

// ─── Preview Renderer Type ───────────────────────────────────────────────────
export type PreviewRenderer = (ctx: CanvasRenderingContext2D, time: number) => void

// ─── Preview Registry ────────────────────────────────────────────────────────
export const previewRenderers: Record<string, PreviewRenderer> = {
  'monte-carlo': drawMonteCarlo,
  'leibniz': drawLeibniz,
  'buffon': drawBuffon,
  'coin-toss': drawCoinToss,
  'bouncing-boxes': drawBouncingBoxes,
  'archimedes': drawArchimedes,
  'draw-circle': drawDrawCircle,
  'riemann': drawRiemann,
  'basel': drawBasel,
  'wallis': drawWallis,
  'coprimality': drawCoprimality,
  'galton': drawGalton,
  'circle-packing': drawCirclePacking,
  'gas-molecules': drawGasMolecules,
}
