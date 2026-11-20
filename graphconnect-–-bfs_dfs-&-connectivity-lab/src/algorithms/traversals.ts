import {
  GraphData,
  StackFrame,
  TraversalResult,
  TraversalStep,
} from '../types/graph';
import { buildAdjacencyList, compareLabels } from './graphCore';

function getHighResNow(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

/**
 * Breadth-First Search (BFS) Visualization & Analysis Engine.
 *
 * Uses a FIFO queue to explore vertices strictly level by level from `startNodeId`.
 * If `traverseAllComponents` is true, continues from remaining unvisited vertices
 * in deterministic label order so disconnected components are also covered.
 */
export function runBFS(
  graph: GraphData,
  startNodeId: string | null,
  traverseAllComponents = false
): TraversalResult {
  const sortedNodes = [...graph.nodes].sort((a, b) => compareLabels(a.label, b.label));
  const idToLabel = new Map(graph.nodes.map((n) => [n.id, n.label]));
  const allNodeIds = sortedNodes.map((n) => n.id);

  if (sortedNodes.length === 0) {
    return {
      algorithm: 'BFS',
      startNodeId: null,
      traversalOrder: [],
      traversalLabels: [],
      visitedCount: 0,
      edgesExamined: 0,
      executionTimeMs: 0,
      peakAuxiliarySize: 0,
      maxDepthOrLevel: 0,
      operationsCount: 0,
      estimatedMemoryBytes: 0,
      levels: {},
      treeEdgeIds: [],
      steps: [
        {
          stepIndex: 0,
          eventType: 'complete',
          activeNodeId: null,
          exploringEdgeId: null,
          visitedIds: [],
          unvisitedIds: [],
          treeEdgeIds: [],
          checkedEdgeIds: [],
          queue: [],
          stack: [],
          levels: {},
          currentLevel: 0,
          recursionDepth: 0,
          isBacktracking: false,
          title: 'Empty Graph',
          explanation: 'The graph has 0 vertices. Add vertices in Graph Builder to run BFS.',
          pseudocodeLine: 1,
        },
      ],
    };
  }

  const resolvedStart =
    startNodeId && idToLabel.has(startNodeId) ? startNodeId : sortedNodes[0].id;

  const adj = buildAdjacencyList(graph);

  // Measure pure algorithmic pass first for accurate timing
  const fastMetrics = runFastBFS(graph, resolvedStart, traverseAllComponents);

  const visited = new Set<string>();
  const traversalOrder: string[] = [];
  const treeEdgeSet = new Set<string>();
  const checkedEdgeSet = new Set<string>();
  const levels: Record<string, number> = {};
  const queue: string[] = [];
  const steps: TraversalStep[] = [];

  let peakQueue = 0;
  let edgesExamined = 0;
  let operations = 0;
  let maxLevel = 0;

  const snapshot = (
    partial: Omit<
      TraversalStep,
      | 'stepIndex'
      | 'visitedIds'
      | 'unvisitedIds'
      | 'treeEdgeIds'
      | 'checkedEdgeIds'
      | 'queue'
      | 'stack'
      | 'levels'
      | 'recursionDepth'
      | 'isBacktracking'
    >
  ) => {
    steps.push({
      stepIndex: steps.length,
      visitedIds: [...traversalOrder],
      unvisitedIds: allNodeIds.filter((id) => !visited.has(id)),
      treeEdgeIds: Array.from(treeEdgeSet),
      checkedEdgeIds: Array.from(checkedEdgeSet),
      queue: queue.map((id) => idToLabel.get(id) ?? id),
      stack: [],
      levels: { ...levels },
      recursionDepth: 0,
      isBacktracking: false,
      ...partial,
    });
  };

  snapshot({
    eventType: 'init',
    activeNodeId: resolvedStart,
    exploringEdgeId: null,
    currentLevel: 0,
    title: `Initialize BFS at Vertex ${idToLabel.get(resolvedStart)}`,
    explanation: `Create an empty FIFO queue and mark all ${sortedNodes.length} vertices as unvisited.`,
    pseudocodeLine: 1,
  });

  const startCandidates = traverseAllComponents
    ? [resolvedStart, ...allNodeIds.filter((id) => id !== resolvedStart)]
    : [resolvedStart];

  for (const seedId of startCandidates) {
    if (visited.has(seedId)) continue;

    visited.add(seedId);
    traversalOrder.push(seedId);
    levels[seedId] = 0;
    queue.push(seedId);
    operations += 2;
    peakQueue = Math.max(peakQueue, queue.length);

    snapshot({
      eventType: 'enqueue',
      activeNodeId: seedId,
      exploringEdgeId: null,
      currentLevel: 0,
      title: `Mark & Enqueue ${idToLabel.get(seedId)}`,
      explanation: `Mark vertex ${idToLabel.get(seedId)} as visited (Level 0) and enqueue it into the FIFO queue.`,
      pseudocodeLine: 3,
    });

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      operations += 1;
      const currentLabel = idToLabel.get(currentId) ?? currentId;
      const curLvl = levels[currentId] ?? 0;

      snapshot({
        eventType: 'dequeue',
        activeNodeId: currentId,
        exploringEdgeId: null,
        currentLevel: curLvl,
        title: `Dequeue ${currentLabel} (Level ${curLvl})`,
        explanation: `Remove front vertex ${currentLabel} from the queue and inspect its incident neighbors in sorted order.`,
        pseudocodeLine: 5,
      });

      const neighbors = adj.get(currentId) ?? [];
      for (const entry of neighbors) {
        edgesExamined += 1;
        operations += 1;
        checkedEdgeSet.add(entry.edgeId);

        if (!visited.has(entry.neighborId)) {
          visited.add(entry.neighborId);
          traversalOrder.push(entry.neighborId);
          treeEdgeSet.add(entry.edgeId);
          const nextLvl = curLvl + 1;
          levels[entry.neighborId] = nextLvl;
          maxLevel = Math.max(maxLevel, nextLvl);
          queue.push(entry.neighborId);
          operations += 2;
          peakQueue = Math.max(peakQueue, queue.length);

          snapshot({
            eventType: 'enqueue',
            activeNodeId: currentId,
            exploringEdgeId: entry.edgeId,
            currentLevel: curLvl,
            title: `Discover & Enqueue ${entry.neighborLabel}`,
            explanation: `Edge (${currentLabel}, ${entry.neighborLabel}) leads to unvisited vertex ${entry.neighborLabel}. Mark visited at Level ${nextLvl} and append to queue.`,
            pseudocodeLine: 8,
          });
        } else {
          snapshot({
            eventType: 'skip-visited',
            activeNodeId: currentId,
            exploringEdgeId: entry.edgeId,
            currentLevel: curLvl,
            title: `Skip Already Visited ${entry.neighborLabel}`,
            explanation: `Neighbor ${entry.neighborLabel} was already visited (Level ${levels[entry.neighborId]}). Skip to prevent cycles and redundant work.`,
            pseudocodeLine: 7,
          });
        }
      }
    }
  }

  const unreachedCount = sortedNodes.length - traversalOrder.length;
  snapshot({
    eventType: 'complete',
    activeNodeId: null,
    exploringEdgeId: null,
    currentLevel: maxLevel,
    title: 'BFS Traversal Complete',
    explanation:
      unreachedCount > 0
        ? `Queue is empty. Visited ${traversalOrder.length} of ${sortedNodes.length} vertices in order: ${traversalOrder.map((id) => idToLabel.get(id)).join(' → ')}. (${unreachedCount} vertex/vertices unreachable from ${idToLabel.get(resolvedStart)}.)`
        : `Queue is empty. All ${traversalOrder.length} reachable vertices visited level-by-level: ${traversalOrder.map((id) => idToLabel.get(id)).join(' → ')}.`,
    pseudocodeLine: 10,
  });

  // Approximate auxiliary memory: visited set (8B/entry) + queue peak (8B/entry) + level map (16B/entry)
  const estimatedMemoryBytes =
    visited.size * 24 + peakQueue * 16;

  return {
    algorithm: 'BFS',
    startNodeId: resolvedStart,
    traversalOrder,
    traversalLabels: traversalOrder.map((id) => idToLabel.get(id) ?? id),
    visitedCount: traversalOrder.length,
    edgesExamined,
    executionTimeMs: fastMetrics.executionTimeMs,
    peakAuxiliarySize: peakQueue,
    maxDepthOrLevel: maxLevel,
    operationsCount: operations,
    estimatedMemoryBytes,
    steps,
    levels,
    treeEdgeIds: Array.from(treeEdgeSet),
  };
}

