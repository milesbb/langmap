// @vitest-environment node
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect } from 'vitest';
import { buildAdjacencyList } from '../graph.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../../');

/** @type {import('../types.js').Language[]} */
const languages = JSON.parse(
  readFileSync(resolve(root, 'public/data/languages.json'), 'utf-8')
);

/** @type {import('../types.js').GraphNode[]} */
const graph = JSON.parse(
  readFileSync(resolve(root, 'public/data/graph.json'), 'utf-8')
);

const VALID_STATUSES = new Set(['living', 'extinct', 'liturgical', 'reconstructed']);

describe('languages.json', () => {
  const idSet = new Set(languages.map(n => n.id));

  it('has no duplicate ids', () => {
    const ids = languages.map(n => n.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every parent_id references an existing node id', () => {
    const bad = [];
    for (const node of languages) {
      for (const pid of node.parent_ids) {
        if (!idSet.has(pid)) bad.push(`${node.id} → ${pid}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('has no cycles (DAG constraint)', () => {
    // Topological sort — fails if a cycle exists
    const inDegree = new Map(languages.map(n => [n.id, 0]));
    const childrenOf = new Map(languages.map(n => [n.id, []]));
    for (const node of languages) {
      for (const pid of node.parent_ids) {
        inDegree.set(node.id, (inDegree.get(node.id) ?? 0) + 1);
        childrenOf.get(pid)?.push(node.id);
      }
    }
    const queue = [...inDegree.entries()].filter(([, d]) => d === 0).map(([id]) => id);
    let visited = 0;
    while (queue.length > 0) {
      const current = queue.shift();
      visited++;
      for (const child of childrenOf.get(current) ?? []) {
        const deg = (inDegree.get(child) ?? 0) - 1;
        inDegree.set(child, deg);
        if (deg === 0) queue.push(child);
      }
    }
    expect(visited).toBe(languages.length);
  });

  it('parent_ids is always an array, never a string', () => {
    const bad = languages.filter(n => !Array.isArray(n.parent_ids));
    expect(bad.map(n => n.id)).toEqual([]);
  });

  it('every node has required fields', () => {
    const required = ['id', 'name', 'parent_ids', 'status', 'region_id', 'geo_bounds', 'groups', 'date_range'];
    const missing = [];
    for (const node of languages) {
      for (const field of required) {
        if (node[field] === undefined) missing.push(`${node.id}: missing ${field}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('status is one of: living | extinct | liturgical | reconstructed', () => {
    const bad = languages.filter(n => !VALID_STATUSES.has(n.status));
    expect(bad.map(n => `${n.id}: ${n.status}`)).toEqual([]);
  });

  it('geo_bounds.lat is in [-90, 90]', () => {
    const bad = languages.filter(n => n.geo_bounds.lat < -90 || n.geo_bounds.lat > 90);
    expect(bad.map(n => `${n.id}: lat=${n.geo_bounds.lat}`)).toEqual([]);
  });

  it('geo_bounds.lng is in [-180, 180]', () => {
    const bad = languages.filter(n => n.geo_bounds.lng < -180 || n.geo_bounds.lng > 180);
    expect(bad.map(n => `${n.id}: lng=${n.geo_bounds.lng}`)).toEqual([]);
  });

  it('youtube_id is null or a non-empty string', () => {
    const bad = languages.filter(n => n.youtube_id !== null && (typeof n.youtube_id !== 'string' || n.youtube_id.trim() === ''));
    expect(bad.map(n => n.id)).toEqual([]);
  });

  it('groups is a non-empty array on every node', () => {
    const bad = languages.filter(n => !Array.isArray(n.groups) || n.groups.length === 0);
    expect(bad.map(n => n.id)).toEqual([]);
  });

  it('every speech_bubble has original, romanisation, and translation fields', () => {
    const bad = [];
    for (const node of languages) {
      for (const [i, b] of node.speech_bubbles.entries()) {
        if (!b.original || !b.romanisation || !b.translation) {
          bad.push(`${node.id}[${i}]`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('reconstructed nodes exist and any speech bubble marked reconstructed has * in its romanisation', () => {
    // The asterisk convention applies to forms, not node names.
    // Reconstructed nodes may also have early-attested speech bubbles (e.g. runic inscriptions).
    const reconstructed = languages.filter(n => n.status === 'reconstructed');
    expect(reconstructed.length).toBeGreaterThan(0);
    const violations = [];
    for (const node of reconstructed) {
      for (const [i, b] of node.speech_bubbles.entries()) {
        if (b.note === 'reconstructed' && !b.romanisation.startsWith('*') && !b.original.startsWith('*')) {
          violations.push(`${node.id}[${i}]: reconstructed note but no * prefix`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});

describe('graph.json', () => {
  const graphIdSet = new Set(graph.map(n => n.id));
  const langIdSet = new Set(languages.map(n => n.id));

  it('contains every id from languages.json', () => {
    const missing = [...langIdSet].filter(id => !graphIdSet.has(id));
    expect(missing).toEqual([]);
  });

  it('parent_ids in graph.json match parent_ids in languages.json', () => {
    const langMap = new Map(languages.map(n => [n.id, n]));
    const mismatches = [];
    for (const gNode of graph) {
      const lNode = langMap.get(gNode.id);
      if (!lNode) continue;
      const gSorted = [...gNode.parent_ids].sort().join(',');
      const lSorted = [...lNode.parent_ids].sort().join(',');
      if (gSorted !== lSorted) mismatches.push(gNode.id);
    }
    expect(mismatches).toEqual([]);
  });

  it('childrenOf and parentsOf are inverse of each other', () => {
    const { childrenOf, parentsOf } = buildAdjacencyList(graph);
    const violations = [];

    // For every parent→child edge, child must list parent in parentsOf
    for (const [parentId, children] of childrenOf.entries()) {
      for (const childId of children) {
        if (!parentsOf.get(childId)?.includes(parentId)) {
          violations.push(`${parentId} → ${childId} not reflected in parentsOf`);
        }
      }
    }

    // For every child→parent edge, parent must list child in childrenOf
    for (const [childId, parents] of parentsOf.entries()) {
      for (const parentId of parents) {
        if (!childrenOf.get(parentId)?.includes(childId)) {
          violations.push(`${childId} ← ${parentId} not reflected in childrenOf`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('middle-english has old-english and old-french-norman as parents (DAG multi-parent test)', () => {
    const me = graph.find(n => n.id === 'middle-english');
    expect(me).toBeDefined();
    expect(me.parent_ids).toContain('old-english');
    expect(me.parent_ids).toContain('old-french-norman');
  });

  it('children field is the inverse of parent_ids', () => {
    // Build expected children map from parent_ids
    /** @type {Map<string, string[]>} */
    const expectedChildren = new Map(graph.map(n => [n.id, []]));
    for (const node of graph) {
      for (const pid of node.parent_ids) {
        expectedChildren.get(pid)?.push(node.id);
      }
    }
    const mismatches = [];
    for (const node of graph) {
      const expected = [...(expectedChildren.get(node.id) ?? [])].sort();
      const actual = [...(node.children ?? [])].sort();
      if (JSON.stringify(expected) !== JSON.stringify(actual)) {
        mismatches.push(node.id);
      }
    }
    expect(mismatches).toEqual([]);
  });
});
