import { describe, it, expect, beforeEach } from 'vitest';
import { select } from 'd3';
import { RegionManager } from '../RegionManager.js';

function makeSvgFixture() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  document.body.appendChild(svg);

  const region = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  region.setAttribute('id', 'region-old-english');
  region.style.display = 'none';
  svg.appendChild(region);

  const other = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  other.setAttribute('id', 'region-proto-germanic');
  other.style.display = 'none';
  svg.appendChild(other);

  return { svg, region, other };
}

describe('RegionManager', () => {
  let manager;
  let region;
  let other;

  beforeEach(() => {
    document.body.innerHTML = '';
    const fixture = makeSvgFixture();
    region = fixture.region;
    other = fixture.other;
    const d3svg = select(fixture.svg);
    manager = new RegionManager(d3svg);
  });

  it('sets display:block only on the activated region', () => {
    manager.activate('region-old-english');
    expect(region.style.display).toBe('block');
    expect(other.style.display).toBe('none');
  });

  it('adds region--active class on activation', () => {
    manager.activate('region-old-english');
    expect(region.classList.contains('region--active')).toBe(true);
  });

  it('deactivates the previous region before activating a new one', () => {
    manager.activate('region-old-english');
    manager.activate('region-proto-germanic');
    expect(region.style.display).toBe('none');
    expect(other.style.display).toBe('block');
  });

  it('sets display:none and removes region--active class on deactivate', () => {
    manager.activate('region-old-english');
    manager.deactivate();
    expect(region.style.display).toBe('none');
    expect(region.classList.contains('region--active')).toBe(false);
  });

  it('does not error when region_id does not exist in SVG', () => {
    expect(() => manager.activate('region-nonexistent')).not.toThrow();
  });

  it('sets CSS color when branch is passed', () => {
    manager.activate('region-old-english', 'Germanic');
    expect(region.style.color).toBeTruthy();
  });

  it('deactivate is a no-op when nothing is active', () => {
    expect(() => manager.deactivate()).not.toThrow();
  });
});
