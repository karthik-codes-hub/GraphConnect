import {
  ComponentInfo,
  ConnectivityReport,
  CycleInfo,
  DegreeInfo,
  GraphData,
  ReachabilityResult,
} from '../types/graph';
import { buildAdjacencyList, compareLabels } from './graphCore';

const COMPONENT_PALETTE = [
  '#3B82F6', // Electric Blue
  '#06B6D4', // Cyan
  '#8B5CF6', // Violet
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
];

/**
 * Computes Weakly Connected Components (or standard Connected Components for undirected graphs)
 * by ignoring edge direction and running deterministic BFS across unvisited vertices.
 */
function computeUndirectedComponents(graph: GraphData): ComponentInfo[] {
  const sortedNodes = [...graph.nodes].sort((a, b) => compareLabels(a.label, b.label));
  const idToLabel = new Map(graph.nodes.map((n) => [n.id, n.label]));

  // Build symmetric adjacency regardless of graph.directed
  const undirectedAdj = new Map<string, string[]>();
  for (const n of sortedNodes) undirectedAdj.set(n.id, []);
  for (const e of graph.edges) {
    if (undirectedAdj.has(e.source) && undirectedAdj.has(e.target)) {
      undirectedAdj.get(e.source)!.push(e.target);
      if (e.source !== e.target) {
        undirectedAdj.get(e.target)!.push(e.source);
      }
    }
  }

  const visited = new Set<string>();
  const components: ComponentInfo[] = [];

  for (const node of sortedNodes) {
    if (visited.has(node.id)) continue;
    const compIds: string[] = [];
    const queue = [node.id];
    visited.add(node.id);

    while (queue.length > 0) {
      const u = queue.shift()!;
      compIds.push(u);
      const neighbors = undirectedAdj.get(u) ?? [];
      for (const v of neighbors) {
        if (!visited.has(v)) {
          visited.add(v);
          queue.push(v);
        }
      }
    }

    compIds.sort((a, b) =>
      compareLabels(idToLabel.get(a) ?? a, idToLabel.get(b) ?? b)
    );

    components.push({
      index: components.length + 1,
      nodeIds: compIds,
      labels: compIds.map((id) => idToLabel.get(id) ?? id),
      color: COMPONENT_PALETTE[components.length % COMPONENT_PALETTE.length],
    });
  }

  return components;
}

/**
 * Computes Strongly Connected Components (SCCs) for directed graphs using Kosaraju's two-pass DFS.
 */
function computeStronglyConnectedComponents(graph: GraphData): ComponentInfo[] {
  const sortedNodes = [...graph.nodes].sort((a, b) => compareLabels(a.label, b.label));
  const idToLabel = new Map(graph.nodes.map((n) => [n.id, n.label]));

  const forwardAdj = new Map<string, string[]>();
  const reverseAdj = new Map<string, string[]>();
  for (const n of sortedNodes) {
    forwardAdj.set(n.id, []);
    reverseAdj.set(n.id, []);
  }
  for (const e of graph.edges) {
    if (forwardAdj.has(e.source) && forwardAdj.has(e.target)) {
      forwardAdj.get(e.source)!.push(e.target);
      reverseAdj.get(e.target)!.push(e.source);
    }
  }

  // Pass 1: Record finish order on forward graph
  const visited1 = new Set<string>();
  const finishStack: string[] = [];

  const dfs1 = (u: string) => {
    visited1.add(u);
    for (const v of forwardAdj.get(u) ?? []) {
      if (!visited1.has(v)) dfs1(v);
    }
    finishStack.push(u);
  };

  for (const n of sortedNodes) {
    if (!visited1.has(n.id)) dfs1(n.id);
  }

  // Pass 2: Traverse transposed graph in reverse finish order
  const visited2 = new Set<string>();
  const sccs: ComponentInfo[] = [];

  while (finishStack.length > 0) {
    const root = finishStack.pop()!;
    if (visited2.has(root)) continue;
    const compIds: string[] = [];

    const dfs2 = (u: string) => {
      visited2.add(u);
      compIds.push(u);
      for (const v of reverseAdj.get(u) ?? []) {
        if (!visited2.has(v)) dfs2(v);
      }
    };

    dfs2(root);
    compIds.sort((a, b) =>
      compareLabels(idToLabel.get(a) ?? a, idToLabel.get(b) ?? b)
    );
    sccs.push({
      index: sccs.length + 1,
      nodeIds: compIds,
      labels: compIds.map((id) => idToLabel.get(id) ?? id),
      color: COMPONENT_PALETTE[sccs.length % COMPONENT_PALETTE.length],
    });
  }

  return sccs;
}

