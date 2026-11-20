import test from 'node:test';
import assert from 'node:assert/strict';
import { GraphData } from '../types/graph';
import {
  generateGraph,
  parseAdjacencyListInput,
  parseAdjacencyMatrixInput,
  parseEdgeListInput,
} from './graphCore';
import { runBFS, runDFSIterative, runDFSRecursive } from './traversals';
import {
  analyzeConnectivity,
  checkReachability,
  detectCycle,
} from './connectivity';
import { benchmarkSingleGraph, exportBenchmarksToCSV } from './benchmark';

const sampleTree: GraphData = {
  name: 'Binary Tree',
  directed: false,
  weighted: false,
  nodes: [
    { id: 'A', label: 'A', x: 0, y: 0 },
    { id: 'B', label: 'B', x: 0, y: 0 },
    { id: 'C', label: 'C', x: 0, y: 0 },
    { id: 'D', label: 'D', x: 0, y: 0 },
    { id: 'E', label: 'E', x: 0, y: 0 },
  ],
  edges: [
    { id: 'e1', source: 'A', target: 'B', weight: 1 },
    { id: 'e2', source: 'A', target: 'C', weight: 1 },
    { id: 'e3', source: 'B', target: 'D', weight: 1 },
    { id: 'e4', source: 'B', target: 'E', weight: 1 },
  ],
};

test('BFS explores level-by-level deterministically using a queue', () => {
  const res = runBFS(sampleTree, 'A');
  assert.deepEqual(res.traversalLabels, ['A', 'B', 'C', 'D', 'E']);
  assert.equal(res.levels['A'], 0);
  assert.equal(res.levels['B'], 1);
  assert.equal(res.levels['C'], 1);
  assert.equal(res.levels['D'], 2);
  assert.equal(res.levels['E'], 2);
  assert.equal(res.maxDepthOrLevel, 2);
  assert.ok(res.peakAuxiliarySize >= 2);
});

test('DFS Recursive and Iterative visit deep branches before siblings in identical deterministic order', () => {
  const rec = runDFSRecursive(sampleTree, 'A');
  const iter = runDFSIterative(sampleTree, 'A');
  assert.deepEqual(rec.traversalLabels, ['A', 'B', 'D', 'E', 'C']);
  assert.deepEqual(iter.traversalLabels, ['A', 'B', 'D', 'E', 'C']);
  assert.equal(rec.maxDepthOrLevel, 3);
});

test('Disconnected undirected graph components, isolated vertices, and single-source vs full traversal', () => {
  const disconnected: GraphData = {
    name: 'Disconnected',
    directed: false,
    weighted: false,
    nodes: [
      { id: 'A', label: 'A', x: 0, y: 0 },
      { id: 'B', label: 'B', x: 0, y: 0 },
      { id: 'C', label: 'C', x: 0, y: 0 },
      { id: 'D', label: 'D', x: 0, y: 0 },
      { id: 'Z', label: 'Z', x: 0, y: 0 }, // Isolated
    ],
    edges: [
      { id: 'e1', source: 'A', target: 'B', weight: 1 },
      { id: 'e2', source: 'C', target: 'D', weight: 1 },
    ],
  };

  // Single-source BFS from A only visits A and B
  const bfsSingle = runBFS(disconnected, 'A', false);
  assert.deepEqual(bfsSingle.traversalLabels, ['A', 'B']);

  // Full-graph BFS across components visits all 5 vertices
  const bfsAll = runBFS(disconnected, 'A', true);
  assert.deepEqual(bfsAll.traversalLabels, ['A', 'B', 'C', 'D', 'Z']);

  const report = analyzeConnectivity(disconnected);
  assert.equal(report.isConnected, false);
  assert.equal(report.components.length, 3);
  assert.deepEqual(
    report.isolatedVertices.map((v) => v.label),
    ['Z']
  );
});

test('Directed connectivity distinguishes weak connectivity from strong connectivity (Kosaraju SCC)', () => {
  // A -> B -> C (weakly connected, NOT strongly connected: 3 SCCs)
  const oneWayChain: GraphData = {
    name: 'Directed Chain',
    directed: true,
    weighted: false,
    nodes: [
      { id: 'A', label: 'A', x: 0, y: 0 },
      { id: 'B', label: 'B', x: 0, y: 0 },
      { id: 'C', label: 'C', x: 0, y: 0 },
    ],
    edges: [
      { id: 'e1', source: 'A', target: 'B', weight: 1 },
      { id: 'e2', source: 'B', target: 'C', weight: 1 },
    ],
  };

  const weakReport = analyzeConnectivity(oneWayChain);
  assert.equal(weakReport.isWeaklyConnected, true);
  assert.equal(weakReport.isStronglyConnected, false);
  assert.equal(weakReport.components.length, 3);
  assert.equal(weakReport.weakComponents?.length, 1);

  // Add C -> A to complete directed cycle -> Strongly Connected (1 SCC)
  const directedCycle: GraphData = {
    ...oneWayChain,
    edges: [...oneWayChain.edges, { id: 'e3', source: 'C', target: 'A', weight: 1 }],
  };
  const strongReport = analyzeConnectivity(directedCycle);
  assert.equal(strongReport.isStronglyConnected, true);
  assert.equal(strongReport.isWeaklyConnected, true);
  assert.equal(strongReport.components.length, 1);
});

