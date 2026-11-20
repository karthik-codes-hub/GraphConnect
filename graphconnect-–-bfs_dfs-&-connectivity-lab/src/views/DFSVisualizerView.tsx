import React, { useEffect, useMemo, useState } from 'react';
import { GraphCanvas } from '../components/GraphCanvas';
import { PlaybackControls } from '../components/PlaybackControls';
import { compareLabels } from '../algorithms/graphCore';
import { runDFSIterative, runDFSRecursive } from '../algorithms/traversals';
import { GraphData, PageId } from '../types/graph';

const DFS_RECURSIVE_PSEUDOCODE = [
  '1. DFS_Recursive(Graph G, vertex u):',
  '2.   mark u as visited; append u to order',
  '3.   for each neighbor v in sorted Adj[u] do:',
  '4.     if v is not visited then:',
  '5.       DFS_Recursive(G, v)   // dive deeper',
  '6.   return                    // backtrack to caller',
  '7. // Completed all reachable branches',
];

const DFS_ITERATIVE_PSEUDOCODE = [
  '1. DFS_Iterative(Graph G, startVertex s):',
  '2.   create LIFO Stack S; push(S, s)',
  '3.   while S is not empty do:',
  '4.     u ← pop(S)',
  '5.     if u is already visited then continue',
  '6.     mark u as visited; append u to order',
  '7.     for each neighbor v in reverse-sorted Adj[u] do:',
  '8.       if v is not visited then push(S, v)',
  '9.   end while',
  '10.  return order',
];

interface DFSVisualizerViewProps {
  graph: GraphData;
  onNavigate: (page: PageId) => void;
}

