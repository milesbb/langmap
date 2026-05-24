#!/usr/bin/env python3
"""
Convert raw Notion page JSON files (saved from MCP fetch) into languages.json and graph.json.

Usage:
    python3 scripts/convert-notion-to-json.py

Reads:  scripts/notion-raw/*.json  (raw MCP fetch responses, one per Notion page)
Writes: data/languages.json        (all language nodes merged)
        data/graph.json             (adjacency list derived from parent_ids)
"""

import json
import re
import sys
from pathlib import Path

RAW_DIR = Path(__file__).parent / "notion-raw"
DATA_DIR = Path(__file__).parent.parent / "public" / "data"

READING_ORDER = [
    "pie-root",
    "alpha-english-path",
    "phase1-germanic",
    "phase2-italic-romance",
    "phase3-slavic-baltic",
    "phase4-hellenic-armenian-albanian",
    "phase5-celtic",
    "phase6-indo-iranian",
    "phase7-anatolian-fringe",
]


def extract_json_blocks(text: str) -> list[dict]:
    """Extract all ```json ... ``` code blocks from Notion markdown text and parse them."""
    pattern = r"```json\s*([\s\S]*?)```"
    blocks = re.findall(pattern, text)
    nodes = []
    for i, block in enumerate(blocks):
        block = block.strip()
        if not block:
            continue
        try:
            parsed = json.loads(block)
            if isinstance(parsed, dict):
                nodes.append(parsed)
            elif isinstance(parsed, list):
                nodes.extend(parsed)
        except json.JSONDecodeError as e:
            print(f"  WARNING: could not parse block {i+1}: {e}", file=sys.stderr)
            print(f"  Block preview: {block[:100]}", file=sys.stderr)
    return nodes


def load_raw_page(filename: str) -> list[dict]:
    """Load a raw Notion MCP response file and extract language nodes from it.

    Supports two formats:
    - {"text": "...markdown with embedded ```json blocks..."} — from MCP fetch responses
    - {"nodes": [...]} — pre-extracted node array (used for large pages saved inline)
    """
    path = RAW_DIR / filename
    if not path.exists():
        print(f"  MISSING: {path} — skipping", file=sys.stderr)
        return []

    with open(path) as f:
        raw = json.load(f)

    # Pre-extracted nodes format
    if "nodes" in raw:
        nodes = raw["nodes"]
        print(f"  {filename}: loaded {len(nodes)} pre-extracted node(s)")
        return nodes

    # MCP fetch response with embedded markdown
    text = raw.get("text", "")
    if not text:
        print(f"  WARNING: no `text` or `nodes` field in {filename}", file=sys.stderr)
        return []

    nodes = extract_json_blocks(text)
    print(f"  {filename}: extracted {len(nodes)} node(s) from markdown")
    return nodes


