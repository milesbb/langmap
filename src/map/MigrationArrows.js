import { geoToSvg, branchColor } from './NodeMarkers.js';
import { gsap } from 'gsap';

export class MigrationArrows {
  /** @type {import('d3').Selection<SVGSVGElement, unknown, null, undefined>} */
  svg;
  /** @type {import('../data/types.js').GraphNode[]} */
  graph;
  /** @type {Map<string, string[]>} */
  childrenOf;
  /** @type {((id: string) => void) | null} */
  clickHandler = null;
  /** @type {import('d3').Selection<SVGGElement, unknown, null, undefined> | null} */
  layer = null;
  /** @type {import('d3').Selection<SVGGElement, unknown, null, undefined> | null} */
  overviewLayer = null;

  /**
   * @param {import('d3').Selection<SVGSVGElement, unknown, null, undefined>} svg
   * @param {import('../data/types.js').GraphNode[]} graph
   * @param {Map<string, string[]>} childrenOf
   */
  constructor(svg, graph, childrenOf) {
    this.svg = svg;
    this.graph = graph;
    this.childrenOf = childrenOf;
  }

  /** @param {string} nodeId */
  show(nodeId) {
    this.clear();
    if (!this.svg) return;

    this.layer = this.svg.append('g').attr('class', 'layer-arrows');
    const nodeMap = new Map(this.graph.map((n) => [n.id, n]));
    const source = nodeMap.get(nodeId);
    if (!source) return;

    const children = this.childrenOf.get(nodeId) ?? [];
    const from = geoToSvg(source.geo_bounds);

    // Detect multi-parent children to render them differently
    const parentsOf = this.#buildParentsOf();

    for (const childId of children) {
      const child = nodeMap.get(childId);
      if (!child) continue;
      const to = geoToSvg(child.geo_bounds);
      const isExtinct = child.status === 'extinct';
      const isMultiParent = (parentsOf.get(childId) ?? []).length > 1;
      const color = branchColor(child.branch);

      const pathEl = this.layer
        .append('path')
        .attr('class', `migration-arrow${isMultiParent ? ' migration-arrow--multi-parent' : ''}`)
        .attr('d', this.#curvePath(from, to))
        .attr('stroke', color)
        .attr('stroke-width', isMultiParent ? 4 : 3)
        .attr('stroke-dasharray', isExtinct ? '12,8' : 'none')
        .attr('opacity', isExtinct ? 0.35 : 0.75)
        .attr('marker-end', 'url(#arrow-head)')
        .attr('data-edge-from', nodeId)
        .attr('data-edge-to', childId);

      const length = pathEl.node()?.getTotalLength() ?? 200;
      gsap.fromTo(
        pathEl.node(),
        { strokeDashoffset: length, strokeDasharray: `${length} ${length}` },
        { strokeDashoffset: 0, strokeDasharray: `${length} ${length}`, duration: 0.6, ease: 'power2.out' }
      );

      pathEl.on('click', () => this.clickHandler?.(childId));
    }
  }

  /**
   * Show all edges at low opacity for overview mode.
   */
  showAll() {
    this.hideAll();
    if (!this.svg) return;

    this.overviewLayer = this.svg.insert('g', '.layer-markers').attr('class', 'layer-arrows-overview');
    const nodeMap = new Map(this.graph.map((n) => [n.id, n]));

    for (const node of this.graph) {
      const from = geoToSvg(node.geo_bounds);
      const children = this.childrenOf.get(node.id) ?? [];

      for (const childId of children) {
        const child = nodeMap.get(childId);
        if (!child) continue;
        const to = geoToSvg(child.geo_bounds);
        const color = branchColor(child.branch);

        this.overviewLayer
          .append('path')
          .attr('class', 'migration-arrow migration-arrow--overview')
          .attr('d', this.#curvePath(from, to))
          .attr('stroke', color)
          .attr('stroke-width', 2)
          .attr('opacity', 0.25)
          .attr('marker-end', 'url(#arrow-head)');
      }
    }
  }

  hideAll() {
    this.overviewLayer?.remove();
    this.overviewLayer = null;
  }

  clear() {
    this.layer?.remove();
    this.layer = null;
  }

  /**
   * Draw a slightly curved path between two SVG points.
   * @param {{ x: number, y: number }} from
   * @param {{ x: number, y: number }} to
   * @returns {string}
   */
  #curvePath(from, to) {
    const mx = (from.x + to.x) / 2;
    const my = (from.y + to.y) / 2 - Math.hypot(to.x - from.x, to.y - from.y) * 0.1;
    return `M${from.x},${from.y} Q${mx},${my} ${to.x},${to.y}`;
  }

  /** @returns {Map<string, string[]>} */
  #buildParentsOf() {
    /** @type {Map<string, string[]>} */
    const parentsOf = new Map();
    for (const node of this.graph) {
      parentsOf.set(node.id, node.parent_ids);
    }
    return parentsOf;
  }

  /** @param {'click'} event @param {(id: string) => void} handler */
  on(event, handler) {
    if (event === 'click') this.clickHandler = handler;
  }
}
