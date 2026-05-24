import { describe, it, expect } from 'vitest';
import { buildAdjacencyList, findAncestors, findChildren, findPath } from '../graph.js';

// Minimal DAG fixture:
//   pie → proto-germanic → old-english → middle-english (multi-parent)
//         old-french-norman ─────────────────────────────┘
//   middle-english → modern-english
/** @type {import('../types.js').GraphNode[]} */
const FIXTURE = [
  {
    id: 'pie',
    parent_ids: [],
    children: ['proto-germanic'],
    branch: 'Indo-European',
    status: 'reconstructed',
    date_range: '~4500 BCE',
    region_id: 'region-pie',
    geo_bounds: { lat: 47, lng: 38, zoom: 4 },
  },
  {
    id: 'proto-germanic',
    parent_ids: ['pie'],
    children: ['old-english'],
    branch: 'Germanic',
    status: 'reconstructed',
    date_range: '~500 BCE',
    region_id: 'region-proto-germanic',
    geo_bounds: { lat: 56, lng: 10, zoom: 5 },
  },
  {
    id: 'old-french-norman',
    parent_ids: [],
    children: ['middle-english'],
    branch: 'Italic',
    status: 'extinct',
    date_range: '900–1300 CE',
    region_id: 'region-old-french-norman',
    geo_bounds: { lat: 49, lng: 1, zoom: 5 },
  },
  {
    id: 'old-english',
    parent_ids: ['proto-germanic'],
    children: ['middle-english'],
    branch: 'Germanic',
    status: 'extinct',
    date_range: '450–1100 CE',
    region_id: 'region-old-english',
    geo_bounds: { lat: 52.5, lng: -1.5, zoom: 6 },
  },
  {
    id: 'middle-english',
    parent_ids: ['old-english', 'old-french-norman'],
    children: ['modern-english'],
    branch: 'Germanic',
    status: 'extinct',
    date_range: '1100–1500 CE',
    region_id: 'region-middle-english',
    geo_bounds: { lat: 52.5, lng: -1.5, zoom: 6 },
  },
  {
    id: 'modern-english',
    parent_ids: ['middle-english'],
    children: [],
    branch: 'Germanic',
    status: 'living',
    date_range: '1700 CE–present',
    region_id: 'region-modern-english',
    geo_bounds: { lat: 52.5, lng: -1.5, zoom: 4 },
  },
];

describe('buildAdjacencyList', () => {
  it('builds a childrenOf map with correct entries', () => {
    const { childrenOf } = buildAdjacencyList(FIXTURE);
    expect(childrenOf.get('pie')).toContain('proto-germanic');
    expect(childrenOf.get('old-english')).toContain('middle-english');
    expect(childrenOf.get('old-french-norman')).toContain('middle-english');
  });

  it('builds a parentsOf map with correct entries', () => {
    const { parentsOf } = buildAdjacencyList(FIXTURE);
    expect(parentsOf.get('middle-english')).toContain('old-english');
    expect(parentsOf.get('middle-english')).toContain('old-french-norman');
  });

  it('multi-parent node appears in multiple parents child lists', () => {
    const { childrenOf } = buildAdjacencyList(FIXTURE);
    const oldEnglishChildren = childrenOf.get('old-english') ?? [];
    const normanChildren = childrenOf.get('old-french-norman') ?? [];
    expect(oldEnglishChildren).toContain('middle-english');
    expect(normanChildren).toContain('middle-english');
  });

  it('leaf node has empty children list', () => {
    const { childrenOf } = buildAdjacencyList(FIXTURE);
    expect(childrenOf.get('modern-english')).toEqual([]);
  });

  it('root node has empty parents list', () => {
    const { parentsOf } = buildAdjacencyList(FIXTURE);
    expect(parentsOf.get('pie')).toEqual([]);
  });
});

describe('findAncestors', () => {
  const { parentsOf } = buildAdjacencyList(FIXTURE);

  it('returns empty array for PIE (no parents)', () => {
    expect(findAncestors('pie', parentsOf)).toEqual([]);
  });

  it('returns all ancestors of modern-english', () => {
    const ancestors = findAncestors('modern-english', parentsOf);
    expect(ancestors).toContain('middle-english');
    expect(ancestors).toContain('old-english');
    expect(ancestors).toContain('proto-germanic');
    expect(ancestors).toContain('pie');
    expect(ancestors).toContain('old-french-norman');
  });

  it('returns both parent chains for middle-english', () => {
    const ancestors = findAncestors('middle-english', parentsOf);
    expect(ancestors).toContain('old-english');
    expect(ancestors).toContain('old-french-norman');
    expect(ancestors).toContain('proto-germanic');
    expect(ancestors).toContain('pie');
  });

  it('does not return duplicates when two paths share an ancestor', () => {
    const ancestors = findAncestors('modern-english', parentsOf);
    const unique = new Set(ancestors);
    expect(ancestors.length).toBe(unique.size);
  });
});

describe('findChildren', () => {
  const { childrenOf } = buildAdjacencyList(FIXTURE);

  it('returns all direct children of proto-germanic', () => {
    const children = findChildren('proto-germanic', childrenOf);
    expect(children).toContain('old-english');
  });

  it('returns empty array for a leaf node', () => {
    expect(findChildren('modern-english', childrenOf)).toEqual([]);
  });

  it('middle-english appears in children of both old-english and old-french-norman', () => {
    expect(findChildren('old-english', childrenOf)).toContain('middle-english');
    expect(findChildren('old-french-norman', childrenOf)).toContain('middle-english');
  });
});

describe('findPath', () => {
  const { childrenOf } = buildAdjacencyList(FIXTURE);

  it('returns the direct path from pie to old-english', () => {
    const path = findPath('pie', 'old-english', childrenOf);
    expect(path).toEqual(['pie', 'proto-germanic', 'old-english']);
  });

  it('returns a valid path for middle-english', () => {
    const path = findPath('pie', 'middle-english', childrenOf);
    expect(path).not.toBeNull();
    expect(path[0]).toBe('pie');
    expect(path[path.length - 1]).toBe('middle-english');
  });

  it('returns [id] when from === to', () => {
    expect(findPath('pie', 'pie', childrenOf)).toEqual(['pie']);
  });

  it('returns null when no path exists between unconnected nodes', () => {
    expect(findPath('old-french-norman', 'proto-germanic', childrenOf)).toBeNull();
  });
});
