import { loadGraph, loadLanguages } from './data/loader.js';
import { buildAdjacencyList } from './data/graph.js';
import { MapRenderer } from './map/MapRenderer.js';
import { NodeMarkers } from './map/NodeMarkers.js';
import { RegionManager } from './map/RegionManager.js';
import { MigrationArrows } from './map/MigrationArrows.js';
import { NodeTransition } from './transitions/NodeTransition.js';
import { TimelineBar } from './transitions/TimelineBar.js';
import { InfoPanel } from './ui/InfoPanel.js';
import { SideMenu } from './ui/SideMenu.js';
import { SpeechBubbles } from './ui/SpeechBubbles.js';
import { AudioManager } from './audio/AudioManager.js';
import { initRouter, navigateTo, getCurrentId } from './router.js';

/** @type {Map<string, import('./data/types.js').Language>} */
let nodeMap = new Map();

async function init() {
  const graph = await loadGraph();
  const { childrenOf } = buildAdjacencyList(graph);

  const mapRenderer = new MapRenderer('#map-wrapper');
  await mapRenderer.load('/map.svg');

  const regionManager = new RegionManager(mapRenderer.svg);
  const nodeMarkers = new NodeMarkers(mapRenderer.svg, graph);
  const migrationArrows = new MigrationArrows(mapRenderer.svg, graph, childrenOf);
  const timelineBar = new TimelineBar('#timeline-year');
  const infoPanel = new InfoPanel('#info-panel');
  const speechBubbles = new SpeechBubbles(mapRenderer.svgEl);
  const sideMenu = new SideMenu('#side-menu', '#menu-toggle');
  const audioManager = new AudioManager();
  const transition = new NodeTransition({
    mapRenderer,
    regionManager,
    migrationArrows,
    timelineBar,
    infoPanel,
    speechBubbles,
    audioManager,
  });

  nodeMarkers.render();

  // Load full language data in background after first paint.
  // Once loaded, backfill the info panel if a node is already active.
  loadLanguages().then((languages) => {
    nodeMap = new Map(languages.map((n) => [n.id, n]));
    sideMenu.setNodes(languages);
    // Only backfill if the transition has already settled — the getter approach in
    // NodeTransition handles the case where languages.json loads during animation.
    if (!transition.isTransitioning) {
      const active = transition.currentGraphNode;
      if (active) {
        const fullNode = nodeMap.get(active.id);
        if (fullNode) {
          infoPanel.show(fullNode);
          speechBubbles.show(fullNode.speech_bubbles, active.geo_bounds);
        }
      }
    }
  });

  nodeMarkers.on('click', (id) => navigateTo(id));
  migrationArrows.on('click', (id) => navigateTo(id));
  sideMenu.on('select', (id) => navigateTo(id));

  initRouter((id) => {
    const graphNode = graph.find((n) => n.id === id);
    if (!graphNode) return;
    nodeMarkers.setActive(id);
    // Pass a getter so step 3 of the transition resolves the full node lazily —
    // by then languages.json has almost certainly loaded.
    transition.go(graphNode, () => nodeMap.get(id) ?? null);
  });

  // Audio toggle
  const audioBtn = document.querySelector('#audio-toggle');
  let audioMuted = window.matchMedia('(max-width: 768px)').matches;
  audioManager.setMuted(audioMuted);
  if (audioBtn) {
    audioBtn.setAttribute('aria-pressed', String(audioMuted));
    audioBtn.addEventListener('click', () => {
      audioMuted = !audioMuted;
      audioManager.setMuted(audioMuted);
      audioBtn.setAttribute('aria-pressed', String(audioMuted));
      audioBtn.textContent = audioMuted ? '🔇' : '🔊';
    });
  }

  // Overview toggle
  const overviewBtn = document.querySelector('#overview-toggle');
  let overviewActive = false;
  overviewBtn?.addEventListener('click', async () => {
    overviewActive = !overviewActive;
    overviewBtn.setAttribute('aria-pressed', String(overviewActive));
    overviewBtn.classList.toggle('active', overviewActive);

    if (overviewActive) {
      await mapRenderer.showOverview();
      migrationArrows.showAll();
    } else {
      migrationArrows.hideAll();
      // Return to current node if one is active
      const currentNode = transition.currentGraphNode;
      if (currentNode) {
        const { x, y } = (await import('./map/NodeMarkers.js')).geoToSvg(currentNode.geo_bounds);
        const k = currentNode.geo_bounds.zoom;
        const { tx, ty } = mapRenderer.geoToD3Transform(x, y, k);
        await mapRenderer.panZoomTo(tx, ty, k, 600);
      }
    }
  });

  const startId = getCurrentId() ?? 'proto-indo-european';
  navigateTo(startId);
}

init().catch(console.error);
