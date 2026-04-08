import type { Page } from '../router'
import { methodPages } from '../pages'
import { PREVIEW_SIZE, previewRenderers } from './homePreviews'

// ─── Page ───────────────────────────────────────────────────────────────────
export function createHomePage(): Page {
  let animationId: number | null = null
  let startTime: number = 0
  const canvases: Map<string, HTMLCanvasElement> = new Map()

  function animate(timestamp: number): void {
    const elapsed = (timestamp - startTime) / 1000

    canvases.forEach((canvas, hash) => {
      const renderer = previewRenderers[hash]
      if (renderer) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          renderer(ctx, elapsed)
        }
      }
    })

    animationId = requestAnimationFrame(animate)
  }

  function render(): HTMLElement {
    const page = document.createElement('div')
    page.className = 'page'

    page.innerHTML = `
 <header class="page-header">
 <span class="page-index">π — The Constant</span>
 <h2 class="page-title">Many Roads to Pi</h2>
 <p class="page-subtitle">
 π is irrational, transcendental, and ubiquitous. Here are several ways
 to calculate it — each illuminating a different corner of mathematics.
 Choose a method to explore.
 </p>
 </header>

 <div class="home-grid">
 ${methodPages
   .map(
     m => `
 <a class="method-card" href="#${m.hash}" data-page="${m.hash}">
 <div class="method-card-preview">
 <canvas class="preview-canvas" data-method="${m.hash}" width="${PREVIEW_SIZE}" height="${PREVIEW_SIZE}"></canvas>
 </div>
 <div class="method-card-content">
 <div class="method-card-title">${m.title}</div>
 <p class="method-card-desc">${m.desc}</p>
 </div>
 </a>
 `
   )
   .join('')}
 </div>
 `

    // Collect canvas references and start animation
    requestAnimationFrame(() => {
      page.querySelectorAll('.preview-canvas').forEach(canvas => {
        const el = canvas as HTMLCanvasElement
        const method = el.dataset['method']
        if (method) {
          canvases.set(method, el)
        }
      })

      startTime = performance.now()
      animationId = requestAnimationFrame(animate)
    })

    return page
  }

  function cleanup(): void {
    if (animationId !== null) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
    canvases.clear()
  }

  return { render, cleanup }
}