/**
 * Recursive Depth-First Search (DFS) Visualization & Analysis Engine.
 *
 * Explores deep along each branch before backtracking, tracking call-stack frames
 * and recursion depth at every step.
 */
export function runDFSRecursive(
  graph: GraphData,
  startNodeId: string | null,
  traverseAllComponents = false
): TraversalResult {
  const sortedNodes = [...graph.nodes].sort((a, b) => compareLabels(a.label, b.label));
  const idToLabel = new Map(graph.nodes.map((n) => [n.id, n.label]));
  const allNodeIds = sortedNodes.map((n) => n.id);

  if (sortedNodes.length === 0) {
    return {
      algorithm: 'DFS-Recursive',
      startNodeId: null,
      traversalOrder: [],
      traversalLabels: [],
      visitedCount: 0,
      edgesExamined: 0,
      executionTimeMs: 0,
      peakAuxiliarySize: 0,
      maxDepthOrLevel: 0,
      operationsCount: 0,
      estimatedMemoryBytes: 0,
      levels: {},
      treeEdgeIds: [],
      steps: [
        {
          stepIndex: 0,
          eventType: 'complete',
          activeNodeId: null,
          exploringEdgeId: null,
          visitedIds: [],
          unvisitedIds: [],
          treeEdgeIds: [],
          checkedEdgeIds: [],
          queue: [],
          stack: [],
          levels: {},
          currentLevel: 0,
          recursionDepth: 0,
          isBacktracking: false,
          title: 'Empty Graph',
          explanation: 'The graph has 0 vertices. Add vertices in Graph Builder to run DFS.',
          pseudocodeLine: 1,
        },
      ],
    };
  }

  const resolvedStart =
    startNodeId && idToLabel.has(startNodeId) ? startNodeId : sortedNodes[0].id;
  const adj = buildAdjacencyList(graph);
  const fastMetrics = runFastDFSRecursive(graph, resolvedStart, traverseAllComponents);

  const visited = new Set<string>();
  const traversalOrder: string[] = [];
  const treeEdgeSet = new Set<string>();
  const checkedEdgeSet = new Set<string>();
  const callStack: StackFrame[] = [];
  const depthMap: Record<string, number> = {};
  const steps: TraversalStep[] = [];

  let maxDepth = 0;
  let edgesExamined = 0;
  let operations = 0;

  const snapshot = (
    partial: Omit<
      TraversalStep,
      | 'stepIndex'
      | 'visitedIds'
      | 'unvisitedIds'
      | 'treeEdgeIds'
      | 'checkedEdgeIds'
      | 'queue'
      | 'stack'
      | 'levels'
      | 'currentLevel'
    >
  ) => {
    steps.push({
      stepIndex: steps.length,
      visitedIds: [...traversalOrder],
      unvisitedIds: allNodeIds.filter((id) => !visited.has(id)),
      treeEdgeIds: Array.from(treeEdgeSet),
      checkedEdgeIds: Array.from(checkedEdgeSet),
      queue: [],
      stack: callStack.map((f) => ({ ...f })),
      levels: { ...depthMap },
      currentLevel: partial.recursionDepth,
      ...partial,
    });
  };

  snapshot({
    eventType: 'init',
    activeNodeId: resolvedStart,
    exploringEdgeId: null,
    recursionDepth: 0,
    isBacktracking: false,
    title: `Initialize Recursive DFS at ${idToLabel.get(resolvedStart)}`,
    explanation: `Prepare visited set and invoke DFS(${idToLabel.get(resolvedStart)}) at recursion depth 1.`,
    pseudocodeLine: 1,
  });

  const dfsVisit = (uId: string, depth: number, parentId: string | null) => {
    const uLabel = idToLabel.get(uId) ?? uId;
    visited.add(uId);
    traversalOrder.push(uId);
    depthMap[uId] = depth;
    callStack.push({ nodeId: uId, label: uLabel, depth });
    maxDepth = Math.max(maxDepth, callStack.length);
    operations += 2;

    snapshot({
      eventType: 'visit',
      activeNodeId: uId,
      exploringEdgeId: null,
      recursionDepth: depth,
      isBacktracking: false,
      title: `Visit ${uLabel} (Depth ${depth})`,
      explanation: `Enter recursive call DFS(${uLabel}). Mark ${uLabel} as visited and push call frame onto recursion stack.`,
      pseudocodeLine: 2,
    });

    const neighbors = adj.get(uId) ?? [];
    for (const entry of neighbors) {
      edgesExamined += 1;
      operations += 1;
      checkedEdgeSet.add(entry.edgeId);

      if (!visited.has(entry.neighborId)) {
        treeEdgeSet.add(entry.edgeId);
        snapshot({
          eventType: 'inspect-edge',
          activeNodeId: uId,
          exploringEdgeId: entry.edgeId,
          recursionDepth: depth,
          isBacktracking: false,
          title: `Explore Branch ${uLabel} → ${entry.neighborLabel}`,
          explanation: `Neighbor ${entry.neighborLabel} is unvisited. Recurse deeper along edge (${uLabel}, ${entry.neighborLabel}).`,
          pseudocodeLine: 4,
        });

        dfsVisit(entry.neighborId, depth + 1, uId);
      } else if (entry.neighborId !== parentId || graph.directed) {
        snapshot({
          eventType: 'skip-visited',
          activeNodeId: uId,
          exploringEdgeId: entry.edgeId,
          recursionDepth: depth,
          isBacktracking: false,
          title: `Skip Visited Neighbor ${entry.neighborLabel}`,
          explanation: `Edge (${uLabel}, ${entry.neighborLabel}) reaches an already visited vertex. Do not recurse.`,
          pseudocodeLine: 3,
        });
      }
    }

    callStack.pop();
    operations += 1;
    const returnTo = callStack.length > 0 ? callStack[callStack.length - 1] : null;

    snapshot({
      eventType: 'backtrack',
      activeNodeId: returnTo ? returnTo.nodeId : uId,
      exploringEdgeId: null,
      recursionDepth: callStack.length,
      isBacktracking: true,
      title: returnTo
        ? `Backtrack from ${uLabel} to ${returnTo.label}`
        : `Finish Call Frame ${uLabel}`,
      explanation: returnTo
        ? `All neighbors of ${uLabel} have been explored. Pop DFS(${uLabel}) and backtrack to caller ${returnTo.label} (Depth ${returnTo.depth}).`
        : `All neighbors of starting vertex ${uLabel} are exhausted. Pop final call frame.`,
      pseudocodeLine: 6,
    });
  };

  const startCandidates = traverseAllComponents
    ? [resolvedStart, ...allNodeIds.filter((id) => id !== resolvedStart)]
    : [resolvedStart];

  for (const seedId of startCandidates) {
    if (!visited.has(seedId)) {
      dfsVisit(seedId, 1, null);
    }
  }

  const unreachedCount = sortedNodes.length - traversalOrder.length;
  snapshot({
    eventType: 'complete',
    activeNodeId: null,
    exploringEdgeId: null,
    recursionDepth: 0,
    isBacktracking: false,
    title: 'Recursive DFS Complete',
    explanation:
      unreachedCount > 0
        ? `Recursion stack is empty. Visited ${traversalOrder.length} of ${sortedNodes.length} vertices: ${traversalOrder.map((id) => idToLabel.get(id)).join(' → ')}. (${unreachedCount} unreachable.)`
        : `Recursion stack is empty. Completed traversal order: ${traversalOrder.map((id) => idToLabel.get(id)).join(' → ')}.`,
    pseudocodeLine: 7,
  });

  const estimatedMemoryBytes = visited.size * 16 + maxDepth * 48;

  return {
    algorithm: 'DFS-Recursive',
    startNodeId: resolvedStart,
    traversalOrder,
    traversalLabels: traversalOrder.map((id) => idToLabel.get(id) ?? id),
    visitedCount: traversalOrder.length,
    edgesExamined,
    executionTimeMs: fastMetrics.executionTimeMs,
    peakAuxiliarySize: maxDepth,
    maxDepthOrLevel: maxDepth,
    operationsCount: operations,
    estimatedMemoryBytes,
    steps,
    levels: depthMap,
    treeEdgeIds: Array.from(treeEdgeSet),
  };
}