/**
 * Detects a cycle in either an undirected graph (via DFS parent tracking)
 * or a directed graph (via 3-color WHITE/GRAY/BLACK recursion-stack tracking)
 * and reconstructs the exact cycle vertex sequence & edge IDs.
 */
export function detectCycle(graph: GraphData): CycleInfo {
  const sortedNodes = [...graph.nodes].sort((a, b) => compareLabels(a.label, b.label));
  const idToLabel = new Map(graph.nodes.map((n) => [n.id, n.label]));
  const adj = buildAdjacencyList(graph);

  if (sortedNodes.length === 0) {
    return {
      hasCycle: false,
      cycleNodeIds: [],
      cycleLabels: [],
      cycleEdgeIds: [],
      explanation: 'An empty graph is trivially acyclic.',
    };
  }

  if (!graph.directed) {
    // Undirected cycle detection via DFS with parent edge tracking
    const visited = new Set<string>();
    const parentNode = new Map<string, string | null>();
    const parentEdge = new Map<string, string | null>();

    for (const start of sortedNodes) {
      if (visited.has(start.id)) continue;

      let foundCycleNodes: string[] | null = null;
      let foundCycleEdges: string[] | null = null;

      const dfs = (u: string, pNode: string | null, pEdgeId: string | null): boolean => {
        visited.add(u);
        parentNode.set(u, pNode);
        parentEdge.set(u, pEdgeId);

        for (const entry of adj.get(u) ?? []) {
          if (entry.edgeId === pEdgeId) continue; // Ignore the exact undirected edge we came from
          if (!visited.has(entry.neighborId)) {
            if (dfs(entry.neighborId, u, entry.edgeId)) return true;
          } else {
            // Back-edge to an already visited vertex in the same component -> cycle found!
            const cycleNodes: string[] = [entry.neighborId];
            const cycleEdges: string[] = [entry.edgeId];
            let curr: string | null = u;
            while (curr && curr !== entry.neighborId) {
              cycleNodes.push(curr);
              const eId = parentEdge.get(curr);
              if (eId) cycleEdges.push(eId);
              curr = parentNode.get(curr) ?? null;
            }
            cycleNodes.reverse();
            cycleNodes.push(entry.neighborId);
            foundCycleNodes = cycleNodes;
            foundCycleEdges = cycleEdges;
            return true;
          }
        }
        return false;
      };

      if (dfs(start.id, null, null) && foundCycleNodes && foundCycleEdges) {
        const labels = (foundCycleNodes as string[]).map((id) => idToLabel.get(id) ?? id);
        return {
          hasCycle: true,
          cycleNodeIds: foundCycleNodes,
          cycleLabels: labels,
          cycleEdgeIds: foundCycleEdges,
          explanation: `Cycle detected in undirected graph via DFS back-edge: ${labels.join(' — ')}.`,
        };
      }
    }

    return {
      hasCycle: false,
      cycleNodeIds: [],
      cycleLabels: [],
      cycleEdgeIds: [],
      explanation:
        'No cycles detected. Every connected component is a tree (acyclic undirected forest).',
    };
  } else {
    // Directed cycle detection via 3-color DFS (0 = unvisited, 1 = active recursion stack, 2 = finished)
    const color = new Map<string, number>();
    const parentNode = new Map<string, string | null>();
    const parentEdge = new Map<string, string | null>();
    for (const n of sortedNodes) color.set(n.id, 0);

    for (const start of sortedNodes) {
      if (color.get(start.id) !== 0) continue;

      let foundCycleNodes: string[] | null = null;
      let foundCycleEdges: string[] | null = null;

      const dfs = (u: string): boolean => {
        color.set(u, 1);
        for (const entry of adj.get(u) ?? []) {
          const v = entry.neighborId;
          const vState = color.get(v) ?? 0;
          if (vState === 0) {
            parentNode.set(v, u);
            parentEdge.set(v, entry.edgeId);
            if (dfs(v)) return true;
          } else if (vState === 1) {
            // Directed back-edge onto active recursion stack!
            const cycleNodes: string[] = [v];
            const cycleEdges: string[] = [entry.edgeId];
            let curr: string | null = u;
            while (curr && curr !== v) {
              cycleNodes.push(curr);
              const eId = parentEdge.get(curr);
              if (eId) cycleEdges.push(eId);
              curr = parentNode.get(curr) ?? null;
            }
            cycleNodes.reverse();
            cycleNodes.push(v);
            foundCycleNodes = cycleNodes;
            foundCycleEdges = cycleEdges;
            return true;
          }
        }
        color.set(u, 2);
        return false;
      };

      if (dfs(start.id) && foundCycleNodes && foundCycleEdges) {
        const labels = (foundCycleNodes as string[]).map((id) => idToLabel.get(id) ?? id);
        return {
          hasCycle: true,
          cycleNodeIds: foundCycleNodes,
          cycleLabels: labels,
          cycleEdgeIds: foundCycleEdges,
          explanation: `Directed cycle detected via recursion-stack back-edge: ${labels.join(' → ')}.`,
        };
      }
    }

    return {
      hasCycle: false,
      cycleNodeIds: [],
      cycleLabels: [],
      cycleEdgeIds: [],
      explanation:
        'No directed cycles detected. This directed graph is a Directed Acyclic Graph (DAG).',
    };
  }
}

