import { zoom as d3zoom, zoomIdentity } from 'd3-zoom';
import { select } from 'd3';

const SVG_W = 10000;
const SVG_H = 5000;

export class MapRenderer {
  /** @type {HTMLElement} */
  wrapper;
  /** @type {SVGSVGElement | null} */
  svgEl = null;
  /** @type {import('d3').Selection<SVGSVGElement, unknown, null, undefined> | null} */
  svg = null;
  /** @type {import('d3-zoom').ZoomBehavior<HTMLElement, unknown>} */
  zoom;

  /** @param {string} selector */
  constructor(selector) {
    const el = document.querySelector(selector);
    if (!el) throw new Error(`MapRenderer: element not found: ${selector}`);
    this.wrapper = /** @type {HTMLElement} */ (el);
    this.zoom = d3zoom()
      .scaleExtent([0.5, 10])
      .on('zoom', (event) => this.#onZoom(event));
    select(this.wrapper).call(this.zoom);
  }

  /** @param {import('d3-zoom').D3ZoomEvent<HTMLElement, unknown>} event */
  #onZoom(event) {
    const { x, y, k } = event.transform;
    this.wrapper.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
    this.#updateSemanticZoom(k);
  }

  /** @param {number} k */
  #updateSemanticZoom(k) {
    if (!this.svgEl) return;
    this.svgEl.classList.toggle('zoom-level-2', k >= 2);
    this.svgEl.classList.toggle('zoom-level-4', k >= 4);
  }

  /** @param {string} url */
  async load(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`MapRenderer: failed to load SVG: ${url}`);
    const text = await res.text();
    this.wrapper.innerHTML = text;
    this.svgEl = this.wrapper.querySelector('svg');
    if (!this.svgEl) throw new Error('MapRenderer: no <svg> found in map file');
    this.svg = select(this.svgEl);
    this.#injectArrowMarker();

    const w = this.wrapper.clientWidth || window.innerWidth;
    const h = this.wrapper.clientHeight || window.innerHeight;
    this.zoom.translateExtent([[0, 0], [w, h]]);
  }

  #injectArrowMarker() {
    if (!this.svgEl) return;
    let defs = this.svgEl.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      this.svgEl.insertBefore(defs, this.svgEl.firstChild);
    }
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrow-head');
    marker.setAttribute('markerWidth', '8');
    marker.setAttribute('markerHeight', '8');
    marker.setAttribute('refX', '6');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M0,0 L0,6 L8,3 z');
    path.setAttribute('fill', 'currentColor');
    marker.appendChild(path);
    defs.appendChild(marker);
  }

  /**
   * Compute the d3-zoom translate values to centre an SVG point on screen at scale k.
   * @param {number} svgX - SVG coordinate (0–10000)
   * @param {number} svgY - SVG coordinate (0–5000)
   * @param {number} k - desired scale
   * @returns {{ tx: number, ty: number }}
   */
  geoToD3Transform(svgX, svgY, k) {
    const w = this.wrapper.clientWidth || window.innerWidth;
    const h = this.wrapper.clientHeight || window.innerHeight;
    const cxPx = (svgX / SVG_W) * w;
    const cyPx = (svgY / SVG_H) * h;
    return {
      tx: w / 2 - cxPx * k,
      ty: h / 2 - cyPx * k,
    };
  }

  /**
   * Animate the map to a specific d3-zoom transform.
   * @param {number} tx
   * @param {number} ty
   * @param {number} k
   * @param {number} [duration]
   * @returns {Promise<void>}
   */
  panZoomTo(tx, ty, k, duration = 800) {
    return new Promise((resolve) => {
      const transform = zoomIdentity.translate(tx, ty).scale(k);
      select(this.wrapper)
        .transition()
        .duration(duration)
        .call(this.zoom.transform, transform)
        .on('end', resolve);
    });
  }

  /**
   * Zoom out to show the full world map.
   * @returns {Promise<void>}
   */
  showOverview() {
    const w = this.wrapper.clientWidth || window.innerWidth;
    const h = this.wrapper.clientHeight || window.innerHeight;
    const scaleX = w / SVG_W;
    const scaleY = h / SVG_H;
    const k = Math.min(scaleX, scaleY) * 0.9;
    const tx = (w - SVG_W * k) / 2;
    const ty = (h - SVG_H * k) / 2;
    return this.panZoomTo(tx, ty, k, 600);
  }
}