export const DFSVisualizerView: React.FC<DFSVisualizerViewProps> = ({
  graph,
  onNavigate,
}) => {
  const sortedNodes = useMemo(
    () => [...graph.nodes].sort((a, b) => compareLabels(a.label, b.label)),
    [graph.nodes]
  );

  const [dfsVariant, setDfsVariant] = useState<'recursive' | 'iterative'>('recursive');
  const [startNodeId, setStartNodeId] = useState<string | null>(
    sortedNodes[0]?.id ?? null
  );
  const [traverseAllComponents, setTraverseAllComponents] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);

  useEffect(() => {
    if (sortedNodes.length === 0) {
      setStartNodeId(null);
    } else if (!startNodeId || !sortedNodes.some((n) => n.id === startNodeId)) {
      setStartNodeId(sortedNodes[0].id);
    }
  }, [sortedNodes, startNodeId]);

  const dfsResult = useMemo(() => {
    return dfsVariant === 'recursive'
      ? runDFSRecursive(graph, startNodeId, traverseAllComponents)
      : runDFSIterative(graph, startNodeId, traverseAllComponents);
  }, [graph, startNodeId, dfsVariant, traverseAllComponents]);

  useEffect(() => {
    setCurrentStepIdx(0);
    setIsPlaying(false);
  }, [graph, startNodeId, dfsVariant, traverseAllComponents]);

  useEffect(() => {
    if (!isPlaying) return;
    const maxIdx = dfsResult.steps.length - 1;
    if (currentStepIdx >= maxIdx) {
      setIsPlaying(false);
      return;
    }
    const intervalMs = Math.max(180, Math.round(950 / speedMultiplier));
    const timer = window.setTimeout(() => {
      setCurrentStepIdx((s) => Math.min(maxIdx, s + 1));
    }, intervalMs);
    return () => window.clearTimeout(timer);
  }, [isPlaying, currentStepIdx, dfsResult.steps.length, speedMultiplier]);

  const step =
    dfsResult.steps[Math.min(currentStepIdx, dfsResult.steps.length - 1)] ??
    dfsResult.steps[0];

  const idToLabel = useMemo(
    () => new Map(graph.nodes.map((n) => [n.id, n.label])),
    [graph.nodes]
  );

  const depthAnnotations = useMemo(() => {
    const out: Record<string, string> = {};
    for (const [id, d] of Object.entries(step.levels)) {
      out[id] = `Depth ${d}`;
    }
    return out;
  }, [step.levels]);

  const isCompleted = currentStepIdx >= dfsResult.steps.length - 1;
  const activePseudocode =
    dfsVariant === 'recursive' ? DFS_RECURSIVE_PSEUDOCODE : DFS_ITERATIVE_PSEUDOCODE;

  return (
    <div className="space-y-7 pb-10">
      {/* Header & Definition */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Deep Path Exploration & Backtracking · Recursion & LIFO Stack · O(V + E)
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">
            Depth-First Search (DFS) Visualizer
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
            <strong>Definition:</strong> Depth-First Search explores a graph by going as deep as possible along one path before backtracking. Toggle below between <strong>Recursive DFS</strong> (call-stack depth) and <strong>Iterative DFS</strong> (explicit LIFO stack).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('builder')}
            className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            Edit Graph ({graph.nodes.length}V, {graph.edges.length}E)
          </button>
          <button
            type="button"
            onClick={() => onNavigate('comparison')}
            className="px-3.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold whitespace-nowrap"
          >
            Compare with BFS →
          </button>
        </div>
      </div>

      {/* Controls Bar: Variant Switcher + Start Vertex */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div
            role="group"
            aria-label="DFS implementation mode"
            className="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800"
          >
            <button
              type="button"
              onClick={() => setDfsVariant('recursive')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                dfsVariant === 'recursive'
                  ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Recursive DFS (Call Stack)
            </button>
            <button
              type="button"
              onClick={() => setDfsVariant('iterative')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                dfsVariant === 'iterative'
                  ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Iterative DFS (Explicit Stack)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="dfs-start-vertex"
              className="text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap"
            >
              Starting Vertex:
            </label>
            <select
              id="dfs-start-vertex"
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

          <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={traverseAllComponents}
              onChange={(e) => setTraverseAllComponents(e.target.checked)}
              className="rounded accent-violet-600"
            />
            <span>Traverse disconnected components</span>
          </label>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          {step.isBacktracking ? (
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              ▲ Backtracking Active
            </span>
          ) : (
            <span>Exploring = Blue · Backtrack = Amber · Visited = Violet + Order #</span>
          )}
        </div>
      </div>

      {/* Main Two-Zone Split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 space-y-4">
          <GraphCanvas
            graph={graph}
            activeNodeId={step.activeNodeId}
            isBacktracking={step.isBacktracking}
            visitedIds={step.visitedIds}
            frontierIds={step.stack.map((f) => f.label)}
            exploringEdgeId={step.exploringEdgeId}
            treeEdgeIds={step.treeEdgeIds}
            nodeAnnotations={depthAnnotations}
            accentVariant="violet"
            onNodeClick={(nodeId) => setStartNodeId(nodeId)}
          />

          <PlaybackControls
            currentStep={currentStepIdx}
            totalSteps={dfsResult.steps.length}
            isPlaying={isPlaying}
            speedMultiplier={speedMultiplier}
            onPlayPause={() => {
              if (currentStepIdx >= dfsResult.steps.length - 1) {
                setCurrentStepIdx(0);
                setIsPlaying(true);
              } else {
                setIsPlaying((p) => !p);
              }
            }}
            onPrev={() => {
              setIsPlaying(false);
              setCurrentStepIdx((s) => Math.max(0, s - 1));
            }}
            onNext={() => {
              setIsPlaying(false);
              setCurrentStepIdx((s) => Math.min(dfsResult.steps.length - 1, s + 1));
            }}
            onRestart={() => {
              setIsPlaying(false);
              setCurrentStepIdx(0);
            }}
            onSeek={(idx) => {
              setIsPlaying(false);
              setCurrentStepIdx(idx);
            }}
            onSpeedChange={setSpeedMultiplier}
          />

          {/* Final Traversal Order Summary */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {isCompleted
                  ? 'Final DFS Traversal Order'
                  : 'DFS Traversal Order So Far'}
              </span>
              <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                Current Depth: {step.recursionDepth} · Max {dfsVariant === 'recursive' ? 'Depth' : 'Stack'}:{' '}
                {dfsResult.peakAuxiliarySize}
              </span>
            </div>
            <div className="font-mono text-sm font-semibold text-violet-700 dark:text-violet-300 break-words">
              {step.visitedIds.length > 0
                ? step.visitedIds.map((id) => idToLabel.get(id) ?? id).join(' → ')
                : 'No vertices visited yet'}
            </div>
          </div>
        </div>

        {/* Right Deck: Step Explanation, Call Stack / LIFO Stack, Dual Pseudocode */}
        <div className="xl:col-span-5 space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>
                {step.isBacktracking
                  ? 'Backtracking Step Explanation'
                  : 'Live Step Explanation'}
              </span>
              <span className="font-mono tabular-nums">
                Step {step.stepIndex} of {dfsResult.steps.length - 1}
              </span>
            </div>
            <h2 className="text-base font-display font-bold text-slate-900 dark:text-slate-100">
              {step.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {step.explanation}
            </p>
          </div>

          {/* Stack / Recursion Depth Visualizer */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-display font-bold text-slate-900 dark:text-slate-100">
                {dfsVariant === 'recursive'
                  ? 'Recursion Call Stack (Caller → Active Top)'
                  : 'Explicit LIFO Stack State (Bottom → Top)'}
              </span>
              <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                {dfsVariant === 'recursive'
                  ? `Recursion Depth: ${step.stack.length}`
                  : `Stack Size: ${step.stack.length}`}
              </span>
            </div>

            {step.stack.length === 0 ? (
              <div className="py-3 px-3 rounded-lg bg-slate-50 dark:bg-[#0D1526] text-xs font-mono text-slate-500 dark:text-slate-400">
                {dfsVariant === 'recursive'
                  ? 'Call stack is empty (Depth 0)'
                  : 'Explicit LIFO stack is empty [ ]'}
              </div>
            ) : (
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                <span className="text-[11px] font-mono text-slate-400 shrink-0">
                  BOTTOM
                </span>
                {step.stack.map((frame, idx) => {
                  const isTop = idx === step.stack.length - 1;
                  return (
                    <div
                      key={`${frame.nodeId}-${idx}`}
                      className={`h-9 px-2.5 inline-flex items-center gap-1 rounded-lg border font-mono text-xs font-bold shrink-0 ${
                        isTop
                          ? 'border-violet-500 bg-violet-100 dark:bg-violet-950/70 text-violet-900 dark:text-violet-200'
                          : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{frame.label}</span>
                      <span className="text-[10px] opacity-75">(d{frame.depth})</span>
                    </div>
                  );
                })}
                <span className="text-[11px] font-mono text-violet-600 dark:text-violet-400 shrink-0">
                  ← TOP
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <div className="text-slate-500 dark:text-slate-400 mb-1">
                  Visited ({step.visitedIds.length})
                </div>
                <div className="font-mono text-slate-800 dark:text-slate-200 break-words">
                  {step.visitedIds.length > 0
                    ? step.visitedIds.map((id) => idToLabel.get(id)).join(', ')
                    : 'None'}
                </div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400 mb-1">
                  Unvisited ({step.unvisitedIds.length})
                </div>
                <div className="font-mono text-slate-600 dark:text-slate-400 break-words">
                  {step.unvisitedIds.length > 0
                    ? step.unvisitedIds.map((id) => idToLabel.get(id)).join(', ')
                    : 'None (All Visited)'}
                </div>
              </div>
            </div>
          </div>

          {/* Both Recursive & Iterative DFS Pseudocode Reference */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-display font-bold text-slate-900 dark:text-slate-100">
                {dfsVariant === 'recursive'
                  ? 'Active: Recursive DFS Pseudocode'
                  : 'Active: Iterative Stack DFS Pseudocode'}
              </span>
              <button
                type="button"
                onClick={() =>
                  setDfsVariant((v) => (v === 'recursive' ? 'iterative' : 'recursive'))
                }
                className="text-violet-600 dark:text-violet-400 font-semibold hover:underline"
              >
                Switch to {dfsVariant === 'recursive' ? 'Iterative' : 'Recursive'}
              </button>
            </div>

            <pre className="p-3 rounded-lg bg-slate-50 dark:bg-[#0D1526] text-[11.5px] font-mono leading-relaxed overflow-x-auto">
              {activePseudocode.map((line, i) => {
                const lineNum = i + 1;
                const isActive = step.pseudocodeLine === lineNum;
                return (
                  <div
                    key={lineNum}
                    className={`px-2 py-0.5 rounded ${
                      isActive
                        ? 'bg-violet-500/20 text-violet-900 dark:text-violet-200 font-semibold'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {line}
                  </div>
                );
              })}
            </pre>

            <details className="text-xs text-slate-600 dark:text-slate-400">
              <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                Compare with {dfsVariant === 'recursive' ? 'Iterative Stack' : 'Recursive'} Pseudocode
              </summary>
              <pre className="mt-2 p-3 rounded-lg bg-slate-50 dark:bg-[#0D1526] text-[11px] font-mono leading-relaxed overflow-x-auto text-slate-600 dark:text-slate-400">
                {(dfsVariant === 'recursive'
                  ? DFS_ITERATIVE_PSEUDOCODE
                  : DFS_RECURSIVE_PSEUDOCODE
                ).join('\n')}
              </pre>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};
