import {
  AdjacencyEntry,
  GeneratedGraphType,
  GraphData,
  GraphEdge,
  GraphNode,
} from '../types/graph';

/**
 * Deterministic comparator for vertex labels:
 * Sorts natural numeric labels (e.g. V1, V2, V10 or 0, 1, 2) naturally,
 * otherwise lexicographically (A, B, C).
 */
export function compareLabels(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Generates standard vertex labels: A..Z, then A1..Z1, etc.
 */
export function generateVertexLabel(index: number): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (index < 26) {
    return alphabet[index];
  }
  const suffix = Math.floor(index / 26);
  return `${alphabet[index % 26]}${suffix}`;
}

/**
 * Deterministic Mulberry32 PRNG for reproducible experimental graph generation.
 */
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Builds a deterministic adjacency list from GraphData.
 * Neighbors are sorted by label so BFS and DFS produce reproducible, predictable traversal orders.
 */
export function buildAdjacencyList(graph: GraphData): Map<string, AdjacencyEntry[]> {
  const labelMap = new Map<string, string>();
  for (const node of graph.nodes) {
    labelMap.set(node.id, node.label);
  }

  const adj = new Map<string, AdjacencyEntry[]>();
  for (const node of graph.nodes) {
    adj.set(node.id, []);
  }

  for (const edge of graph.edges) {
    if (!adj.has(edge.source) || !adj.has(edge.target)) continue;
    const targetLabel = labelMap.get(edge.target) ?? edge.target;
    adj.get(edge.source)!.push({
      neighborId: edge.target,
      neighborLabel: targetLabel,
      edgeId: edge.id,
      weight: edge.weight,
    });

    if (!graph.directed && edge.source !== edge.target) {
      const sourceLabel = labelMap.get(edge.source) ?? edge.source;
      adj.get(edge.target)!.push({
        neighborId: edge.source,
        neighborLabel: sourceLabel,
        edgeId: edge.id,
        weight: edge.weight,
      });
    }
  }

  // Sort neighbors deterministically by label
  for (const [, list] of adj) {
    list.sort((a, b) => compareLabels(a.neighborLabel, b.neighborLabel));
  }

  return adj;
}

/**
 * Computes clean circular or multi-ring 2D coordinates for a list of vertex labels.
 */
export function layoutCircularNodes(
  labels: string[],
  width = 720,
  height = 460
): GraphNode[] {
  const n = labels.length;
  const cx = width / 2;
  const cy = height / 2;

  if (n === 0) return [];
  if (n === 1) {
    return [{ id: `n-0`, label: labels[0], x: cx, y: cy }];
  }

  const radius = Math.min(width, height) * (n > 14 ? 0.41 : 0.36);

  return labels.map((label, idx) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * idx) / n;
    return {
      id: `n-${idx}`,
      label,
      x: Math.round(cx + radius * Math.cos(angle)),
      y: Math.round(cy + radius * Math.sin(angle)),
    };
  });
}

export interface ParseResult {
  ok: boolean;
  graph?: GraphData;
  error?: string;
}

/**
 * Validates and parses an Edge List text input.
 * Accepted line formats:
 *   A B          (unweighted or weight=1)
 *   A B 5        (weighted)
 *   A -> B 5     (arrow syntax also accepted)
 *   A - B
 */