def validate_nodes(nodes: list[dict]) -> list[str]:
    """Return list of validation error messages (empty = all good)."""
    errors = []
    seen_ids: dict[str, int] = {}
    node_ids = {n.get("id") for n in nodes if n.get("id")}

    valid_statuses = {"living", "extinct", "reconstructed", "liturgical"}

    for i, node in enumerate(nodes):
        nid = node.get("id")
        label = f"node[{i}] id={nid!r}"

        # Required fields
        for field in ["id", "name", "parent_ids", "status", "region_id", "geo_bounds"]:
            if field not in node:
                errors.append(f"{label}: missing required field `{field}`")

        if not nid:
            continue

        # Duplicate IDs
        if nid in seen_ids:
            errors.append(f"{label}: duplicate id (first seen at index {seen_ids[nid]})")
        else:
            seen_ids[nid] = i

        # parent_ids must be array
        parent_ids = node.get("parent_ids")
        if parent_ids is not None and not isinstance(parent_ids, list):
            errors.append(f"{label}: `parent_ids` must be an array, got {type(parent_ids).__name__}")

        # parent_ids must reference existing nodes
        if isinstance(parent_ids, list):
            for pid in parent_ids:
                if pid and pid not in node_ids:
                    errors.append(f"{label}: parent_id {pid!r} not found in node set")

        # status enum
        status = node.get("status")
        if status and status not in valid_statuses:
            errors.append(f"{label}: invalid status {status!r} (must be one of {valid_statuses})")

        # geo_bounds ranges
        geo = node.get("geo_bounds", {})
        if isinstance(geo, dict):
            lat = geo.get("lat")
            lng = geo.get("lng")
            if lat is not None and not (-90 <= lat <= 90):
                errors.append(f"{label}: geo_bounds.lat={lat} out of range [-90, 90]")
            if lng is not None and not (-180 <= lng <= 180):
                errors.append(f"{label}: geo_bounds.lng={lng} out of range [-180, 180]")

        # youtube_id must be null or non-empty string, never undefined
        if "youtube_id" in node:
            yt = node["youtube_id"]
            if yt is not None and (not isinstance(yt, str) or yt == ""):
                errors.append(f"{label}: youtube_id must be null or non-empty string")

    # DAG cycle check (simple DFS)
    adjacency = {n["id"]: n.get("parent_ids", []) for n in nodes if n.get("id")}
    visited: set[str] = set()
    path: set[str] = set()

    def has_cycle(node_id: str) -> bool:
        if node_id in path:
            return True
        if node_id in visited:
            return False
        visited.add(node_id)
        path.add(node_id)
        for parent in adjacency.get(node_id, []):
            if parent in adjacency and has_cycle(parent):
                return True
        path.discard(node_id)
        return False

    for node_id in adjacency:
        if has_cycle(node_id):
            errors.append(f"DAG cycle detected involving node {node_id!r}")
            break

    return errors


def build_graph(nodes: list[dict]) -> dict:
    """Build adjacency list graph.json from parent_ids."""
    children_of: dict[str, list[str]] = {}
    parents_of: dict[str, list[str]] = {}

    all_ids = {n["id"] for n in nodes if n.get("id")}
    for nid in all_ids:
        children_of[nid] = []
        parents_of[nid] = []

    for node in nodes:
        nid = node.get("id")
        if not nid:
            continue
        parent_ids = node.get("parent_ids", [])
        parents_of[nid] = parent_ids
        for pid in parent_ids:
            if pid in children_of:
                children_of[pid].append(nid)

    # Compact graph nodes with just the fields needed for fast initial render
    graph_nodes = []
    node_map = {n["id"]: n for n in nodes if n.get("id")}
    for node in nodes:
        nid = node.get("id")
        if not nid:
            continue
        graph_nodes.append({
            "id": nid,
            "parent_ids": node.get("parent_ids", []),
            "children": children_of.get(nid, []),
            "branch": node.get("groups", [""])[0] if node.get("groups") else "",
            "status": node.get("status", ""),
            "date_range": node.get("date_range", ""),
            "region_id": node.get("region_id", ""),
            "geo_bounds": node.get("geo_bounds", {}),
        })

    return graph_nodes


def main():
    print(f"Reading raw Notion files from: {RAW_DIR}")
    print(f"Writing output to: {DATA_DIR}\n")

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    all_nodes: list[dict] = []

    for slug in READING_ORDER:
        filename = f"{slug}.json"
        print(f"Processing {filename}...")
        nodes = load_raw_page(filename)
        all_nodes.extend(nodes)

    print(f"\nTotal nodes extracted: {len(all_nodes)}")

    print("\nValidating...")
    errors = validate_nodes(all_nodes)
    if errors:
        print(f"\n{len(errors)} validation error(s):")
        for err in errors:
            print(f"  ✗ {err}")
        print("\nFix errors before writing output.")
        sys.exit(1)
    else:
        print("  ✓ All validation checks passed")

    languages_path = DATA_DIR / "languages.json"
    with open(languages_path, "w") as f:
        json.dump(all_nodes, f, indent=2, ensure_ascii=False)
    print(f"\nWrote {len(all_nodes)} nodes to {languages_path}")

    graph = build_graph(all_nodes)
    graph_path = DATA_DIR / "graph.json"
    with open(graph_path, "w") as f:
        json.dump(graph, f, indent=2, ensure_ascii=False)
    print(f"Wrote graph ({len(graph)} entries) to {graph_path}")

    print("\nDone.")


if __name__ == "__main__":
    main()
