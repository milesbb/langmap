import { branchColor } from './NodeMarkers.js';

export class RegionManager {
  /** @type {import('d3').Selection<SVGSVGElement, unknown, null, undefined>} */
  svg;
  /** @type {string | null} */
  activeRegionId = null;

  /** @param {import('d3').Selection<SVGSVGElement, unknown, null, undefined>} svg */
  constructor(svg) {
    this.svg = svg;
  }

  /**
   * @param {string} regionId
   * @param {string} [branch]
   */
  activate(regionId, branch) {
    this.deactivate();
    const el = this.svg?.select(`#${regionId}`);
    if (!el || el.empty()) return;

    const color = branch ? branchColor(branch) : null;
    el.style('display', 'block')
      .style('color', color)
      .classed('region--active', true);

    this.activeRegionId = regionId;
  }

  deactivate() {
    if (!this.activeRegionId) return;
    this.svg
      ?.select(`#${this.activeRegionId}`)
      .style('display', 'none')
      .style('color', null)
      .classed('region--active', false);
    this.activeRegionId = null;
  }
}
