import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NodeTransition } from '../NodeTransition.js';

/** @returns {import('../NodeTransition.js').NodeTransition['deps']} */
function makeDeps(overrides = {}) {
  return {
    mapRenderer: {
      showOverview: vi.fn().mockResolvedValue(undefined),
      geoToD3Transform: vi.fn().mockReturnValue({ tx: 0, ty: 0 }),
      panZoomTo: vi.fn().mockResolvedValue(undefined),
      wrapper: { clientWidth: 1920, clientHeight: 1080 },
    },
    regionManager: {
      activate: vi.fn(),
      deactivate: vi.fn(),
    },
    migrationArrows: {
      show: vi.fn(),
      clear: vi.fn(),
    },
    timelineBar: {
      update: vi.fn(),
    },
    infoPanel: {
      show: vi.fn(),
      hide: vi.fn().mockResolvedValue(undefined),
    },
    speechBubbles: {
      show: vi.fn(),
      hide: vi.fn().mockResolvedValue(undefined),
    },
    audioManager: {
      play: vi.fn(),
    },
    ...overrides,
  };
}

/** @param {Partial<import('../../data/types.js').GraphNode>} overrides */
function makeNode(overrides = {}) {
  return {
    id: 'old-english',
    parent_ids: [],
    children: [],
    branch: 'Germanic',
    status: 'extinct',
    date_range: '450–1100 CE',
    region_id: 'region-old-english',
    geo_bounds: { lat: 52.5, lng: -1.5, zoom: 6 },
    ...overrides,
  };
}

describe('NodeTransition.go', () => {
  let deps;
  let transition;

  beforeEach(() => {
    deps = makeDeps();
    transition = new NodeTransition(deps);
  });

  it('calls hide (exit) before panZoomTo (pan)', async () => {
    const order = [];
    deps.infoPanel.hide.mockImplementation(() => { order.push('hide'); return Promise.resolve(); });
    deps.mapRenderer.panZoomTo.mockImplementation(() => { order.push('pan'); return Promise.resolve(); });

    await transition.go(makeNode(), null);

    const hideIdx = order.indexOf('hide');
    const panIdx = order.indexOf('pan');
    expect(hideIdx).toBeLessThan(panIdx);
  });

  it('calls panZoomTo before regionManager.activate (enter)', async () => {
    const order = [];
    deps.mapRenderer.panZoomTo.mockImplementation(() => { order.push('pan'); return Promise.resolve(); });
    deps.regionManager.activate.mockImplementation(() => { order.push('activate'); });

    await transition.go(makeNode(), null);

    const panIdx = order.indexOf('pan');
    const activateIdx = order.indexOf('activate');
    expect(panIdx).toBeLessThan(activateIdx);
  });

  it('calls panZoomTo with values from geoToD3Transform', async () => {
    deps.mapRenderer.geoToD3Transform.mockReturnValue({ tx: 100, ty: 200 });
    const node = makeNode({ geo_bounds: { lat: 52.5, lng: -1.5, zoom: 6 } });

    await transition.go(node, null);

    expect(deps.mapRenderer.panZoomTo).toHaveBeenCalledWith(100, 200, 6, expect.any(Number));
  });

  it('triggers showOverview mid-flight for a distant jump', async () => {
    // England → Sri Lanka area: ~2580 SVG units apart (above 2500 threshold)
    const prevNode = makeNode({
      id: 'prev',
      geo_bounds: { lat: 52.5, lng: -1.5, zoom: 6 }, // England
    });
    transition.currentGraphNode = prevNode;

    const destNode = makeNode({
      id: 'dest',
      geo_bounds: { lat: 8, lng: 80, zoom: 6 }, // Sri Lanka area
    });

    await transition.go(destNode, null);

    expect(deps.mapRenderer.showOverview).toHaveBeenCalled();
  });

  it('does NOT trigger showOverview for a short hop', async () => {
    const prevNode = makeNode({ id: 'prev', geo_bounds: { lat: 52.5, lng: -1.5, zoom: 6 } });
    transition.currentGraphNode = prevNode;

    const destNode = makeNode({ id: 'dest', geo_bounds: { lat: 52.0, lng: -2.0, zoom: 6 } });

    await transition.go(destNode, null);

    expect(deps.mapRenderer.showOverview).not.toHaveBeenCalled();
  });

  it('calls infoPanel.show and speechBubbles.show when fullNode is provided', async () => {
    const fullNode = {
      id: 'old-english', name: 'Old English', native_name: null,
      parent_ids: [], parent_influence: {}, date_range: '450–1100 CE',
      status: 'extinct', region: 'England', region_id: 'region-old-english',
      geo_bounds: { lat: 52.5, lng: -1.5, zoom: 6 },
      speakers_culture: '', split_reason: '', interesting_fact: '',
      sample_words: [], speech_bubbles: [], youtube_id: null,
      wikipedia_url: null, groups: ['Indo-European', 'Germanic'],
      glottolog_id: null, iso_639_3: null, sources: [],
    };

    await transition.go(makeNode(), fullNode);

    expect(deps.infoPanel.show).toHaveBeenCalledWith(fullNode);
    expect(deps.speechBubbles.show).toHaveBeenCalled();
  });

  it('does not call infoPanel.show when fullNode is null', async () => {
    await transition.go(makeNode(), null);
    expect(deps.infoPanel.show).not.toHaveBeenCalled();
  });

  it('updates timelineBar with date_range after pan', async () => {
    const order = [];
    deps.mapRenderer.panZoomTo.mockImplementation(() => { order.push('pan'); return Promise.resolve(); });
    deps.timelineBar.update.mockImplementation(() => { order.push('timeline'); });

    await transition.go(makeNode(), null);

    const panIdx = order.indexOf('pan');
    const timelineIdx = order.indexOf('timeline');
    expect(timelineIdx).toBeGreaterThan(panIdx);
    expect(deps.timelineBar.update).toHaveBeenCalledWith('450–1100 CE');
  });

  it('updates currentGraphNode after completing the transition', async () => {
    const node = makeNode({ id: 'old-english' });
    await transition.go(node, null);
    expect(transition.currentGraphNode).toBe(node);
  });
});
