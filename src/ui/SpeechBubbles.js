import { gsap } from 'gsap';
import { geoToSvg } from '../map/NodeMarkers.js';

export class SpeechBubbles {
  /** @type {SVGSVGElement | null} */
  svgEl;
  /** @type {SVGGElement | null} */
  layer = null;

  /** @param {SVGSVGElement | null} svgEl */
  constructor(svgEl) {
    this.svgEl = svgEl;
  }

  /**
   * @param {import('../data/types.js').SpeechBubble[]} bubbles
   * @param {import('../data/types.js').GeoBounds} geo
   */
  show(bubbles, geo) {
    this.hide();
    if (!this.svgEl || !bubbles.length) return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const maxBubbles = isMobile ? 2 : 4;
    const toShow = bubbles.slice(0, maxBubbles);

    this.layer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.layer.setAttribute('class', 'layer-bubbles');
    this.svgEl.appendChild(this.layer);

    const { x, y } = geoToSvg(geo);

    toShow.forEach((bubble, i) => {
      const isReconstructed = bubble.note === 'reconstructed';
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', `speech-bubble${isReconstructed ? ' speech-bubble--reconstructed' : ''}`);
      g.setAttribute('transform', `translate(${x + i * 340 - 170}, ${y - 240})`);
      g.setAttribute('role', 'tooltip');
      g.setAttribute('aria-label', `${bubble.original} — ${bubble.translation}`);

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '-110');
      rect.setAttribute('y', '-80');
      rect.setAttribute('width', '220');
      rect.setAttribute('height', '90');
      rect.setAttribute('rx', '12');
      rect.setAttribute('fill', isReconstructed ? 'rgba(60,50,30,0.92)' : 'rgba(36,36,36,0.92)');
      rect.setAttribute('stroke', isReconstructed ? 'rgba(196,145,58,0.5)' : 'rgba(255,255,255,0.15)');
      rect.setAttribute('stroke-width', '1.5');

      // Original script (native)
      const scriptEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      scriptEl.setAttribute('text-anchor', 'middle');
      scriptEl.setAttribute('font-family', 'Noto Sans, sans-serif');
      scriptEl.setAttribute('font-size', '24');
      scriptEl.setAttribute('fill', '#e8e4dc');
      scriptEl.setAttribute('y', '-42');
      scriptEl.setAttribute('lang', 'und');
      scriptEl.textContent = bubble.original;

      // Romanisation (if different from original)
      const romEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      romEl.setAttribute('text-anchor', 'middle');
      romEl.setAttribute('font-family', 'EB Garamond, Georgia, serif');
      romEl.setAttribute('font-size', '16');
      romEl.setAttribute('font-style', 'italic');
      romEl.setAttribute('fill', '#c8c0b0');
      romEl.setAttribute('y', '-20');
      romEl.textContent = bubble.romanisation !== bubble.original ? bubble.romanisation : '';

      // Translation
      const transEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      transEl.setAttribute('text-anchor', 'middle');
      transEl.setAttribute('font-family', 'Inter, sans-serif');
      transEl.setAttribute('font-size', '14');
      transEl.setAttribute('fill', '#888');
      transEl.setAttribute('y', '-2');
      transEl.textContent = `"${bubble.translation}"`;

      g.appendChild(rect);
      g.appendChild(scriptEl);
      g.appendChild(romEl);
      g.appendChild(transEl);
      this.layer?.appendChild(g);

      gsap.from(g, {
        y: 30,
        opacity: 0,
        duration: 0.45,
        delay: i * 0.12,
        ease: 'power2.out',
      });
    });
  }

  /** @returns {Promise<void>} */
  hide() {
    if (!this.layer) return Promise.resolve();
    const el = this.layer;
    this.layer = null;
    return new Promise((resolve) => {
      gsap.to(el, {
        y: 20,
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => {
          el.remove();
          resolve();
        },
      });
    });
  }
}