/**
 * Iterative Depth-First Search (DFS) using an explicit LIFO stack.
 *
 * Pushes neighbors in reverse sorted order so popping from the top of the LIFO stack
 * visits neighbors in the exact same deterministic alphabetical order as Recursive DFS!
 */
export function runDFSIterative(
  graph: GraphData,
  startNodeId: string | null,
  traverseAllComponents = false
): TraversalResult {
  const sortedNodes = [...graph.nodes].sort((a, b) => compareLabels(a.label, b.label));
  const idToLabel = new Map(graph.nodes.map((n) => [n.id, n.label]));
  const allNodeIds = sortedNodes.map((n) => n.id);

  if (sortedNodes.length === 0) {
    return {
      algorithm: 'DFS-Iterative',
      startNodeId: null,
      traversalOrder: [],
      traversalLabels: [],
      visitedCount: 0,
      edgesExamined: 0,
      executionTimeMs: 0,
      peakAuxiliarySize: 0,
      maxDepthOrLevel: 0,
      operationsCount: 0,
      estimatedMemoryBytes: 0,
      levels: {},
      treeEdgeIds: [],
      steps: [
        {
          stepIndex: 0,
          eventType: 'complete',
          activeNodeId: null,
          exploringEdgeId: null,
          visitedIds: [],
          unvisitedIds: [],
          treeEdgeIds: [],
          checkedEdgeIds: [],
          queue: [],
          stack: [],
          levels: {},
          currentLevel: 0,
          recursionDepth: 0,
          isBacktracking: false,
          title: 'Empty Graph',
          explanation: 'The graph has 0 vertices. Add vertices in Graph Builder to run Iterative DFS.',
          pseudocodeLine: 1,
        },
      ],
    };
  }

  const resolvedStart =
    startNodeId && idToLabel.has(startNodeId) ? startNodeId : sortedNodes[0].id;
  const adj = buildAdjacencyList(graph);
  const fastMetrics = runFastDFSIterative(graph, resolvedStart, traverseAllComponents);

  const visited = new Set<string>();
  const traversalOrder: string[] = [];
  const treeEdgeSet = new Set<string>();
  const checkedEdgeSet = new Set<string>();
  const explicitStack: { nodeId: string; depth: number; viaEdgeId: string | null }[] = [];
  const depthMap: Record<string, number> = {};
  const steps: TraversalStep[] = [];

  let peakStack = 0;
  let maxDepth = 0;
  let edgesExamined = 0;
  let operations = 0;

  const formatStack = (): StackFrame[] =>
    explicitStack.map((item) => ({
      nodeId: item.nodeId,
      label: idToLabel.get(item.nodeId) ?? item.nodeId,
      depth: item.depth,
    }));

  const snapshot = (
    partial: Omit<
      TraversalStep,
      | 'stepIndex'
      | 'visitedIds'
      | 'unvisitedIds'
      | 'treeEdgeIds'
      | 'checkedEdgeIds'
      | 'queue'
      | 'stack'
      | 'levels'
      | 'currentLevel'
    >
  ) => {
    steps.push({
      stepIndex: steps.length,
      visitedIds: [...traversalOrder],
      unvisitedIds: allNodeIds.filter((id) => !visited.has(id)),
      treeEdgeIds: Array.from(treeEdgeSet),
      checkedEdgeIds: Array.from(checkedEdgeSet),
      queue: [],
      stack: formatStack(),
      levels: { ...depthMap },
      currentLevel: partial.recursionDepth,
      ...partial,
    });
  };

  snapshot({
    eventType: 'init',
    activeNodeId: resolvedStart,
    exploringEdgeId: null,
    recursionDepth: 0,
    isBacktracking: false,
    title: `Initialize Iterative Stack DFS at ${idToLabel.get(resolvedStart)}`,
    explanation: `Create an explicit LIFO stack and an empty visited set.`,
    pseudocodeLine: 1,
  });

  const startCandidates = traverseAllComponents
    ? [resolvedStart, ...allNodeIds.filter((id) => id !== resolvedStart)]
    : [resolvedStart];

  for (const seedId of startCandidates) {
    if (visited.has(seedId)) continue;

    explicitStack.push({ nodeId: seedId, depth: 1, viaEdgeId: null });
    operations += 1;
    peakStack = Math.max(peakStack, explicitStack.length);

    snapshot({
      eventType: 'push',
      activeNodeId: seedId,
      exploringEdgeId: null,
      recursionDepth: 1,
      isBacktracking: false,
      title: `Push Starting Vertex ${idToLabel.get(seedId)}`,
      explanation: `Push ${idToLabel.get(seedId)} onto the LIFO stack to begin iterative exploration.`,
      pseudocodeLine: 2,
    });

    while (explicitStack.length > 0) {
      const top = explicitStack.pop()!;
      operations += 1;
      const uId = top.nodeId;
      const uLabel = idToLabel.get(uId) ?? uId;

      if (visited.has(uId)) {
        snapshot({
          eventType: 'skip-visited',
          activeNodeId: uId,
          exploringEdgeId: top.viaEdgeId,
          recursionDepth: top.depth,
          isBacktracking: true,
          title: `Pop & Skip Visited ${uLabel}`,
          explanation: `Popped ${uLabel} from the stack, but it was already visited via a deeper path. Discard and continue.`,
          pseudocodeLine: 5,
        });
        continue;
      }

      visited.add(uId);
      traversalOrder.push(uId);
      depthMap[uId] = top.depth;
      maxDepth = Math.max(maxDepth, top.depth);
      if (top.viaEdgeId) {
        treeEdgeSet.add(top.viaEdgeId);
      }
      operations += 1;

      snapshot({
        eventType: 'visit',
        activeNodeId: uId,
        exploringEdgeId: top.viaEdgeId,
        recursionDepth: top.depth,
        isBacktracking: false,
        title: `Pop & Visit ${uLabel}`,
        explanation: `Pop ${uLabel} from top of stack and mark it visited (Depth ${top.depth}).`,
        pseudocodeLine: 6,
      });

      const neighbors = adj.get(uId) ?? [];
      // Reverse order push so smallest-label neighbor sits on TOP of stack
      const unvisitedPushes: string[] = [];
      for (let i = neighbors.length - 1; i >= 0; i--) {
        const entry = neighbors[i];
        edgesExamined += 1;
        operations += 1;
        checkedEdgeSet.add(entry.edgeId);

        if (!visited.has(entry.neighborId)) {
          explicitStack.push({
            nodeId: entry.neighborId,
            depth: top.depth + 1,
            viaEdgeId: entry.edgeId,
          });
          operations += 1;
          peakStack = Math.max(peakStack, explicitStack.length);
          unvisitedPushes.push(entry.neighborLabel);
        }
      }

      if (unvisitedPushes.length > 0) {
        snapshot({
          eventType: 'push',
          activeNodeId: uId,
          exploringEdgeId: null,
          recursionDepth: top.depth,
          isBacktracking: false,
          title: `Push Unvisited Neighbors of ${uLabel}`,
          explanation: `Pushed [${unvisitedPushes.join(', ')}] onto stack (reverse sorted so ${unvisitedPushes[unvisitedPushes.length - 1]} is popped next).`,
          pseudocodeLine: 8,
        });
      } else if (explicitStack.length > 0) {
        snapshot({
          eventType: 'backtrack',
          activeNodeId: uId,
          exploringEdgeId: null,
          recursionDepth: top.depth,
          isBacktracking: true,
          title: `Dead End at ${uLabel} — Backtrack via Stack`,
          explanation: `${uLabel} has no unvisited neighbors. Next iteration pops the waiting branch from the LIFO stack.`,
          pseudocodeLine: 4,
        });
      }
    }
  }

  snapshot({
    eventType: 'complete',
    activeNodeId: null,
    exploringEdgeId: null,
    recursionDepth: 0,
    isBacktracking: false,
    title: 'Iterative DFS Complete',
    explanation: `Stack is empty. Final traversal order: ${traversalOrder.map((id) => idToLabel.get(id)).join(' → ')}.`,
    pseudocodeLine: 10,
  });

  const estimatedMemoryBytes = visited.size * 16 + peakStack * 24;

  return {
    algorithm: 'DFS-Iterative',
    startNodeId: resolvedStart,
    traversalOrder,
    traversalLabels: traversalOrder.map((id) => idToLabel.get(id) ?? id),
    visitedCount: traversalOrder.length,
    edgesExamined,
    executionTimeMs: fastMetrics.executionTimeMs,
    peakAuxiliarySize: peakStack,
    maxDepthOrLevel: maxDepth,
    operationsCount: operations,
    estimatedMemoryBytes,
    steps,
    levels: depthMap,
    treeEdgeIds: Array.from(treeEdgeSet),
  };
}

