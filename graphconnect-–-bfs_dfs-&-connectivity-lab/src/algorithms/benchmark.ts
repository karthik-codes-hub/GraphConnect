import {
  BenchmarkDataPoint,
  GeneratedGraphType,
  GraphData,
} from '../types/graph';
import { buildAdjacencyList, generateGraph } from './graphCore';
import {
  runFastBFS,
  runFastDFSIterative,
  runFastDFSRecursive,
} from './traversals';

export interface BenchmarkSweepOptions {
  baseVertices: number;
  baseDensity: number;
  graphType: GeneratedGraphType;
  directed: boolean;
  seed: number;
  trials: number;
}

/**
 * Benchmarks a single GraphData instance across `trials` repetitions after a JIT warm-up run.
 * Both BFS and DFS are executed on the exact same pre-built adjacency list to avoid input bias.
 */
export function benchmarkSingleGraph(
  graph: GraphData,
  label: string,
  graphType: GeneratedGraphType,
  trials = 7
): BenchmarkDataPoint {
  const V = graph.nodes.length;
  const E = graph.edges.length;
  const maxE = V <= 1 ? 0 : graph.directed ? V * (V - 1) : (V * (V - 1)) / 2;
  const density = maxE === 0 ? 0 : Number((E / maxE).toFixed(3));
  const startId = V > 0 ? graph.nodes[0].id : null;
  const adj = buildAdjacencyList(graph);

  // Warm-up run to stabilize JS JIT before measurement
  runFastBFS(graph, startId, false, adj);
  runFastDFSRecursive(graph, startId, false, adj);
  runFastDFSIterative(graph, startId, false, adj);

  let bfsTotalMs = 0;
  let dfsRecTotalMs = 0;
  let dfsIterTotalMs = 0;

  let lastBfs = runFastBFS(graph, startId, false, adj);
  let lastDfsRec = runFastDFSRecursive(graph, startId, false, adj);

  const safeTrials = Math.max(1, trials);
  for (let t = 0; t < safeTrials; t++) {
    lastBfs = runFastBFS(graph, startId, false, adj);
    lastDfsRec = runFastDFSRecursive(graph, startId, false, adj);
    const lastDfsIter = runFastDFSIterative(graph, startId, false, adj);

    bfsTotalMs += lastBfs.executionTimeMs;
    dfsRecTotalMs += lastDfsRec.executionTimeMs;
    dfsIterTotalMs += lastDfsIter.executionTimeMs;
  }

  return {
    id: `${graphType}-${V}-${E}`,
    label,
    graphType,
    vertices: V,
    edges: E,
    density,
    bfsTimeMs: Number((bfsTotalMs / safeTrials).toFixed(4)),
    dfsRecursiveTimeMs: Number((dfsRecTotalMs / safeTrials).toFixed(4)),
    dfsIterativeTimeMs: Number((dfsIterTotalMs / safeTrials).toFixed(4)),
    bfsVisited: lastBfs.visitedCount,
    dfsVisited: lastDfsRec.visitedCount,
    bfsEdgesExamined: lastBfs.edgesExamined,
    dfsEdgesExamined: lastDfsRec.edgesExamined,
    bfsOperations: lastBfs.operations,
    dfsOperations: lastDfsRec.operations,
    bfsPeakQueue: lastBfs.peakQueue,
    dfsPeakDepth: lastDfsRec.maxDepth,
    trials: safeTrials,
  };
}

export interface FullBenchmarkSuiteResult {
  vertexScaling: BenchmarkDataPoint[];
  edgeScaling: BenchmarkDataPoint[];
  densityScaling: BenchmarkDataPoint[];
  topologyComparison: BenchmarkDataPoint[];
  singleExperiment: BenchmarkDataPoint;
}

/**
 * Runs a complete empirical DAA benchmark suite generating genuine graphs and executing
 * BFS and DFS across vertex counts, edge counts, densities, and structural topologies.
 */
