import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, Route, RefreshCw } from 'lucide-react';
import { GraphCanvas } from '../components/GraphCanvas';
import {
  analyzeConnectivity,
  checkReachability,
} from '../algorithms/connectivity';
import { compareLabels } from '../algorithms/graphCore';
import { SAMPLE_GRAPHS } from '../data/sampleGraphs';
import { GraphData, PageId } from '../types/graph';

interface ConnectivityViewProps {
  graph: GraphData;
  onUpdateGraph: (next: GraphData, recordHistory?: boolean) => void;
  onNavigate: (page: PageId) => void;
}

export const ConnectivityView: React.FC<ConnectivityViewProps> = ({
  graph,
  onUpdateGraph,
  onNavigate,
}) => {
  const sortedNodes = useMemo(
    () => [...graph.nodes].sort((a, b) => compareLabels(a.label, b.label)),
    [graph.nodes]
  );

  const report = useMemo(() => analyzeConnectivity(graph), [graph]);

  const [highlightMode, setHighlightMode] = useState<
    'components' | 'weak-components' | 'reachability' | 'cycle'
  >('components');

  const [sourceId, setSourceId] = useState<string>(sortedNodes[0]?.id ?? '');
  const [targetId, setTargetId] = useState<string>(
    sortedNodes[sortedNodes.length - 1]?.id ?? ''
  );

  useEffect(() => {
    if (sortedNodes.length === 0) {
      setSourceId('');
      setTargetId('');
      return;
    }
    if (!sortedNodes.some((n) => n.id === sourceId)) {
      setSourceId(sortedNodes[0].id);
    }
    if (!sortedNodes.some((n) => n.id === targetId)) {
      setTargetId(sortedNodes[sortedNodes.length - 1].id);
    }
  }, [sortedNodes, sourceId, targetId]);

  useEffect(() => {
    if (!graph.directed && highlightMode === 'weak-components') {
      setHighlightMode('components');
    }
  }, [graph.directed, highlightMode]);

  const reachability = useMemo(() => {
    if (!sourceId || !targetId) return null;
    return checkReachability(graph, sourceId, targetId);
  }, [graph, sourceId, targetId]);

  const activeComponents =
    graph.directed && highlightMode === 'weak-components'
      ? report.weakComponents ?? report.components
      : report.components;

  const componentMap = useMemo(() => {
    if (highlightMode !== 'components' && highlightMode !== 'weak-components') {
      return undefined;
    }
    const map: Record<string, { index: number; color: string }> = {};
    for (const comp of activeComponents) {
      for (const nId of comp.nodeIds) {
        map[nId] = { index: comp.index, color: comp.color };
      }
    }
    return map;
  }, [highlightMode, activeComponents]);

  const degreeAnnotations = useMemo(() => {
    const out: Record<string, string> = {};
    for (const d of report.degrees) {
      out[d.nodeId] = graph.directed
        ? `in:${d.inDegree} out:${d.outDegree}`
        : `deg:${d.totalDegree}`;
    }
    return out;
  }, [report.degrees, graph.directed]);

  const loadDirectedWeakDemo = () => {
    const directedDemo: GraphData = {
      name: 'Directed Weak vs Strong Demo',
      directed: true,
      weighted: false,
      nodes: [
        { id: 'dw-a', label: 'A', x: 165, y: 145 },
        { id: 'dw-b', label: 'B', x: 300, y: 295 },
        { id: 'dw-c', label: 'C', x: 165, y: 325 },
        { id: 'dw-d', label: 'D', x: 465, y: 225 },
        { id: 'dw-e', label: 'E', x: 605, y: 225 },
      ],
      edges: [
        { id: 'dwe-1', source: 'dw-a', target: 'dw-b', weight: 1 },
        { id: 'dwe-2', source: 'dw-b', target: 'dw-c', weight: 1 },
        { id: 'dwe-3', source: 'dw-c', target: 'dw-a', weight: 1 },
        { id: 'dwe-4', source: 'dw-b', target: 'dw-d', weight: 1 },
        { id: 'dwe-5', source: 'dw-d', target: 'dw-e', weight: 1 },
      ],
    };
    onUpdateGraph(directedDemo, true);
    setHighlightMode('components');
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header & Quick Scenario Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Structural Diagnostics · Components · Reachability · Cycles · Density
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">
            Graph Connectivity Analyzer
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Inspect mathematical connectivity, component partitions, shortest unweighted source-to-target paths, isolated vertices, cycle witnesses, and degree distributions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              const disc = SAMPLE_GRAPHS.find((s) => s.id === 'disconnected');
              if (disc) onUpdateGraph(JSON.parse(JSON.stringify(disc.graph)), true);
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            Load Disconnected Sample
          </button>
          <button
            type="button"
            onClick={loadDirectedWeakDemo}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            Load Directed SCC vs WCC Demo
          </button>
          <button
            type="button"
            onClick={() => onNavigate('builder')}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold whitespace-nowrap"
          >
            Edit Graph
          </button>
        </div>
      </div>

      {/* Primary Connectivity Verdict Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {report.isConnected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-slate-100">
              {report.connectivityLabel}
            </h2>
          </div>

          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
            {graph.directed ? 'Directed Graph' : 'Undirected Graph'} · |V| = {report.vertexCount} · |E| = {report.edgeCount} · Density = {report.density.toFixed(3)} ({report.densityClassification})
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {report.connectivityExplanation}
        </p>

        {graph.directed && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-6 text-xs text-slate-600 dark:text-slate-400">
            <div>
              <strong className="text-slate-900 dark:text-slate-200">
                Strong Connectivity (Kosaraju DFS):
              </strong>{' '}
              {report.isStronglyConnected ? 'Yes (1 SCC)' : `No (${report.components.length} SCCs)`}
            </div>
            <div>
              <strong className="text-slate-900 dark:text-slate-200">
                Weak Connectivity (Underlying Undirected):
              </strong>{' '}
              {report.isWeaklyConnected
                ? 'Yes (1 Weak Component)'
                : `No (${report.weakComponents?.length ?? 0} Weak Components)`}
            </div>
          </div>
        )}
      </div>

      {/* Main Two-Column Analytical Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Highlightable Graph Stage + Structural Metrics */}
        <div className="xl:col-span-7 space-y-5">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-display font-bold text-slate-900 dark:text-slate-100">
                  Visual Overlay Mode
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Click any mode to highlight on graph
                </span>
              </div>

              <div
                role="group"
                aria-label="Connectivity canvas overlay mode"
                className="inline-flex flex-wrap p-1 rounded-lg bg-slate-100 dark:bg-slate-800 gap-1"
              >
                <button
                  type="button"
                  onClick={() => setHighlightMode('components')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                    highlightMode === 'components'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {graph.directed ? 'Strong Components (SCC)' : 'Connected Components'}
                </button>

                {graph.directed && (
                  <button
                    type="button"
                    onClick={() => setHighlightMode('weak-components')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                      highlightMode === 'weak-components'
                        ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Weak Components (WCC)
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setHighlightMode('reachability')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                    highlightMode === 'reachability'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Reachability Path
                </button>

                <button
                  type="button"
                  onClick={() => setHighlightMode('cycle')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                    highlightMode === 'cycle'
                      ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Cycle Witness
                </button>
              </div>
            </div>

            <GraphCanvas
              graph={graph}
              componentMap={componentMap}
              highlightedPathNodeIds={
                highlightMode === 'reachability' && reachability?.reachable
                  ? reachability.pathNodeIds
                  : highlightMode === 'cycle' && report.cycle.hasCycle
                  ? report.cycle.cycleNodeIds
                  : []
              }
              highlightedPathEdgeIds={
                highlightMode === 'reachability' && reachability?.reachable
                  ? reachability.pathEdgeIds
                  : []
              }
              cycleEdgeIds={
                highlightMode === 'cycle' && report.cycle.hasCycle
                  ? report.cycle.cycleEdgeIds
                  : []
              }
              visitedIds={
                highlightMode === 'reachability' && reachability
                  ? reachability.exploredNodeIds
                  : []
              }
              nodeAnnotations={degreeAnnotations}
              accentVariant="emerald"
            />
          </div>

          {/* Graph Structure & Vertex Degrees Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-display font-bold text-slate-900 dark:text-slate-100">
                Graph Structure & Vertex Degree Distribution
              </h2>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                Density Formula: {graph.directed ? 'E / [V(V-1)]' : '2E / [V(V-1)]'} ={' '}
                {report.density.toFixed(3)} ({report.densityClassification})
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0D1526]">
                <div className="text-slate-500 dark:text-slate-400">Vertex Count |V|</div>
                <div className="text-lg font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {report.vertexCount}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0D1526]">
                <div className="text-slate-500 dark:text-slate-400">Edge Count |E|</div>
                <div className="text-lg font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {report.edgeCount} / {report.maxPossibleEdges}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0D1526]">
                <div className="text-slate-500 dark:text-slate-400">Avg Vertex Degree</div>
                <div className="text-lg font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {report.averageDegree.toFixed(2)}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0D1526]">
                <div className="text-slate-500 dark:text-slate-400">Topology Density</div>
                <div className="text-lg font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {report.densityClassification}
                </div>
              </div>
            </div>

            {report.degrees.length > 0 && (
              <div className="overflow-x-auto max-h-56">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                      <th className="py-2 pr-3 font-semibold">Vertex</th>
                      {graph.directed ? (
                        <>
                          <th className="py-2 px-3 font-semibold text-right">In-Degree</th>
                          <th className="py-2 px-3 font-semibold text-right">Out-Degree</th>
                          <th className="py-2 pl-3 font-semibold text-right">Total Degree</th>
                        </>
                      ) : (
                        <th className="py-2 pl-3 font-semibold text-right">Degree deg(v)</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 font-mono tabular-nums">
                    {report.degrees.map((d) => (
                      <tr key={d.nodeId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2 pr-3 font-semibold text-slate-900 dark:text-slate-100">
                          {d.label}
                          {d.totalDegree === 0 ? ' (Isolated)' : ''}
                        </td>
                        {graph.directed ? (
                          <>
                            <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-300">
                              {d.inDegree}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-300">
                              {d.outDegree}
                            </td>
                            <td className="py-2 pl-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                              {d.totalDegree}
                            </td>
                          </>
                        ) : (
                          <td className="py-2 pl-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                            {d.totalDegree}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Reachability Tester, Components Breakdown, Isolated Vertices, Cycle Detection */}
        <div className="xl:col-span-5 space-y-5">
          {/* C. Reachability & Shortest Path Explorer */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-display font-bold text-slate-900 dark:text-slate-100">
                Source-to-Destination Reachability
              </h2>
              <Route className="w-4 h-4 text-emerald-500" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="reach-source-select"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
                >
                  Source Vertex (s)
                </label>
                <select
                  id="reach-source-select"
                  value={sourceId}
                  onChange={(e) => {
                    setSourceId(e.target.value);
                    setHighlightMode('reachability');
                  }}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-slate-100"
                >
                  {sortedNodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="reach-target-select"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
                >
                  Destination Vertex (t)
                </label>
                <select
                  id="reach-target-select"
                  value={targetId}
                  onChange={(e) => {
                    setTargetId(e.target.value);
                    setHighlightMode('reachability');
                  }}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-slate-100"
                >
                  {sortedNodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {reachability && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0D1526] space-y-2 text-xs">
                <div className="flex items-center justify-between font-semibold">
                  <span
                    className={
                      reachability.reachable
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }
                  >
                    {reachability.reachable
                      ? `Path Exists (${reachability.hopCount} hop${reachability.hopCount === 1 ? '' : 's'})`
                      : 'Unreachable (No Valid Path)'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setHighlightMode('reachability')}
                    className="text-blue-600 dark:text-cyan-400 hover:underline"
                  >
                    Highlight on Canvas
                  </button>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {reachability.explanation}
                </p>
                <div className="text-slate-500 dark:text-slate-400 font-mono">
                  BFS Exploration Trail: {reachability.exploredLabels.join(' → ')}
                </div>
              </div>
            )}
          </div>

          {/* B. Connected Components Partition */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-display font-bold text-slate-900 dark:text-slate-100">
                {graph.directed
                  ? highlightMode === 'weak-components'
                    ? `Weakly Connected Components (${activeComponents.length})`
                    : `Strongly Connected Components (${activeComponents.length})`
                  : `Connected Components (${activeComponents.length})`}
              </h2>
              <button
                type="button"
                onClick={() =>
                  setHighlightMode(
                    highlightMode === 'weak-components' ? 'weak-components' : 'components'
                  )
                }
                className="text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline"
              >
                Show Colors
              </button>
            </div>

            {activeComponents.length === 0 ? (
              <p className="text-xs text-slate-500">No components in empty graph.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {activeComponents.map((comp) => (
                  <div
                    key={comp.index}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0D1526] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="inline-flex items-center justify-center h-6 px-2 rounded font-mono font-bold text-white text-[11px]"
                        style={{ backgroundColor: comp.color }}
                      >
                        C{comp.index}
                      </span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">
                        {`{ ${comp.labels.join(', ')} }`}
                      </span>
                    </div>
                    <span className="text-slate-500 dark:text-slate-400 font-mono tabular-nums shrink-0">
                      {comp.nodeIds.length}V
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* D. Isolated Vertices & E. Cycle Detection */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
            <div className="space-y-1.5">
              <h2 className="text-base font-display font-bold text-slate-900 dark:text-slate-100">
                Isolated Vertices ({report.isolatedVertices.length})
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {report.isolatedVertices.length === 0
                  ? 'No isolated vertices found — every vertex has at least one incident edge.'
                  : `Vertices with zero incident edges: ${report.isolatedVertices
                      .map((v) => v.label)
                      .join(', ')}.`}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-display font-bold text-slate-900 dark:text-slate-100">
                  Cycle Detection ({graph.directed ? '3-Color DFS' : 'Parent-Tracked DFS'})
                </h2>
                <RefreshCw className="w-4 h-4 text-slate-400" />
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {report.cycle.explanation}
              </p>

              {report.cycle.hasCycle && (
                <button
                  type="button"
                  onClick={() => setHighlightMode('cycle')}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
                >
                  Highlight Cycle Edges ({report.cycle.cycleLabels.join(graph.directed ? ' → ' : ' — ')})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