/**
 * Pure, zero-allocation-overhead algorithmic BFS runner used for empirical DAA benchmarking.
 */
export function runFastBFS(
  graph: GraphData,
  startNodeId: string | null,
  traverseAllComponents = false,
  prebuiltAdj?: Map<string, { neighborId: string }[]>
) {
  const adj = prebuiltAdj ?? buildAdjacencyList(graph);
  const nodeIds = graph.nodes.map((n) => n.id);
  if (nodeIds.length === 0) {
    return {
      visitedCount: 0,
      edgesExamined: 0,
      peakQueue: 0,
      operations: 0,
      executionTimeMs: 0,
    };
  }
  const start = startNodeId ?? nodeIds[0];

  const t0 = getHighResNow();
  const visited = new Set<string>();
  const queue: string[] = [];
  let head = 0;
  let peakQueue = 0;
  let edgesExamined = 0;
  let operations = 0;

  const seeds = traverseAllComponents
    ? [start, ...nodeIds.filter((id) => id !== start)]
    : [start];

  for (const seed of seeds) {
    if (visited.has(seed)) continue;
    visited.add(seed);
    queue.push(seed);
    operations += 2;
    peakQueue = Math.max(peakQueue, queue.length - head);

    while (head < queue.length) {
      const u = queue[head++];
      operations += 1;
      const neighbors = adj.get(u) ?? [];
      for (let i = 0; i < neighbors.length; i++) {
        edgesExamined += 1;
        operations += 1;
        const v = neighbors[i].neighborId;
        if (!visited.has(v)) {
          visited.add(v);
          queue.push(v);
          operations += 2;
          const activeQ = queue.length - head;
          if (activeQ > peakQueue) peakQueue = activeQ;
        }
      }
    }
  }
  const t1 = getHighResNow();

  return {
    visitedCount: visited.size,
    edgesExamined,
    peakQueue,
    operations,
    executionTimeMs: Math.max(0.0001, t1 - t0),
  };
}

