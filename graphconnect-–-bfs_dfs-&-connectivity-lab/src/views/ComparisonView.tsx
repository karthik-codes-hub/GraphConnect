import React, { useEffect, useMemo, useState } from 'react';
import { GraphCanvas } from '../components/GraphCanvas';
import { PlaybackControls } from '../components/PlaybackControls';
import { compareLabels } from '../algorithms/graphCore';
import {
  runBFS,
  runDFSIterative,
  runDFSRecursive,
} from '../algorithms/traversals';
import { GraphData, PageId } from '../types/graph';

interface ComparisonViewProps {
  graph: GraphData;
  onNavigate: (page: PageId) => void;
}

const COMPARISON_ROWS = [
  {
    parameter: 'Traversal Strategy',
    bfs: 'Level-by-level concentric wavefront outward from source',
    dfs: 'Deep path exploration along one branch until dead end, then backtrack',
  },
  {
    parameter: 'Core Data Structure',
    bfs: 'First-In, First-Out (FIFO) Queue',
    dfs: 'Recursion Call Stack or Explicit Last-In, First-Out (LIFO) Stack',
  },
  {
    parameter: 'Shortest Path (Unweighted)',
    bfs: 'Guaranteed — visits vertices in non-decreasing hop count',
    dfs: 'Not guaranteed — may reach destination via a long winding detour first',
  },
  {
    parameter: 'Time Complexity (Adjacency List)',
    bfs: 'O(V + E)',
    dfs: 'O(V + E)',
  },
  {
    parameter: 'Time Complexity (Adjacency Matrix)',
    bfs: 'O(V²)',
    dfs: 'O(V²)',
  },
  {
    parameter: 'Auxiliary Space Complexity',
    bfs: 'O(V) worst case; proportional to maximum frontier width O(w)',
    dfs: 'O(V) worst case; stack proportional to maximum path depth O(h)',
  },
  {
    parameter: 'Typical Applications',
    bfs: 'Shortest unweighted hops, social degrees, web crawling, broadcasting',
    dfs: 'Cycle detection, topological sort (DAGs), Kosaraju/Tarjan SCCs, mazes',
  },
];

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  graph,
  onNavigate,
}) => {
  const sortedNodes = useMemo(
    () => [...graph.nodes].sort((a, b) => compareLabels(a.label, b.label)),
    [graph.nodes]
  );

  const [startNodeId, setStartNodeId] = useState<string | null>(
    sortedNodes[0]?.id ?? null
  );
  const [dfsMode, setDfsMode] = useState<'recursive' | 'iterative'>('recursive');
  const [syncPlayback, setSyncPlayback] = useState(true);

  const [sharedStep, setSharedStep] = useState(0);
  const [bfsStepIdx, setBfsStepIdx] = useState(0);
  const [dfsStepIdx, setDfsStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);

  useEffect(() => {
    if (sortedNodes.length === 0) {
      setStartNodeId(null);
    } else if (!startNodeId || !sortedNodes.some((n) => n.id === startNodeId)) {
      setStartNodeId(sortedNodes[0].id);
    }
  }, [sortedNodes, startNodeId]);

  const bfsResult = useMemo(
    () => runBFS(graph, startNodeId, false),
    [graph, startNodeId]
  );

  const dfsResult = useMemo(
    () =>
      dfsMode === 'recursive'
        ? runDFSRecursive(graph, startNodeId, false)
        : runDFSIterative(graph, startNodeId, false),
    [graph, startNodeId, dfsMode]
  );

  const maxSyncedSteps = Math.max(bfsResult.steps.length, dfsResult.steps.length);

  useEffect(() => {
    setSharedStep(0);
    setBfsStepIdx(0);
    setDfsStepIdx(0);
    setIsPlaying(false);
  }, [graph, startNodeId, dfsMode]);

  useEffect(() => {
    if (!isPlaying) return;
    if (sharedStep >= maxSyncedSteps - 1) {
      setIsPlaying(false);
      return;
    }
    const intervalMs = Math.max(180, Math.round(950 / speedMultiplier));
    const timer = window.setTimeout(() => {
      setSharedStep((prev) => {
        const next = Math.min(maxSyncedSteps - 1, prev + 1);
        setBfsStepIdx(Math.min(bfsResult.steps.length - 1, next));
        setDfsStepIdx(Math.min(dfsResult.steps.length - 1, next));
        return next;
      });
    }, intervalMs);
    return () => window.clearTimeout(timer);
  }, [
    isPlaying,
    sharedStep,
    maxSyncedSteps,
    bfsResult.steps.length,
    dfsResult.steps.length,
    speedMultiplier,
  ]);

  const activeBfsIdx = syncPlayback
    ? Math.min(sharedStep, bfsResult.steps.length - 1)
    : Math.min(bfsStepIdx, bfsResult.steps.length - 1);

  const activeDfsIdx = syncPlayback
    ? Math.min(sharedStep, dfsResult.steps.length - 1)
    : Math.min(dfsStepIdx, dfsResult.steps.length - 1);

  const curBfs = bfsResult.steps[activeBfsIdx] ?? bfsResult.steps[0];
  const curDfs = dfsResult.steps[activeDfsIdx] ?? dfsResult.steps[0];

  const ordersDiffer =
    bfsResult.traversalLabels.join(',') !== dfsResult.traversalLabels.join(',');

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Central Analytical Module · Side-by-Side Synchronized Execution
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">
            BFS vs. DFS Comparison Lab
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
            Execute Breadth-First Search and Depth-First Search on the exact same graph and starting vertex to compare traversal order, queue vs. stack behavior, and empirical metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('builder')}
            className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            Change Graph ({graph.nodes.length}V, {graph.edges.length}E)
          </button>
          <button
            type="button"
            onClick={() => onNavigate('performance')}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold whitespace-nowrap"
          >
            Scale in Performance Lab →
          </button>
        </div>
      </div>

      {/* Control Deck */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label
              htmlFor="cmp-start-vertex"
              className="text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap"
            >
              Starting Vertex:
            </label>
            <select
              id="cmp-start-vertex"
              value={startNodeId ?? ''}
              disabled={sortedNodes.length === 0}
              onChange={(e) => setStartNodeId(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-semibold text-slate-900 dark:text-slate-100"
            >
              {sortedNodes.map((n) => (
                <option key={n.id} value={n.id}>
                  Vertex {n.label}
                </option>
              ))}
            </select>
          </div>

          <div
            role="group"
            aria-label="DFS variant for comparison"
            className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800"
          >
            <button
              type="button"
              onClick={() => setDfsMode('recursive')}
              className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${
                dfsMode === 'recursive'
                  ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Recursive DFS
            </button>
            <button
              type="button"
              onClick={() => setDfsMode('iterative')}
              className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${
                dfsMode === 'iterative'
                  ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Iterative Stack DFS
            </button>
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={syncPlayback}
              onChange={(e) => {
                setSyncPlayback(e.target.checked);
                setIsPlaying(false);
              }}
              className="rounded accent-blue-600"
            />
            <span>Synchronize both panels</span>
          </label>
        </div>

        <button
          type="button"
          onClick={() => {
            const end = maxSyncedSteps - 1;
            setIsPlaying(false);
            setSharedStep(end);
            setBfsStepIdx(bfsResult.steps.length - 1);
            setDfsStepIdx(dfsResult.steps.length - 1);
          }}
          className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
        >
          Jump to Final Output
        </button>
      </div>

      {/* Synchronized Playback Bar */}
      {syncPlayback && (
        <PlaybackControls
          currentStep={sharedStep}
          totalSteps={maxSyncedSteps}
          isPlaying={isPlaying}
          speedMultiplier={speedMultiplier}
          onPlayPause={() => {
            if (sharedStep >= maxSyncedSteps - 1) {
              setSharedStep(0);
              setIsPlaying(true);
            } else {
              setIsPlaying((p) => !p);
            }
          }}
          onPrev={() => {
            setIsPlaying(false);
            setSharedStep((s) => Math.max(0, s - 1));
          }}
          onNext={() => {
            setIsPlaying(false);
            setSharedStep((s) => Math.min(maxSyncedSteps - 1, s + 1));
          }}
          onRestart={() => {
            setIsPlaying(false);
            setSharedStep(0);
          }}
          onSeek={(s) => {
            setIsPlaying(false);
            setSharedStep(s);
          }}
          onSpeedChange={setSpeedMultiplier}
        />
      )}

      {/* Side-by-Side Graph Panels: Left = BFS, Right = DFS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT PANEL: BFS */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                LEFT PANEL · FIFO QUEUE
              </span>
              <h2 className="text-base font-display font-bold text-slate-900 dark:text-slate-100">
                Breadth-First Search (BFS)
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
              Step {activeBfsIdx} / {bfsResult.steps.length - 1}
            </span>
          </div>

          <GraphCanvas
            graph={graph}
            heightClass="h-[340px]"
            activeNodeId={curBfs.activeNodeId}
            visitedIds={curBfs.visitedIds}
            frontierIds={curBfs.queue}
            exploringEdgeId={curBfs.exploringEdgeId}
            treeEdgeIds={curBfs.treeEdgeIds}
            accentVariant="cyan"
          />

          {!syncPlayback && (
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setBfsStepIdx((s) => Math.max(0, s - 1))}
                disabled={activeBfsIdx <= 0}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold disabled:opacity-40"
              >
                ← Prev BFS Step
              </button>
              <button
                type="button"
                onClick={() => setBfsStepIdx(0)}
                className="text-xs text-slate-500 hover:underline"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() =>
                  setBfsStepIdx((s) => Math.min(bfsResult.steps.length - 1, s + 1))
                }
                disabled={activeBfsIdx >= bfsResult.steps.length - 1}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-semibold disabled:opacity-40"
              >
                Next BFS Step →
              </button>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0D1526] space-y-1.5 text-xs">
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              {curBfs.title}
            </div>
            <p className="text-slate-600 dark:text-slate-400">{curBfs.explanation}</p>
            <div className="pt-1 font-mono text-cyan-700 dark:text-cyan-300">
              Queue: [{curBfs.queue.join(', ')}] · Level: {curBfs.currentLevel}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: DFS */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-xs font-mono text-violet-600 dark:text-violet-400 font-semibold">
                RIGHT PANEL · {dfsMode === 'recursive' ? 'CALL STACK' : 'LIFO STACK'}
              </span>
              <h2 className="text-base font-display font-bold text-slate-900 dark:text-slate-100">
                Depth-First Search ({dfsMode === 'recursive' ? 'Recursive' : 'Iterative'})
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
              Step {activeDfsIdx} / {dfsResult.steps.length - 1}
            </span>
          </div>

          <GraphCanvas
            graph={graph}
            heightClass="h-[340px]"
            activeNodeId={curDfs.activeNodeId}
            isBacktracking={curDfs.isBacktracking}
            visitedIds={curDfs.visitedIds}
            frontierIds={curDfs.stack.map((f) => f.label)}
            exploringEdgeId={curDfs.exploringEdgeId}
            treeEdgeIds={curDfs.treeEdgeIds}
            accentVariant="violet"
          />

          {!syncPlayback && (
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setDfsStepIdx((s) => Math.max(0, s - 1))}
                disabled={activeDfsIdx <= 0}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold disabled:opacity-40"
              >
                ← Prev DFS Step
              </button>
              <button
                type="button"
                onClick={() => setDfsStepIdx(0)}
                className="text-xs text-slate-500 hover:underline"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() =>
                  setDfsStepIdx((s) => Math.min(dfsResult.steps.length - 1, s + 1))
                }
                disabled={activeDfsIdx >= dfsResult.steps.length - 1}
                className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold disabled:opacity-40"
              >
                Next DFS Step →
              </button>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0D1526] space-y-1.5 text-xs">
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              {curDfs.title}
            </div>
            <p className="text-slate-600 dark:text-slate-400">{curDfs.explanation}</p>
            <div className="pt-1 font-mono text-violet-700 dark:text-violet-300">
              Stack: [{curDfs.stack.map((f) => f.label).join(' → ')}] · Depth:{' '}
              {curDfs.recursionDepth}
            </div>
          </div>
        </div>
      </div>

      {/* Empirical Execution Metrics Summary */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-display font-bold text-slate-900 dark:text-slate-100">
            Measured Execution Metrics on Active Graph
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Deterministic alphabetical neighbor tie-breaking
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0D1526] space-y-2">
            <div className="font-semibold text-cyan-700 dark:text-cyan-400">
              BFS Complete Traversal Order
            </div>
            <div className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 break-words">
              {bfsResult.traversalLabels.join(' → ') || 'Empty'}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 font-mono tabular-nums">
              <div>
                <span className="block text-slate-500">Visited</span>
                <strong className="text-slate-900 dark:text-slate-100">
                  {bfsResult.visitedCount}
                </strong>
              </div>
              <div>
                <span className="block text-slate-500">Edges Checked</span>
                <strong className="text-slate-900 dark:text-slate-100">
                  {bfsResult.edgesExamined}
                </strong>
              </div>
              <div>
                <span className="block text-slate-500">Max Queue</span>
                <strong className="text-slate-900 dark:text-slate-100">
                  {bfsResult.peakAuxiliarySize}
                </strong>
              </div>
              <div>
                <span className="block text-slate-500">Runtime / Mem</span>
                <strong className="text-slate-900 dark:text-slate-100">
                  {bfsResult.executionTimeMs.toFixed(3)}ms · ~{bfsResult.estimatedMemoryBytes}B
                </strong>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0D1526] space-y-2">
            <div className="font-semibold text-violet-700 dark:text-violet-400">
              DFS Complete Traversal Order ({dfsMode})
            </div>
            <div className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 break-words">
              {dfsResult.traversalLabels.join(' → ') || 'Empty'}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 font-mono tabular-nums">
              <div>
                <span className="block text-slate-500">Visited</span>
                <strong className="text-slate-900 dark:text-slate-100">
                  {dfsResult.visitedCount}
                </strong>
              </div>
              <div>
                <span className="block text-slate-500">Edges Checked</span>
                <strong className="text-slate-900 dark:text-slate-100">
                  {dfsResult.edgesExamined}
                </strong>
              </div>
              <div>
                <span className="block text-slate-500">
                  {dfsMode === 'recursive' ? 'Max Depth' : 'Peak Stack'}
                </span>
                <strong className="text-slate-900 dark:text-slate-100">
                  {dfsResult.peakAuxiliarySize}
                </strong>
              </div>
              <div>
                <span className="block text-slate-500">Runtime / Mem</span>
                <strong className="text-slate-900 dark:text-slate-100">
                  {dfsResult.executionTimeMs.toFixed(3)}ms · ~{dfsResult.estimatedMemoryBytes}B
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Why Traversal Orders Differ Explanation */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <strong className="text-slate-900 dark:text-slate-100">
            Why Traversal Orders {ordersDiffer ? 'Differ on This Graph:' : 'Match on This Graph:'}
          </strong>{' '}
          {ordersDiffer
            ? 'Whenever a vertex branches to multiple unvisited neighbors (e.g., B and C), BFS enqueues all immediate siblings and visits them at Level 1 before advancing to Level 2 grandchildren. DFS immediately commits to the first neighbor B and explores B’s entire reachable subtree before ever returning to sibling C. Changing neighbor ordering in the adjacency list also permutes which sibling or branch is explored first.'
            : 'On linear chains or single-branch topologies where each active vertex has at most one unvisited neighbor, the frontier width is 1, causing BFS and DFS to visit vertices in the exact same sequence.'}
        </div>
      </div>

      {/* Parameter Comparison Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-4">
        <h2 className="text-lg font-display font-bold text-slate-900 dark:text-slate-100">
          Theoretical & Practical Comparison Matrix
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-3 pr-4 font-semibold w-1/4">Parameter</th>
                <th className="py-3 px-4 font-semibold text-cyan-700 dark:text-cyan-400 w-3/8">
                  Breadth-First Search (BFS)
                </th>
                <th className="py-3 pl-4 font-semibold text-violet-700 dark:text-violet-400 w-3/8">
                  Depth-First Search (DFS)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.parameter} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-slate-100">
                    {row.parameter}
                  </td>
                  <td className="py-3 px-4 leading-relaxed">{row.bfs}</td>
                  <td className="py-3 pl-4 leading-relaxed">{row.dfs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