test('Reachability finds shortest unweighted path and detects unreachable targets', () => {
  const reachOk = checkReachability(sampleTree, 'D', 'C');
  assert.equal(reachOk.reachable, true);
  assert.deepEqual(reachOk.pathLabels, ['D', 'B', 'A', 'C']);
  assert.equal(reachOk.hopCount, 3);

  const directedGraph: GraphData = {
    name: 'One-way',
    directed: true,
    weighted: false,
    nodes: [
      { id: 'A', label: 'A', x: 0, y: 0 },
      { id: 'B', label: 'B', x: 0, y: 0 },
    ],
    edges: [{ id: 'e1', source: 'A', target: 'B', weight: 1 }],
  };
  assert.equal(checkReachability(directedGraph, 'A', 'B').reachable, true);
  assert.equal(checkReachability(directedGraph, 'B', 'A').reachable, false);
});

test('Cycle detection accurately distinguishes trees/DAGs from undirected and directed cycles', () => {
  // Sample tree is acyclic
  assert.equal(detectCycle(sampleTree).hasCycle, false);

  // Undirected triangle has cycle
  const triangle: GraphData = {
    ...sampleTree,
    edges: [
      ...sampleTree.edges,
      { id: 'e5', source: 'D', target: 'E', weight: 1 },
    ],
  };
  const undirCycle = detectCycle(triangle);
  assert.equal(undirCycle.hasCycle, true);
  assert.ok(undirCycle.cycleLabels.length >= 4); // e.g., B - D - E - B

  // Directed diamond A -> B, A -> C, B -> D, C -> D is a DAG (NOT a directed cycle!)
  const diamondDAG: GraphData = {
    name: 'Diamond DAG',
    directed: true,
    weighted: false,
    nodes: [
      { id: 'A', label: 'A', x: 0, y: 0 },
      { id: 'B', label: 'B', x: 0, y: 0 },
      { id: 'C', label: 'C', x: 0, y: 0 },
      { id: 'D', label: 'D', x: 0, y: 0 },
    ],
    edges: [
      { id: 'e1', source: 'A', target: 'B', weight: 1 },
      { id: 'e2', source: 'A', target: 'C', weight: 1 },
      { id: 'e3', source: 'B', target: 'D', weight: 1 },
      { id: 'e4', source: 'C', target: 'D', weight: 1 },
    ],
  };
  assert.equal(detectCycle(diamondDAG).hasCycle, false);
});

test('Edge cases: empty graph and single-vertex graph work without errors', () => {
  const emptyGraph: GraphData = {
    name: 'Empty',
    directed: false,
    weighted: false,
    nodes: [],
    edges: [],
  };
  assert.equal(runBFS(emptyGraph, null).visitedCount, 0);
  assert.equal(runDFSRecursive(emptyGraph, null).visitedCount, 0);
  assert.equal(runDFSIterative(emptyGraph, null).visitedCount, 0);
  assert.equal(analyzeConnectivity(emptyGraph).vertexCount, 0);

  const singleGraph: GraphData = {
    name: 'Single',
    directed: false,
    weighted: false,
    nodes: [{ id: 'n0', label: 'A', x: 100, y: 100 }],
    edges: [],
  };
  assert.deepEqual(runBFS(singleGraph, 'n0').traversalLabels, ['A']);
  assert.deepEqual(runDFSRecursive(singleGraph, 'n0').traversalLabels, ['A']);
  assert.equal(analyzeConnectivity(singleGraph).isConnected, true);
  assert.equal(analyzeConnectivity(singleGraph).isolatedVertices.length, 1);
});

test('Input parsers validate malformed input and parse valid edge list, adjacency list, and matrix', () => {
  const badEdge = parseEdgeListInput('A A', null, null, false, false);
  assert.equal(badEdge.ok, false); // self-loop rejected

  const okEdge = parseEdgeListInput('A B 4\nB C 7', 4, 2, false, true);
  assert.equal(okEdge.ok, true);
  assert.equal(okEdge.graph?.nodes.length, 4); // 4th vertex padded as isolated D
  assert.equal(okEdge.graph?.edges.length, 2);

  const okAdj = parseAdjacencyListInput('A: B, C\nB: A\nC: A\nD:', false, false);
  assert.equal(okAdj.ok, true);
  assert.equal(okAdj.graph?.nodes.length, 4);
  assert.equal(okAdj.graph?.edges.length, 2);

  const asymMatrix = parseAdjacencyMatrixInput('0 1\n0 0', false, false);
  assert.equal(asymMatrix.ok, false); // undirected must be symmetric

  const dirMatrix = parseAdjacencyMatrixInput('0 1\n0 0', true, false);
  assert.equal(dirMatrix.ok, true);
  assert.equal(dirMatrix.graph?.edges.length, 1);
});

test('Generator and benchmark suite execute real measurements and produce valid CSV', () => {
  const g = generateGraph({ type: 'sparse', vertexCount: 25, seed: 99 });
  assert.equal(g.nodes.length, 25);
  const dp = benchmarkSingleGraph(g, 'Sparse 25V', 'sparse', 3);
  assert.equal(dp.vertices, 25);
  assert.ok(dp.bfsOperations > 0);
  assert.ok(dp.dfsOperations > 0);
  const csv = exportBenchmarksToCSV([dp]);
  assert.ok(csv.includes('Experiment_Label'));
  assert.ok(csv.includes('Sparse 25V'));
});