/**
 * Pure recursive DFS runner for empirical DAA benchmarking.
 */
export function runFastDFSRecursive(
  graph: GraphData,
  startNodeId: string | null,
  traverseAllComponents = false,
  prebuiltAdj?: Map<string, { neighborId: string }[]>
) {
  const adj = prebuiltAdj ?? buildAdjacencyList(graph);
  const nodeIds = graph.nodes.map((n) => n.id);
  if (nodeIds.length === 0) {
    return {
      visitedCount: 0,
      edgesExamined: 0,
      maxDepth: 0,
      operations: 0,
      executionTimeMs: 0,
    };
  }
  const start = startNodeId ?? nodeIds[0];

  const t0 = getHighResNow();
  const visited = new Set<string>();
  let maxDepth = 0;
  let edgesExamined = 0;
  let operations = 0;

  const dfs = (u: string, depth: number) => {
    visited.add(u);
    operations += 2;
    if (depth > maxDepth) maxDepth = depth;
    const neighbors = adj.get(u) ?? [];
    for (let i = 0; i < neighbors.length; i++) {
      edgesExamined += 1;
      operations += 1;
      const v = neighbors[i].neighborId;
      if (!visited.has(v)) {
        dfs(v, depth + 1);
      }
    }
    operations += 1;
  };

  const seeds = traverseAllComponents
    ? [start, ...nodeIds.filter((id) => id !== start)]
    : [start];

  for (const seed of seeds) {
    if (!visited.has(seed)) {
      dfs(seed, 1);
    }
  }
  const t1 = getHighResNow();

  return {
    visitedCount: visited.size,
    edgesExamined,
    maxDepth,
    operations,
    executionTimeMs: Math.max(0.0001, t1 - t0),
  };
}