export function parseEdgeListInput(
  rawText: string,
  expectedVertexCount: number | null,
  expectedEdgeCount: number | null,
  directed: boolean,
  weighted: boolean
): ParseResult {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  if (expectedVertexCount !== null) {
    if (!Number.isInteger(expectedVertexCount) || expectedVertexCount < 0 || expectedVertexCount > 80) {
      return {
        ok: false,
        error: 'Vertex count must be a whole number between 0 and 80.',
      };
    }
  }

  if (expectedEdgeCount !== null) {
    if (!Number.isInteger(expectedEdgeCount) || expectedEdgeCount < 0 || expectedEdgeCount > 400) {
      return {
        ok: false,
        error: 'Edge count must be a whole number between 0 and 400.',
      };
    }
    if (lines.length !== expectedEdgeCount) {
      return {
        ok: false,
        error: `Expected ${expectedEdgeCount} edge line${expectedEdgeCount === 1 ? '' : 's'}, but received ${lines.length}. Update the edge count field or add/remove lines.`,
      };
    }
  }

  if (lines.length === 0 && (!expectedVertexCount || expectedVertexCount === 0)) {
    return {
      ok: false,
      error: 'Please enter at least one edge (e.g., "A B") or specify a positive number of vertices.',
    };
  }

  const labelSet = new Set<string>();
  const parsedEdges: { u: string; v: string; w: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const cleaned = lines[i].replace(/<->|->|--|-|,/g, ' ').trim();
    const parts = cleaned.split(/\s+/);
    if (parts.length < 2 || parts.length > 3) {
      return {
        ok: false,
        error: `Line ${i + 1} ("${lines[i]}") is invalid. Expected format: "Source Target" or "Source Target Weight" (e.g., "A B 4").`,
      };
    }

    const [u, v, wStr] = parts;
    if (!/^[A-Za-z0-9_]+$/.test(u) || !/^[A-Za-z0-9_]+$/.test(v)) {
      return {
        ok: false,
        error: `Line ${i + 1}: Vertex names "${u}" and "${v}" must contain only letters, digits, or underscores.`,
      };
    }
    if (u === v) {
      return {
        ok: false,
        error: `Line ${i + 1}: Self-loop "${u} -> ${v}" is not supported in simple graphs. Connect two distinct vertices.`,
      };
    }

    let weight = 1;
    if (wStr !== undefined) {
      weight = Number(wStr);
      if (!Number.isFinite(weight) || weight <= 0) {
        return {
          ok: false,
          error: `Line ${i + 1}: Edge weight "${wStr}" must be a positive number.`,
        };
      }
    }

    labelSet.add(u);
    labelSet.add(v);
    parsedEdges.push({ u, v, w: weighted ? weight : 1 });
  }

  // If expectedVertexCount is larger than discovered labels, pad with standard vertex names (for isolated vertices)
  if (expectedVertexCount !== null) {
    if (labelSet.size > expectedVertexCount) {
      return {
        ok: false,
        error: `Your edge list references ${labelSet.size} distinct vertices (${Array.from(labelSet).join(', ')}), which exceeds the specified vertex count of ${expectedVertexCount}.`,
      };
    }
    let idx = 0;
    while (labelSet.size < expectedVertexCount) {
      const candidate = generateVertexLabel(idx++);
      if (!labelSet.has(candidate)) {
        labelSet.add(candidate);
      }
    }
  }

  const sortedLabels = Array.from(labelSet).sort(compareLabels);
  const nodes = layoutCircularNodes(sortedLabels);
  const labelToId = new Map(nodes.map((n) => [n.label, n.id]));

  const seenPairs = new Set<string>();
  const edges: GraphEdge[] = [];

  for (let i = 0; i < parsedEdges.length; i++) {
    const { u, v, w } = parsedEdges[i];
    const source = labelToId.get(u)!;
    const target = labelToId.get(v)!;
    const key = directed
      ? `${source}->${target}`
      : [source, target].sort().join('--');

    if (seenPairs.has(key)) {
      return {
        ok: false,
        error: `Duplicate edge detected between "${u}" and "${v}". Simple graphs allow at most one edge per pair in the same direction.`,
      };
    }
    seenPairs.add(key);

    edges.push({
      id: `e-${i}`,
      source,
      target,
      weight: w,
    });
  }

  return {
    ok: true,
    graph: {
      name: 'Custom Edge List Graph',
      directed,
      weighted,
      nodes,
      edges,
    },
  };
}

/**
 * Validates and parses an Adjacency List text input.
 * Accepted line formats:
 *   A: B, C, D
 *   B: A(3), E(2)
 *   F:             (isolated vertex with no neighbors)
 */