export function runBenchmarkSuite(
  options: BenchmarkSweepOptions
): FullBenchmarkSuiteResult {
  const {
    baseVertices,
    baseDensity,
    graphType,
    directed,
    seed,
    trials,
  } = options;

  // 1. Primary custom configuration run
  const customGraph = generateGraph({
    type: graphType,
    vertexCount: baseVertices,
    density: baseDensity,
    directed,
    seed,
  });
  const singleExperiment = benchmarkSingleGraph(
    customGraph,
    `${graphType} (${baseVertices}V)`,
    graphType,
    trials
  );

  // 2. Vertex scaling sweep: V = 20, 50, 100, 160, 220, 300
  const vSizes = [20, 50, 100, 160, 220, 300];
  const vertexScaling = vSizes.map((v, idx) => {
    const g = generateGraph({
      type: graphType === 'complete' && v > 140 ? 'dense' : graphType,
      vertexCount: v,
      density: baseDensity,
      directed,
      seed: seed + idx * 17,
    });
    return benchmarkSingleGraph(g, `${v}V`, graphType, trials);
  });

  // 3. Edge scaling sweep on fixed V = Math.max(60, baseVertices)
  const fixedV = Math.min(200, Math.max(40, baseVertices));
  const maxE = directed ? fixedV * (fixedV - 1) : (fixedV * (fixedV - 1)) / 2;
  const edgeFractions = [0.05, 0.15, 0.3, 0.5, 0.75, 0.95];
  const edgeScaling = edgeFractions.map((frac, idx) => {
    const eTarget = Math.max(fixedV - 1, Math.round(maxE * frac));
    const g = generateGraph({
      type: 'random',
      vertexCount: fixedV,
      edgeCount: eTarget,
      directed,
      seed: seed + 100 + idx * 13,
    });
    return benchmarkSingleGraph(g, `${g.edges.length}E`, 'random', trials);
  });

  // 4. Density scaling sweep (0.1 -> 0.9) on fixed V
  const densities = [0.1, 0.25, 0.4, 0.6, 0.8, 0.95];
  const densityScaling = densities.map((d, idx) => {
    const g = generateGraph({
      type: 'random',
      vertexCount: fixedV,
      density: d,
      directed,
      seed: seed + 200 + idx * 19,
    });
    return benchmarkSingleGraph(g, `d=${d.toFixed(2)}`, 'random', trials);
  });

  // 5. Topology comparison across all 6 required types at baseVertices
  const topologies: GeneratedGraphType[] = [
    'sparse',
    'dense',
    'random',
    'linear',
    'tree',
    'complete',
  ];
  const topoV = Math.min(120, Math.max(15, baseVertices));
  const topologyComparison = topologies.map((t, idx) => {
    const g = generateGraph({
      type: t,
      vertexCount: topoV,
      density: baseDensity,
      directed,
      seed: seed + 300 + idx * 23,
    });
    const pretty = t.charAt(0).toUpperCase() + t.slice(1);
    return benchmarkSingleGraph(g, pretty, t, trials);
  });

  return {
    vertexScaling,
    edgeScaling,
    densityScaling,
    topologyComparison,
    singleExperiment,
  };
}

/**
 * Formats benchmark records into RFC-4180 compliant CSV text for academic download.
 */
export function exportBenchmarksToCSV(rows: BenchmarkDataPoint[]): string {
  const headers = [
    'Experiment_Label',
    'Graph_Type',
    'Vertices_V',
    'Edges_E',
    'Density',
    'Trials_Averaged',
    'BFS_Avg_Time_ms',
    'DFS_Recursive_Avg_Time_ms',
    'DFS_Iterative_Avg_Time_ms',
    'BFS_Vertices_Visited',
    'DFS_Vertices_Visited',
    'BFS_Edges_Examined',
    'DFS_Edges_Examined',
    'BFS_Operations_Count',
    'DFS_Operations_Count',
    'BFS_Peak_Queue_Size',
    'DFS_Max_Recursion_Depth',
  ];

  const lines = rows.map((r) =>
    [
      `"${r.label.replace(/"/g, '""')}"`,
      r.graphType,
      r.vertices,
      r.edges,
      r.density,
      r.trials,
      r.bfsTimeMs,
      r.dfsRecursiveTimeMs,
      r.dfsIterativeTimeMs,
      r.bfsVisited,
      r.dfsVisited,
      r.bfsEdgesExamined,
      r.dfsEdgesExamined,
      r.bfsOperations,
      r.dfsOperations,
      r.bfsPeakQueue,
      r.dfsPeakDepth,
    ].join(',')
  );

  return [headers.join(','), ...lines].join('\n');
}
