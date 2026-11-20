import React, { useEffect, useMemo, useState } from 'react';
import { GraphCanvas } from '../components/GraphCanvas';
import { PlaybackControls } from '../components/PlaybackControls';
import { compareLabels } from '../algorithms/graphCore';
import { runBFS } from '../algorithms/traversals';
import { GraphData, PageId } from '../types/graph';

const BFS_PSEUDOCODE = [
  '1. BFS(Graph G, startVertex s):',
  '2.   create empty FIFO Queue Q, Visited set V_vis',
  '3.   mark s as visited; level[s] ← 0; enqueue(Q, s)',
  '4.   while Q is not empty do:',
  '5.     u ← dequeue(Q)',
  '6.     for each neighbor v in sorted Adj[u] do:',
  '7.       if v is not in V_vis then:',
  '8.         mark v as visited; level[v] ← level[u] + 1; enqueue(Q, v)',
  '9.   end while',
  '10.  return traversalOrder',
];

interface BFSVisualizerViewProps {
  graph: GraphData;
  onNavigate: (page: PageId) => void;
}

export const BFSVisualizerView: React.FC<BFSVisualizerViewProps> = ({
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

  const bfsResult = useMemo(
    () => runBFS(graph, startNodeId, traverseAllComponents),
    [graph, startNodeId, traverseAllComponents]
  );

  useEffect(() => {
    setCurrentStepIdx(0);
    setIsPlaying(false);
  }, [graph, startNodeId, traverseAllComponents]);

  useEffect(() => {
    if (!isPlaying) return;
    const maxIdx = bfsResult.steps.length - 1;
    if (currentStepIdx >= maxIdx) {
      setIsPlaying(false);
      return;
    }
    const intervalMs = Math.max(180, Math.round(950 / speedMultiplier));
    const timer = window.setTimeout(() => {
      setCurrentStepIdx((s) => Math.min(maxIdx, s + 1));
    }, intervalMs);
    return () => window.clearTimeout(timer);
  }, [isPlaying, currentStepIdx, bfsResult.steps.length, speedMultiplier]);

  const step =
    bfsResult.steps[Math.min(currentStepIdx, bfsResult.steps.length - 1)] ??
    bfsResult.steps[0];

  const idToLabel = useMemo(
    () => new Map(graph.nodes.map((n) => [n.id, n.label])),
    [graph.nodes]
  );

  const levelAnnotations = useMemo(() => {
    const out: Record<string, string> = {};
    for (const [id, lvl] of Object.entries(step.levels)) {
      out[id] = `Level ${lvl}`;
    }
    return out;
  }, [step.levels]);

  const isCompleted = currentStepIdx >= bfsResult.steps.length - 1;

  return (
    <div className="space-y-7 pb-10">
      {/* Header & Definition */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Level-Order Wavefront Traversal · Queue Data Structure · O(V + E)
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">
            Breadth-First Search (BFS) Visualizer
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
            <strong>Definition:</strong> Breadth-First Search explores a graph level by level using a First-In, First-Out (FIFO) queue data structure, visiting all vertices at hop distance <em>d</em> before any vertex at distance <em>d + 1</em>.
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
            className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold whitespace-nowrap"
          >
            Compare with DFS →
          </button>
        </div>
      </div>

      {/* Configuration Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label
              htmlFor="bfs-start-vertex"
              className="text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap"
            >
              Starting Vertex:
            </label>
            <select
              id="bfs-start-vertex"
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
              className="rounded accent-blue-600"
            />
            <span>Auto-continue across disconnected components</span>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>Active = Blue Ring</span>
          <span>·</span>
          <span>Visited = Cyan + Order #</span>
          <span>·</span>
          <span>In Queue = Dashed Halo</span>
        </div>
      </div>

      {/* Two-Zone Sandbox Layout: Left = Graph Canvas + Playback, Right = Queue State + Step Explanation + Pseudocode */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 space-y-4">
          <GraphCanvas
            graph={graph}
            activeNodeId={step.activeNodeId}
            visitedIds={step.visitedIds}
            frontierIds={step.queue}
            exploringEdgeId={step.exploringEdgeId}
            treeEdgeIds={step.treeEdgeIds}
            nodeAnnotations={levelAnnotations}
            accentVariant="cyan"
            onNodeClick={(nodeId) => setStartNodeId(nodeId)}
          />

          <PlaybackControls
            currentStep={currentStepIdx}
            totalSteps={bfsResult.steps.length}
            isPlaying={isPlaying}
            speedMultiplier={speedMultiplier}
            onPlayPause={() => {
              if (currentStepIdx >= bfsResult.steps.length - 1) {
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
              setCurrentStepIdx((s) => Math.min(bfsResult.steps.length - 1, s + 1));
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

          {/* Final Complete Traversal Summary Banner */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {isCompleted
                  ? 'Complete BFS Traversal Order'
                  : 'Traversal Order Discovered So Far'}
              </span>
              <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                Current Wave Level: {step.currentLevel} · Peak Queue: {bfsResult.peakAuxiliarySize}
              </span>
            </div>
            <div className="font-mono text-sm font-semibold text-cyan-700 dark:text-cyan-300 break-words">
              {step.visitedIds.length > 0
                ? step.visitedIds.map((id) => idToLabel.get(id) ?? id).join(' → ')
                : 'No vertices visited yet'}
            </div>
          </div>
        </div>

        {/* Right Deck: Dynamic Step Explanation, FIFO Queue State, Unvisited Set, Pseudocode */}
        <div className="xl:col-span-5 space-y-4">
          {/* Dynamic Step Explanation */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Live Step Explanation</span>
              <span className="font-mono tabular-nums">
                Step {step.stepIndex} of {bfsResult.steps.length - 1}
              </span>
            </div>
            <h2 className="text-base font-display font-bold text-slate-900 dark:text-slate-100">
              {step.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {step.explanation}
            </p>
          </div>

          {/* FIFO Queue State */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-display font-bold text-slate-900 dark:text-slate-100">
                FIFO Queue State (Front → Rear)
              </span>
              <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                Size: {step.queue.length}
              </span>
            </div>

            {step.queue.length === 0 ? (
              <div className="py-3 px-3 rounded-lg bg-slate-50 dark:bg-[#0D1526] text-xs font-mono text-slate-500 dark:text-slate-400">
                Queue is currently empty [ ]
              </div>
            ) : (
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 shrink-0">
                  FRONT →
                </span>
                {step.queue.map((label, idx) => (
                  <div
                    key={`${label}-${idx}`}
                    className="h-9 min-w-9 px-2.5 inline-flex items-center justify-center rounded-lg border border-cyan-500/50 bg-cyan-50 dark:bg-cyan-950/50 font-mono text-xs font-bold text-cyan-800 dark:text-cyan-200 shrink-0"
                  >
                    {label}
                  </div>
                ))}
                <span className="text-[11px] font-mono text-slate-400 shrink-0">
                  ← REAR
                </span>
              </div>
            )}

            {/* Visited vs Unvisited Vertices */}
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

          {/* BFS Pseudocode with Active Line Highlight */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-display font-bold text-slate-900 dark:text-slate-100">
                BFS Algorithm Pseudocode
              </span>
              <span className="font-mono text-slate-500 dark:text-slate-400">
                Time: O(V + E) · Space: O(V)
              </span>
            </div>
            <pre className="p-3 rounded-lg bg-slate-50 dark:bg-[#0D1526] text-[11.5px] font-mono leading-relaxed overflow-x-auto">
              {BFS_PSEUDOCODE.map((line, i) => {
                const lineNum = i + 1;
                const isActive = step.pseudocodeLine === lineNum;
                return (
                  <div
                    key={lineNum}
                    className={`px-2 py-0.5 rounded ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-900 dark:text-cyan-200 font-semibold'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {line}
                  </div>
                );
              })}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