export function parseAdjacencyListInput(
  rawText: string,
  directed: boolean,
  weighted: boolean
): ParseResult {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  if (lines.length === 0) {
    return {
      ok: false,
      error: 'Adjacency list cannot be empty. Example line: "A: B, C".',
    };
  }

  const labelSet = new Set<string>();
  const rawAdj: { u: string; neighbors: { v: string; w: number }[] }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const colonIdx = lines[i].indexOf(':');
    if (colonIdx === -1) {
      return {
        ok: false,
        error: `Line ${i + 1} ("${lines[i]}") is missing a colon ":". Use format "Vertex: Neighbor1, Neighbor2".`,
      };
    }

    const u = lines[i].slice(0, colonIdx).trim();
    const rest = lines[i].slice(colonIdx + 1).trim();

    if (!u || !/^[A-Za-z0-9_]+$/.test(u)) {
      return {
        ok: false,
        error: `Line ${i + 1}: Invalid vertex label "${u}". Use alphanumeric characters.`,
      };
    }

    labelSet.add(u);
    const neighbors: { v: string; w: number }[] = [];

    if (rest.length > 0) {
      const tokens = rest
        .split(/[,\s]+/)
        .map((t) => t.trim())
        .filter(Boolean);

      for (const tok of tokens) {
        // Match either "B" or "B(4)"
        const match = /^([A-Za-z0-9_]+)(?:\(([0-9.]+)\))?$/.exec(tok);
        if (!match) {
          return {
            ok: false,
            error: `Line ${i + 1}: Invalid neighbor entry "${tok}". Use "B" or weighted "B(4)".`,
          };
        }
        const v = match[1];
        if (v === u) {
          return {
            ok: false,
            error: `Line ${i + 1}: Self-loop on vertex "${u}" is not allowed.`,
          };
        }
        const w = match[2] ? Number(match[2]) : 1;
        if (!Number.isFinite(w) || w <= 0) {
          return {
            ok: false,
            error: `Line ${i + 1}: Weight in "${tok}" must be a positive number.`,
          };
        }
        labelSet.add(v);
        neighbors.push({ v, w: weighted ? w : 1 });
      }
    }

    rawAdj.push({ u, neighbors });
  }

  if (labelSet.size > 80) {
    return { ok: false, error: 'Adjacency list exceeds maximum of 80 vertices.' };
  }

  const sortedLabels = Array.from(labelSet).sort(compareLabels);
  const nodes = layoutCircularNodes(sortedLabels);
  const labelToId = new Map(nodes.map((n) => [n.label, n.id]));

  const seenPairs = new Set<string>();
  const edges: GraphEdge[] = [];

  for (const { u, neighbors } of rawAdj) {
    const source = labelToId.get(u)!;
    for (const { v, w } of neighbors) {
      const target = labelToId.get(v)!;
      const key = directed
        ? `${source}->${target}`
        : [source, target].sort().join('--');
      if (!seenPairs.has(key)) {
        seenPairs.add(key);
        edges.push({
          id: `e-${edges.length}`,
          source,
          target,
          weight: w,
        });
      }
    }
  }

  return {
    ok: true,
    graph: {
      name: 'Custom Adjacency List Graph',
      directed,
      weighted,
      nodes,
      edges,
    },
  };
}

/**
 * Validates and parses a square N x N Adjacency Matrix input.
 * Zero entries mean no edge; positive numeric entries create an edge (with weight if weighted=true).
 */
export function parseAdjacencyMatrixInput(
  rawText: string,
  directed: boolean,
  weighted: boolean
): ParseResult {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  if (lines.length === 0) {
    return {
      ok: false,
      error: 'Adjacency matrix cannot be empty. Enter an N x N grid of numbers separated by spaces or commas.',
    };
  }

  const n = lines.length;
  if (n > 30) {
    return {
      ok: false,
      error: 'Adjacency matrix input supports up to 30 x 30 vertices for readability.',
    };
  }

  const matrix: number[][] = [];
  for (let r = 0; r < n; r++) {
    const cells = lines[r]
      .split(/[\s,]+/)
      .map((c) => c.trim())
      .filter(Boolean);

    if (cells.length !== n) {
      return {
        ok: false,
        error: `Matrix must be square (${n}x${n}), but row ${r + 1} has ${cells.length} value${cells.length === 1 ? '' : 's'}.`,
      };
    }

    const rowNums: number[] = [];
    for (let c = 0; c < n; c++) {
      const val = Number(cells[c]);
      if (!Number.isFinite(val) || val < 0) {
        return {
          ok: false,
          error: `Row ${r + 1}, Column ${c + 1} ("${cells[c]}") must be a non-negative number (0 for no edge, >0 for an edge).`,
        };
      }
      if (r === c && val !== 0) {
        return {
          ok: false,
          error: `Diagonal entry (${r + 1}, ${c + 1}) must be 0 (self-loops are disabled).`,
        };
      }
      rowNums.push(val);
    }
    matrix.push(rowNums);
  }

  // Check symmetry warning/validation for undirected graphs
  if (!directed) {
    for (let r = 0; r < n; r++) {
      for (let c = r + 1; c < n; c++) {
        if (matrix[r][c] !== matrix[c][r]) {
          return {
            ok: false,
            error: `Undirected adjacency matrix must be symmetric, but entry (${r + 1}, ${c + 1}) = ${matrix[r][c]} differs from (${c + 1}, ${r + 1}) = ${matrix[c][r]}. Enable "Directed Graph" or make the matrix symmetric.`,
          };
        }
      }
    }
  }

  const labels = Array.from({ length: n }, (_, i) => generateVertexLabel(i));
  const nodes = layoutCircularNodes(labels);
  const edges: GraphEdge[] = [];

  for (let r = 0; r < n; r++) {
    const startCol = directed ? 0 : r + 1;
    for (let c = startCol; c < n; c++) {
      if (r !== c && matrix[r][c] > 0) {
        edges.push({
          id: `e-${edges.length}`,
          source: nodes[r].id,
          target: nodes[c].id,
          weight: weighted ? matrix[r][c] : 1,
        });
      }
    }
  }

  return {
    ok: true,
    graph: {
      name: 'Custom Adjacency Matrix Graph',
      directed,
      weighted,
      nodes,
      edges,
    },
  };
}