/**
 * Full Graph Connectivity & Structural Analyzer.
 * Strictly distinguishes Undirected Connectivity vs Directed Strong & Weak Connectivity.
 */
export function analyzeConnectivity(graph: GraphData): ConnectivityReport {
  const sortedNodes = [...graph.nodes].sort((a, b) => compareLabels(a.label, b.label));
  const V = sortedNodes.length;
  const E = graph.edges.length;

  // Compute vertex degrees
  const inMap = new Map<string, number>();
  const outMap = new Map<string, number>();
  for (const n of sortedNodes) {
    inMap.set(n.id, 0);
    outMap.set(n.id, 0);
  }

  for (const e of graph.edges) {
    if (!inMap.has(e.source) || !inMap.has(e.target)) continue;
    if (graph.directed) {
      outMap.set(e.source, (outMap.get(e.source) ?? 0) + 1);
      inMap.set(e.target, (inMap.get(e.target) ?? 0) + 1);
    } else {
      outMap.set(e.source, (outMap.get(e.source) ?? 0) + 1);
      inMap.set(e.source, (inMap.get(e.source) ?? 0) + 1);
      if (e.source !== e.target) {
        outMap.set(e.target, (outMap.get(e.target) ?? 0) + 1);
        inMap.set(e.target, (inMap.get(e.target) ?? 0) + 1);
      }
    }
  }

  const degrees: DegreeInfo[] = sortedNodes.map((n) => {
    const inDeg = inMap.get(n.id) ?? 0;
    const outDeg = outMap.get(n.id) ?? 0;
    const totalDegree = graph.directed ? inDeg + outDeg : outDeg;
    return {
      nodeId: n.id,
      label: n.label,
      inDegree: inDeg,
      outDegree: outDeg,
      totalDegree,
    };
  });

  const isolatedVertices = degrees
    .filter((d) => d.totalDegree === 0)
    .map((d) => ({ id: d.nodeId, label: d.label }));

  const maxPossibleEdges = V <= 1 ? 0 : graph.directed ? V * (V - 1) : (V * (V - 1)) / 2;
  const density = maxPossibleEdges === 0 ? 0 : E / maxPossibleEdges;
  const averageDegree = V === 0 ? 0 : graph.directed ? E / V : (2 * E) / V;

  let densityClassification: ConnectivityReport['densityClassification'] = 'Sparse';
  if (V === 0 || E === 0) {
    densityClassification = 'Empty';
  } else if (density >= 0.999) {
    densityClassification = 'Complete';
  } else if (density >= 0.5) {
    densityClassification = 'Dense';
  } else if (density >= 0.3) {
    densityClassification = 'Moderate';
  } else {
    densityClassification = 'Sparse';
  }

  const cycle = detectCycle(graph);

  if (V === 0) {
    return {
      directed: graph.directed,
      vertexCount: 0,
      edgeCount: 0,
      isConnected: false,
      connectivityLabel: 'Empty Graph (0 Vertices)',
      connectivityExplanation:
        'Add at least one vertex to evaluate connectivity, components, and density.',
      components: [],
      isolatedVertices: [],
      cycle,
      degrees: [],
      density: 0,
      maxPossibleEdges: 0,
      densityClassification: 'Empty',
      averageDegree: 0,
    };
  }

  if (!graph.directed) {
    const components = computeUndirectedComponents(graph);
    const isConnected = components.length === 1;
    return {
      directed: false,
      vertexCount: V,
      edgeCount: E,
      isConnected,
      connectivityLabel: isConnected ? 'Connected (Undirected)' : 'Disconnected (Undirected)',
      connectivityExplanation: isConnected
        ? `Every vertex is reachable from every other vertex via an undirected path (1 connected component covering all ${V} vertices).`
        : `The undirected graph is partitioned into ${components.length} disjoint connected components. No path exists between vertices in different components.`,
      components,
      isolatedVertices,
      cycle,
      degrees,
      density,
      maxPossibleEdges,
      densityClassification,
      averageDegree,
    };
  } else {
    // Directed graph: evaluate BOTH Strong Connectivity (Kosaraju SCCs) and Weak Connectivity
    const sccs = computeStronglyConnectedComponents(graph);
    const wccs = computeUndirectedComponents(graph);
    const isStronglyConnected = sccs.length === 1;
    const isWeaklyConnected = wccs.length === 1;

    let connectivityLabel: string;
    let connectivityExplanation: string;

    if (isStronglyConnected) {
      connectivityLabel = 'Strongly Connected (Directed)';
      connectivityExplanation = `For every ordered pair of vertices (u, v), a directed path exists from u to v and from v to u (1 Strongly Connected Component covering all ${V} vertices). Every strongly connected graph is also weakly connected.`;
    } else if (isWeaklyConnected) {
      connectivityLabel = 'Weakly Connected · Not Strongly Connected';
      connectivityExplanation = `Replacing directed arcs with undirected edges yields 1 connected component (weakly connected), so the underlying topology is joined. However, respecting edge directions partitions the graph into ${sccs.length} Strongly Connected Components (some one-way paths cannot return).`;
    } else {
      connectivityLabel = 'Disconnected (Neither Strongly nor Weakly Connected)';
      connectivityExplanation = `Even when ignoring edge directions, the graph splits into ${wccs.length} Weakly Connected Components (${sccs.length} Strongly Connected Components when respecting edge directions).`;
    }

    return {
      directed: true,
      vertexCount: V,
      edgeCount: E,
      isConnected: isStronglyConnected,
      isStronglyConnected,
      isWeaklyConnected,
      connectivityLabel,
      connectivityExplanation,
      components: sccs,
      weakComponents: wccs,
      isolatedVertices,
      cycle,
      degrees,
      density,
      maxPossibleEdges,
      densityClassification,
      averageDegree,
    };
  }
}

