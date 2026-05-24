const VIEWBOX_W = 10000;
const VIEWBOX_H = 5000;

/** @type {Record<string, string>} */
const BRANCH_COLORS = {
  'Indo-European': '#C4913A',
  'Anatolian': '#B85C38',
  'Indo-Iranian': '#D4813A',
  'Hellenic': '#C0392B',
  'Italic': '#6B3FA0',
  'Celtic': '#2E7D52',
  'Germanic': '#3A5A7C',
  'Balto-Slavic': '#2C4A8C',
  'Armenian': '#8C1A1A',
  'Albanian': '#A04030',
  'Tocharian': '#A07060',
};

/**
 * @param {{ lat: number, lng: number }} geo
 * @returns {{ x: number, y: number }}
 */
export function geoToSvg({ lat, lng }) {
  return {
    x: ((lng + 180) / 360) * VIEWBOX_W,
    y: ((90 - lat) / 180) * VIEWBOX_H,
  };
}

/**
 * @param {string} branch
 * @returns {string}
 */
export function branchColor(branch) {
  return BRANCH_COLORS[branch] ?? '#888888';
}

export class NodeMarkers {
  /** @type {import('d3').Selection<SVGSVGElement, unknown, null, undefined>} */
  svg;
  /** @type {import('../data/types.js').GraphNode[]} */
  graph;
  /** @type {((id: string) => void) | null} */
  clickHandler = null;

  /**
   * @param {import('d3').Selection<SVGSVGElement, unknown, null, undefined>} svg
   * @param {import('../data/types.js').GraphNode[]} graph
   */
  constructor(svg, graph) {
    this.svg = svg;
    this.graph = graph;
  }

  render() {
    if (!this.svg) return;
    const layer = this.svg.append('g').attr('class', 'layer-markers');

    for (const node of this.graph) {
      const { x, y } = geoToSvg(node.geo_bounds);
      const isExtinct = node.status === 'extinct';
      const isReconstructed = node.status === 'reconstructed';
      const isDead = isExtinct || isReconstructed;
      const color = branchColor(node.branch);

      const marker = layer
        .append('circle')
        .attr('class', 'node-marker')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 18)
        .attr('data-node-id', node.id)
        .attr('data-branch', node.branch)
        .attr('fill', isDead ? 'none' : color)
        .attr('stroke', color)
        .attr('stroke-width', isDead ? 2 : 0)
        .attr('opacity', isDead ? 0.6 : 1)
        .attr('role', 'button')
        .attr('tabindex', '0')
        .attr('aria-label', node.id.replace(/-/g, ' '));

      if (isExtinct || isReconstructed) {
        marker.classed('node-marker--dead', true);
      }

      marker.on('click', () => this.clickHandler?.(node.id));
      marker.on('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') this.clickHandler?.(node.id);
      });
    }
  }

  /**
   * Highlight the active node marker.
   * @param {string | null} id
   */
  setActive(id) {
    if (!this.svg) return;
    this.svg.selectAll('.node-marker').classed('node-marker--active', false);
    if (id) {
      this.svg.select(`[data-node-id="${id}"]`).classed('node-marker--active', true);
    }
  }

  /** @param {'click'} event @param {(id: string) => void} handler */
  on(event, handler) {
    if (event === 'click') this.clickHandler = handler;
  }
}