export function serializeToEdgeList(graph: GraphData): string {
  const idToLabel = new Map(graph.nodes.map((n) => [n.id, n.label]));
  return graph.edges
    .map((e) => {
      const u = idToLabel.get(e.source) ?? e.source;
      const v = idToLabel.get(e.target) ?? e.target;
      return graph.weighted ? `${u} ${v} ${e.weight}` : `${u} ${v}`;
    })
    .join('\n');
}

export function serializeToAdjacencyList(graph: GraphData): string {
  const adj = buildAdjacencyList(graph);
  const sortedNodes = [...graph.nodes].sort((a, b) => compareLabels(a.label, b.label));
  return sortedNodes
    .map((node) => {
      const list = adj.get(node.id) ?? [];
      const formatted = list
        .map((entry) =>
          graph.weighted
            ? `${entry.neighborLabel}(${entry.weight})`
            : entry.neighborLabel
        )
        .join(', ');
      return `${node.label}: ${formatted}`;
    })
    .join('\n');
}

export function serializeToAdjacencyMatrix(graph: GraphData): string {
  const sortedNodes = [...graph.nodes].sort((a, b) => compareLabels(a.label, b.label));
  const idxMap = new Map(sortedNodes.map((n, idx) => [n.id, idx]));
  const n = sortedNodes.length;
  const mat: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (const edge of graph.edges) {
    const r = idxMap.get(edge.source);
    const c = idxMap.get(edge.target);
    if (r === undefined || c === undefined) continue;
    const val = graph.weighted ? edge.weight : 1;
    mat[r][c] = val;
    if (!graph.directed) {
      mat[c][r] = val;
    }
  }

  return mat.map((row) => row.join(' ')).join('\n');
}

export interface GeneratorOptions {
  type: GeneratedGraphType;
  vertexCount: number;
  density?: number; // 0.0 to 1.0
  edgeCount?: number;
  directed?: boolean;
  weighted?: boolean;
  seed?: number;
  width?: number;
  height?: number;
}

/**
 * Generates authentic, deterministic graphs of requested topology for both visual sandbox & DAA benchmarks.
 */