/**
 * Pure iterative stack DFS runner for empirical DAA benchmarking.
 */
export function runFastDFSIterative(
  graph: GraphData,
  startNodeId: string | null,
  traverseAllComponents = false,
  prebuiltAdj?: Map<string, { neighborId: string }[]>
) {
  const adj = prebuiltAdj ?? buildAdjacencyList(graph);
  const nodeIds = graph.nodes.map((n) => n.id);
  if (nodeIds.length === 0) {
    return {
      visitedCount: 0,
      edgesExamined: 0,
      peakStack: 0,
      operations: 0,
      executionTimeMs: 0,
    };
  }
  const start = startNodeId ?? nodeIds[0];

  const t0 = getHighResNow();
  const visited = new Set<string>();
  const stack: string[] = [];
  let peakStack = 0;
  let edgesExamined = 0;
  let operations = 0;

  const seeds = traverseAllComponents
    ? [start, ...nodeIds.filter((id) => id !== start)]
    : [start];

  for (const seed of seeds) {
    if (visited.has(seed)) continue;
    stack.push(seed);
    operations += 1;
    if (stack.length > peakStack) peakStack = stack.length;

    while (stack.length > 0) {
      const u = stack.pop()!;
      operations += 1;
      if (visited.has(u)) continue;
      visited.add(u);
      operations += 1;

      const neighbors = adj.get(u) ?? [];
      for (let i = neighbors.length - 1; i >= 0; i--) {
        edgesExamined += 1;
        operations += 1;
        const v = neighbors[i].neighborId;
        if (!visited.has(v)) {
          stack.push(v);
          operations += 1;
          if (stack.length > peakStack) peakStack = stack.length;
        }
      }
    }
  }
  const t1 = getHighResNow();

  return {
    visitedCount: visited.size,
    edgesExamined,
    peakStack,
    operations,
    executionTimeMs: Math.max(0.0001, t1 - t0),
  };
}
