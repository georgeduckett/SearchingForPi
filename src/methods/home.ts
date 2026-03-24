import type { Page } from '../router'

// ─── Data ───────────────────────────────────────────────────────────────────
const methods = [
  {
    index: '01',
    hash: 'monte-carlo',
    title: 'Monte Carlo',
    desc:
      'Scatter random points inside a square and count how many land inside its inscribed circle. ' +
      'The ratio reveals π with beautiful inevitability.',
  },
  {
    index: '02',
    hash: 'leibniz',
    title: 'Leibniz Series',
    desc:
      'The alternating series 1 - 1/3 + 1/5 - 1/7 + … converges to π/4. ' +
      'Simple, elegant, and agonisingly slow.',
  },
  {
    index: '03',
    hash: 'buffon',
    title: "Buffon's Needle",
    desc:
      'Drop a needle at random onto a lined surface. The probability it crosses a line is ' +
      'directly tied to π — a startling physical experiment.',
  },
  {
    index: '04',
    hash: 'coin-toss',
    title: 'Coin Toss Sequences',
    desc:
      'Toss coins until heads exceed tails. The average ratio of heads to total tosses ' +
      'converges to π/4 in a surprising mathematical twist.',
  },
  {
    index: '05',
    hash: 'bouncing-boxes',
    title: 'Bouncing Boxes',
    desc:
      'Two boxes with mass ratio 100^k collide elastically with a wall. The number of ' +
      'collisions between them encodes the digits of π in a remarkable way.',
  },
  {
    index: '06',
    hash: 'archimedes',
    title: "Archimedes' Polygons",
    desc:
      'Squeeze π between inscribed and circumscribed regular polygons doubling in sides. ' +
      'Archimedes used just 96 sides to achieve remarkable precision in 250 BCE.',
  },
  {
    index: '07',
    hash: 'draw-circle',
    title: 'Draw a Circle',
    desc:
      'Draw your own circle by clicking and dragging. The circumference divided by ' +
      'the diameter approaches π — hands-on understanding of π\'s geometric meaning.',
  },
]

// ─── Page ───────────────────────────────────────────────────────────────────
export function createHomePage(): Page {
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
        ${methods
          .map(
            m => `
          <a class="method-card" href="#${m.hash}" data-page="${m.hash}">
            <div class="method-card-index">${m.index}</div>
            <div class="method-card-title">${m.title}</div>
            <p class="method-card-desc">${m.desc}</p>
          </a>
        `
          )
          .join('')}
      </div>
    `

    return page
  }

  return { render, cleanup: () => {} }
}