export function generateGraph(options: GeneratorOptions): GraphData {
  const {
    type,
    vertexCount: rawV,
    density = 0.35,
    edgeCount,
    directed = false,
    weighted = false,
    seed = 42,
    width = 720,
    height = 460,
  } = options;

  const vCount = Math.max(1, Math.floor(rawV));
  const rng = createSeededRandom(seed);
  const labels = Array.from({ length: vCount }, (_, i) => generateVertexLabel(i));

  // Position nodes thoughtfully according to graph type
  let nodes: GraphNode[] = [];
  if (type === 'linear') {
    const marginX = 70;
    const usableW = Math.max(200, width - marginX * 2);
    nodes = labels.map((label, i) => ({
      id: `n-${i}`,
      label,
      x:
        vCount === 1
          ? Math.round(width / 2)
          : Math.round(marginX + (usableW * i) / (vCount - 1)),
      y: Math.round(height / 2 + (i % 2 === 0 ? -28 : 28)),
    }));
  } else if (type === 'tree') {
    // Hierarchical binary/k-ary tree layout
    nodes = labels.map((label, i) => {
      const level = Math.floor(Math.log2(i + 1));
      const maxLevel = Math.max(1, Math.floor(Math.log2(vCount)));
      const levelStart = (1 << level) - 1;
      const posInLevel = i - levelStart;
      const countInLevel = Math.min(1 << level, vCount - levelStart);
      const x = Math.round(((posInLevel + 1) * width) / (countInLevel + 1));
      const y = Math.round(65 + (level * (height - 130)) / maxLevel);
      return { id: `n-${i}`, label, x, y };
    });
  } else if (type === 'disconnected' && vCount >= 4) {
    // Split into 2–3 distinct spatial clusters
    const clusters = vCount >= 7 ? 3 : 2;
    nodes = labels.map((label, i) => {
      const cIdx = i % clusters;
      const centerX = Math.round(((cIdx + 0.5) * width) / clusters);
      const centerY = Math.round(height / 2);
      const groupMembers = Math.ceil(vCount / clusters);
      const localIdx = Math.floor(i / clusters);
      const angle = (2 * Math.PI * localIdx) / Math.max(1, groupMembers);
      const r = Math.min(95, width / (clusters * 2.8));
      return {
        id: `n-${i}`,
        label,
        x: Math.round(centerX + r * Math.cos(angle)),
        y: Math.round(centerY + r * Math.sin(angle)),
      };
    });
  } else {
    nodes = layoutCircularNodes(labels, width, height);
  }

  const edges: GraphEdge[] = [];
  const pairSet = new Set<string>();

  const addEdge = (uIdx: number, vIdx: number) => {
    if (uIdx === vIdx || uIdx < 0 || vIdx < 0 || uIdx >= vCount || vIdx >= vCount) {
      return false;
    }
    const u = nodes[uIdx].id;
    const v = nodes[vIdx].id;
    const key = directed ? `${u}->${v}` : [u, v].sort().join('--');
    if (pairSet.has(key)) return false;
    pairSet.add(key);
    edges.push({
      id: `e-${edges.length}`,
      source: u,
      target: v,
      weight: weighted ? Math.floor(rng() * 9) + 1 : 1,
    });
    return true;
  };

  const maxEdges = directed ? vCount * (vCount - 1) : (vCount * (vCount - 1)) / 2;

  if (vCount <= 1) {
    return {
      name: `Generated ${type} graph`,
      directed,
      weighted,
      nodes,
      edges,
    };
  }

  if (type === 'linear') {
    for (let i = 0; i < vCount - 1; i++) {
      addEdge(i, i + 1);
    }
  } else if (type === 'cyclic') {
    for (let i = 0; i < vCount; i++) {
      addEdge(i, (i + 1) % vCount);
    }
    // Add one chord if large enough
    if (vCount >= 5) {
      addEdge(0, Math.floor(vCount / 2));
    }
  } else if (type === 'tree') {
    // Connect each node i >= 1 to parent floor((i-1)/2) or randomized earlier node
    for (let i = 1; i < vCount; i++) {
      const parent = Math.floor((i - 1) / 2);
      addEdge(parent, i);
    }
  } else if (type === 'complete') {
    for (let i = 0; i < vCount; i++) {
      const jStart = directed ? 0 : i + 1;
      for (let j = jStart; j < vCount; j++) {
        if (i !== j) addEdge(i, j);
      }
    }
  } else if (type === 'disconnected') {
    const clusters = vCount >= 7 ? 3 : 2;
    for (let c = 0; c < clusters; c++) {
      const members: number[] = [];
      for (let i = 0; i < vCount; i++) {
        if (i % clusters === c) members.push(i);
      }
      for (let m = 0; m < members.length - 1; m++) {
        addEdge(members[m], members[m + 1]);
      }
      if (members.length >= 3) {
        addEdge(members[members.length - 1], members[0]);
      }
    }
  } else {
    // sparse, dense, or random
    let targetEdges: number;
    if (edgeCount !== undefined) {
      targetEdges = Math.min(maxEdges, Math.max(0, Math.round(edgeCount)));
    } else if (type === 'sparse') {
      targetEdges = Math.min(maxEdges, Math.max(vCount - 1, Math.round(vCount * 1.25)));
    } else if (type === 'dense') {
      targetEdges = Math.min(maxEdges, Math.max(vCount, Math.round(maxEdges * 0.72)));
    } else {
      targetEdges = Math.min(maxEdges, Math.max(0, Math.round(maxEdges * density)));
    }

    // Build all candidate pairs, shuffle with Fisher-Yates using seeded PRNG, take targetEdges
    const allPairs: [number, number][] = [];
    for (let i = 0; i < vCount; i++) {
      const jStart = directed ? 0 : i + 1;
      for (let j = jStart; j < vCount; j++) {
        if (i !== j) allPairs.push([i, j]);
      }
    }

    // If sparse or dense, ensure a spanning backbone first when targetEdges >= vCount - 1 so traversal explores meaningfully
    if ((type === 'sparse' || type === 'dense') && targetEdges >= vCount - 1) {
      for (let i = 1; i < vCount; i++) {
        const parent = Math.floor(rng() * i);
        addEdge(parent, i);
      }
    }

    for (let i = allPairs.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = allPairs[i];
      allPairs[i] = allPairs[j];
      allPairs[j] = tmp;
    }

    for (const [u, v] of allPairs) {
      if (edges.length >= targetEdges) break;
      addEdge(u, v);
    }
  }

  const prettyType = type.charAt(0).toUpperCase() + type.slice(1);
  return {
    name: `${prettyType} Graph (${vCount}V, ${edges.length}E)`,
    directed,
    weighted,
    nodes,
    edges,
  };
}
