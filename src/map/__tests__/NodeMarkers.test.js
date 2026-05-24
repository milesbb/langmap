import { describe, it, expect } from 'vitest';
import { geoToSvg, branchColor } from '../NodeMarkers.js';

describe('geoToSvg', () => {
  it('maps (lat=0, lng=0) to (5000, 2500) — centre of viewBox', () => {
    const { x, y } = geoToSvg({ lat: 0, lng: 0 });
    expect(x).toBe(5000);
    expect(y).toBe(2500);
  });

  it('maps (lat=90, lng=-180) to (0, 0) — top-left corner', () => {
    const { x, y } = geoToSvg({ lat: 90, lng: -180 });
    expect(x).toBe(0);
    expect(y).toBe(0);
  });

  it('maps (lat=-90, lng=180) to (10000, 5000) — bottom-right corner', () => {
    const { x, y } = geoToSvg({ lat: -90, lng: 180 });
    expect(x).toBe(10000);
    expect(y).toBe(5000);
  });

  it('maps Old English geo_bounds to England region in SVG (roughly left-centre)', () => {
    // Old English: lat=52.5, lng=-1.5
    const { x, y } = geoToSvg({ lat: 52.5, lng: -1.5 });
    expect(x).toBeCloseTo(4958, 0);
    expect(y).toBeCloseTo(1042, 0);
  });

  it('maps PIE Pontic Steppe coords to central Eurasian region', () => {
    // PIE: lat=47, lng=38
    const { x, y } = geoToSvg({ lat: 47, lng: 38 });
    expect(x).toBeCloseTo(6056, 0);
    expect(y).toBeCloseTo(1194, 0);
  });

  it('maps Tocharian Tarim Basin coords to eastern region of SVG', () => {
    // Tocharian B: lat=41, lng=86
    const { x, y } = geoToSvg({ lat: 41, lng: 86 });
    expect(x).toBeGreaterThan(7000);   // far east
    expect(y).toBeGreaterThan(1000);
    expect(y).toBeLessThan(2000);
  });

  it('x increases as longitude increases (west to east)', () => {
    const west = geoToSvg({ lat: 0, lng: -90 });
    const east = geoToSvg({ lat: 0, lng: 90 });
    expect(east.x).toBeGreaterThan(west.x);
  });

  it('y increases as latitude decreases (north to south)', () => {
    const north = geoToSvg({ lat: 60, lng: 0 });
    const south = geoToSvg({ lat: -60, lng: 0 });
    expect(south.y).toBeGreaterThan(north.y);
  });
});

describe('branchColor', () => {
  it('returns the Germanic branch colour for "Germanic"', () => {
    expect(branchColor('Germanic')).toBe('#3A5A7C');
  });

  it('returns the Celtic branch colour for "Celtic"', () => {
    expect(branchColor('Celtic')).toBe('#2E7D52');
  });

  it('returns a fallback grey for an unknown branch', () => {
    expect(branchColor('Unknown')).toBe('#888888');
  });
});