/**
 * Determines whether `targetId` is reachable from `sourceId` using BFS,
 * returning the shortest unweighted path (both vertices and edges) and explored vertex trail.
 */
export function checkReachability(
  graph: GraphData,
  sourceId: string,
  targetId: string
): ReachabilityResult {
  const idToLabel = new Map(graph.nodes.map((n) => [n.id, n.label]));
  const adj = buildAdjacencyList(graph);

  const sourceLabel = idToLabel.get(sourceId) ?? sourceId;
  const targetLabel = idToLabel.get(targetId) ?? targetId;

  if (!idToLabel.has(sourceId) || !idToLabel.has(targetId)) {
    return {
      sourceId,
      targetId,
      reachable: false,
      pathNodeIds: [],
      pathLabels: [],
      pathEdgeIds: [],
      exploredNodeIds: [],
      exploredLabels: [],
      exploredEdgeIds: [],
      hopCount: 0,
      explanation: 'Select valid source and destination vertices present in the graph.',
    };
  }

  if (sourceId === targetId) {
    return {
      sourceId,
      targetId,
      reachable: true,
      pathNodeIds: [sourceId],
      pathLabels: [sourceLabel],
      pathEdgeIds: [],
      exploredNodeIds: [sourceId],
      exploredLabels: [sourceLabel],
      exploredEdgeIds: [],
      hopCount: 0,
      explanation: `Trivial 0-hop path: source and destination are both vertex ${sourceLabel}.`,
    };
  }

  const visited = new Set<string>([sourceId]);
  const parentNode = new Map<string, string>();
  const parentEdge = new Map<string, string>();
  const exploredNodeIds: string[] = [sourceId];
  const exploredEdgeIds: string[] = [];
  const queue: string[] = [sourceId];

  let found = false;

  while (queue.length > 0 && !found) {
    const u = queue.shift()!;
    for (const entry of adj.get(u) ?? []) {
      exploredEdgeIds.push(entry.edgeId);
      if (!visited.has(entry.neighborId)) {
        visited.add(entry.neighborId);
        parentNode.set(entry.neighborId, u);
        parentEdge.set(entry.neighborId, entry.edgeId);
        exploredNodeIds.push(entry.neighborId);

        if (entry.neighborId === targetId) {
          found = true;
          break;
        }
        queue.push(entry.neighborId);
      }
    }
  }

  if (!found) {
    return {
      sourceId,
      targetId,
      reachable: false,
      pathNodeIds: [],
      pathLabels: [],
      pathEdgeIds: [],
      exploredNodeIds,
      exploredLabels: exploredNodeIds.map((id) => idToLabel.get(id) ?? id),
      exploredEdgeIds,
      hopCount: -1,
      explanation: `No ${graph.directed ? 'directed ' : ''}path exists from ${sourceLabel} to ${targetLabel}. BFS exhausted all ${exploredNodeIds.length} reachable vertices (${exploredNodeIds.map((id) => idToLabel.get(id)).join(', ')}) without reaching ${targetLabel}.`,
    };
  }

  // Reconstruct shortest unweighted path
  const pathNodeIds: string[] = [];
  const pathEdgeIds: string[] = [];
  let curr: string | undefined = targetId;
  while (curr !== undefined) {
    pathNodeIds.push(curr);
    const pEdge = parentEdge.get(curr);
    if (pEdge) pathEdgeIds.push(pEdge);
    curr = parentNode.get(curr);
  }
  pathNodeIds.reverse();
  pathEdgeIds.reverse();

  const pathLabels = pathNodeIds.map((id) => idToLabel.get(id) ?? id);
  const hopCount = pathEdgeIds.length;

  return {
    sourceId,
    targetId,
    reachable: true,
    pathNodeIds,
    pathLabels,
    pathEdgeIds,
    exploredNodeIds,
    exploredLabels: exploredNodeIds.map((id) => idToLabel.get(id) ?? id),
    exploredEdgeIds,
    hopCount,
    explanation: `Reachable in ${hopCount} hop${hopCount === 1 ? '' : 's'} (shortest unweighted path via BFS): ${pathLabels.join(graph.directed ? ' → ' : ' — ')}.`,
  };
}
