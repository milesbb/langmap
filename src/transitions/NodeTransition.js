import { geoToSvg } from '../map/NodeMarkers.js';

const DISTANT_JUMP_THRESHOLD = 2500; // SVG units

/**
 * @param {{ x: number, y: number }} a
 * @param {{ x: number, y: number }} b
 * @returns {number}
 */
function svgDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export class NodeTransition {
  /**
   * @param {{
   *   mapRenderer: import('../map/MapRenderer.js').MapRenderer,
   *   regionManager: import('../map/RegionManager.js').RegionManager,
   *   migrationArrows: import('../map/MigrationArrows.js').MigrationArrows,
   *   timelineBar: import('./TimelineBar.js').TimelineBar,
   *   infoPanel: import('../ui/InfoPanel.js').InfoPanel,
   *   speechBubbles: import('../ui/SpeechBubbles.js').SpeechBubbles,
   *   audioManager: import('../audio/AudioManager.js').AudioManager,
   * }} deps
   */
  constructor(deps) {
    this.deps = deps;
    /** @type {import('../data/types.js').GraphNode | null} */
    this.currentGraphNode = null;
    this.isTransitioning = false;
  }

  /**
   * @param {import('../data/types.js').GraphNode} graphNode
   * @param {(() => import('../data/types.js').Language | null) | import('../data/types.js').Language | null} getFullNode
   * @returns {Promise<void>}
   */
  async go(graphNode, getFullNode) {
    const { mapRenderer, regionManager, migrationArrows, timelineBar, infoPanel, speechBubbles, audioManager } =
      this.deps;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const speedMult = isMobile ? 0.8 : 1;

    const prevNode = this.currentGraphNode;
    // Set early so backfill in main.js can find the pending node if languages.json
    // resolves before the pan animation completes.
    this.currentGraphNode = graphNode;
    this.isTransitioning = true;

    // Step 1: exit current node (~400ms)
    await Promise.all([speechBubbles.hide(), infoPanel.hide()]);
    regionManager.deactivate();
    migrationArrows.clear();

    // Step 2: pan + zoom to new node
    const destSvg = geoToSvg(graphNode.geo_bounds);
    const k = graphNode.geo_bounds.zoom;

    if (prevNode) {
      const prevSvg = geoToSvg(prevNode.geo_bounds);
      const dist = svgDistance(destSvg, prevSvg);

      if (dist > DISTANT_JUMP_THRESHOLD) {
        // Zoom out to show context mid-flight
        await mapRenderer.showOverview();
      }
    }

    const { tx, ty } = mapRenderer.geoToD3Transform(destSvg.x, destSvg.y, k);
    await mapRenderer.panZoomTo(tx, ty, k, Math.round(800 * speedMult));

    timelineBar.update(graphNode.date_range);

    // Step 3: enter new node
    regionManager.activate(graphNode.region_id, graphNode.branch);
    migrationArrows.show(graphNode.id);

    // Resolve full node lazily — by the time the animation completes, languages.json
    // has almost certainly loaded and nodeMap is populated.
    const fullNode = typeof getFullNode === 'function' ? getFullNode() : getFullNode;
    if (fullNode) {
      infoPanel.show(fullNode);
      speechBubbles.show(fullNode.speech_bubbles, graphNode.geo_bounds);
    }

    audioManager.play(graphNode.branch);
    this.isTransitioning = false;
  }
}
