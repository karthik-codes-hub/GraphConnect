import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, Play, Printer } from 'lucide-react';
import { benchmarkSingleGraph, exportBenchmarksToCSV } from '../algorithms/benchmark';
import { analyzeConnectivity } from '../algorithms/connectivity';
import { compareLabels } from '../algorithms/graphCore';
import { runBFS, runDFSRecursive } from '../algorithms/traversals';
import { SAMPLE_GRAPHS } from '../data/sampleGraphs';
import { GraphData } from '../types/graph';

interface ExperimentReportViewProps {
  workspaceGraph: GraphData;
}

export const ExperimentReportView: React.FC<ExperimentReportViewProps> = ({
  workspaceGraph,
}) => {
  const [selectedSourceKey, setSelectedSourceKey] = useState<string>('workspace');
  const [algorithmScope, setAlgorithmScope] = useState<'Both' | 'BFS' | 'DFS'>(
    'Both'
  );
  const [experimentTitle, setExperimentTitle] = useState(
    'Comparative Empirical Evaluation of BFS and DFS on Graph Connectivity'
  );
  const [objective, setObjective] = useState(
    'To execute Breadth-First Search and Depth-First Search on a defined graph topology, record traversal sequences, peak auxiliary memory structures, and averaged execution metrics, and relate empirical observations to O(V + E) complexity.'
  );
  const [trialsCount, setTrialsCount] = useState(10);
  const [runCounter, setRunCounter] = useState(1);

  const selectedGraph: GraphData = useMemo(() => {
    if (selectedSourceKey === 'workspace') return workspaceGraph;
    const preset = SAMPLE_GRAPHS.find((p) => p.id === selectedSourceKey);
    return preset ? preset.graph : workspaceGraph;
  }, [selectedSourceKey, workspaceGraph]);

  const sortedNodes = useMemo(
    () => [...selectedGraph.nodes].sort((a, b) => compareLabels(a.label, b.label)),
    [selectedGraph.nodes]
  );

  const [startNodeId, setStartNodeId] = useState<string>(
    sortedNodes[0]?.id ?? ''
  );

  const effectiveStartId = useMemo(() => {
    if (sortedNodes.length === 0) return null;
    if (sortedNodes.some((n) => n.id === startNodeId)) return startNodeId;
    return sortedNodes[0].id;
  }, [sortedNodes, startNodeId]);

  // Recompute real results whenever inputs or Run Experiment is clicked
  const reportData = useMemo(() => {
    void runCounter;
    const connectivity = analyzeConnectivity(selectedGraph);
    const bfs = runBFS(selectedGraph, effectiveStartId, false);
    const dfs = runDFSRecursive(selectedGraph, effectiveStartId, false);
    const bench = benchmarkSingleGraph(
      selectedGraph,
      selectedGraph.name,
      'random',
      trialsCount
    );
    return { connectivity, bfs, dfs, bench, timestamp: new Date().toLocaleString() };
  }, [selectedGraph, effectiveStartId, trialsCount, runCounter]);

  const chartData = useMemo(() => {
    const rows = [];
    if (algorithmScope === 'Both' || algorithmScope === 'BFS') {
      rows.push({
        name: 'BFS (Queue)',
        Operations: reportData.bfs.operationsCount,
        EdgesExamined: reportData.bfs.edgesExamined,
        PeakStructure: reportData.bfs.peakAuxiliarySize,
      });
    }
    if (algorithmScope === 'Both' || algorithmScope === 'DFS') {
      rows.push({
        name: 'DFS (Recursion)',
        Operations: reportData.dfs.operationsCount,
        EdgesExamined: reportData.dfs.edgesExamined,
        PeakStructure: reportData.dfs.peakAuxiliarySize,
      });
    }
    return rows;
  }, [algorithmScope, reportData]);

  const handleExportCSV = () => {
    const csv = exportBenchmarksToCSV([reportData.bench]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `graphconnect_experiment_report.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const startLabel =
    selectedGraph.nodes.find((n) => n.id === effectiveStartId)?.label ?? 'None';

  return (
    <div className="space-y-8 pb-10">
      {/* Configuration Controls (Hidden when printing) */}
      <div className="no-print space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Reproducible DAA Lab Record · Printable Academic Format · CSV Export
            </div>
            <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">
              Experiment Report Generator
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
              Configure an experiment on your active graph or any canonical preset, execute real measurements, export CSV data, or print a structured lab report.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setRunCounter((c) => c + 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Run Experiment</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Lab Report</span>
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="exp-graph-select"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
              >
                Select Graph Input
              </label>
              <select
                id="exp-graph-select"
                value={selectedSourceKey}
                onChange={(e) => setSelectedSourceKey(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="workspace">
                  Active Workspace Graph ({workspaceGraph.name})
                </option>
                {SAMPLE_GRAPHS.map((p) => (
                  <option key={p.id} value={p.id}>
                    Preset: {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="exp-algo-select"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
              >
                Algorithm Scope
              </label>
              <select
                id="exp-algo-select"
                value={algorithmScope}
                onChange={(e) =>
                  setAlgorithmScope(e.target.value as 'Both' | 'BFS' | 'DFS')
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="Both">Both BFS & DFS</option>
                <option value="BFS">Breadth-First Search (BFS) Only</option>
                <option value="DFS">Depth-First Search (DFS) Only</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="exp-start-vertex"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
              >
                Starting Vertex
              </label>
              <select
                id="exp-start-vertex"
                value={effectiveStartId ?? ''}
                onChange={(e) => setStartNodeId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-slate-100"
              >
                {sortedNodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    Vertex {n.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="exp-trials"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
              >
                Benchmark Repetitions: {trialsCount}
              </label>
              <input
                id="exp-trials"
                type="range"
                min={3}
                max={25}
                value={trialsCount}
                onChange={(e) => setTrialsCount(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer mt-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="exp-title-input"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
              >
                Experiment Title
              </label>
              <input
                id="exp-title-input"
                type="text"
                value={experimentTitle}
                onChange={(e) => setExperimentTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label
                htmlFor="exp-obj-input"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
              >
                Experiment Objective
              </label>
              <input
                id="exp-obj-input"
                type="text"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Printable Experiment Report Sheet */}
      <article className="print-container rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-7 sm:p-10 space-y-7">
        <header className="pb-5 border-b border-slate-200 dark:border-slate-800 space-y-2">
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Design & Analysis of Algorithms · Laboratory Experiment Report · Generated {reportData.timestamp}
          </div>
          <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">
            {experimentTitle}
          </h2>
        </header>

        {/* 1. Objective & Input Configuration */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-1.5">
            <h3 className="font-display font-bold text-slate-900 dark:text-slate-100">
              01. Objective
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs sm:text-sm">
              {objective}
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="font-display font-bold text-slate-900 dark:text-slate-100">
              02. Input Graph & Configuration
            </h3>
            <dl className="grid grid-cols-2 gap-y-1.5 text-xs font-mono">
              <dt className="text-slate-500">Graph Name:</dt>
              <dd className="text-slate-900 dark:text-slate-100">{selectedGraph.name}</dd>
              <dt className="text-slate-500">Orientation / Weights:</dt>
              <dd className="text-slate-900 dark:text-slate-100">
                {selectedGraph.directed ? 'Directed' : 'Undirected'} ·{' '}
                {selectedGraph.weighted ? 'Weighted' : 'Unweighted'}
              </dd>
              <dt className="text-slate-500">Vertices |V| / Edges |E|:</dt>
              <dd className="text-slate-900 dark:text-slate-100">
                {reportData.connectivity.vertexCount}V · {reportData.connectivity.edgeCount}E
              </dd>
              <dt className="text-slate-500">Graph Density:</dt>
              <dd className="text-slate-900 dark:text-slate-100">
                {reportData.connectivity.density.toFixed(3)} ({reportData.connectivity.densityClassification})
              </dd>
              <dt className="text-slate-500">Connectivity Status:</dt>
              <dd className="text-slate-900 dark:text-slate-100">
                {reportData.connectivity.connectivityLabel}
              </dd>
              <dt className="text-slate-500">Algorithm & Root:</dt>
              <dd className="text-slate-900 dark:text-slate-100">
                {algorithmScope} from Vertex {startLabel}
              </dd>
            </dl>
          </div>
        </section>

        {/* 3. Output Traversals */}
        <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-base font-display font-bold text-slate-900 dark:text-slate-100">
            03. Output Traversal Sequences
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {(algorithmScope === 'Both' || algorithmScope === 'BFS') && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0D1526] space-y-1.5">
                <div className="font-semibold text-cyan-700 dark:text-cyan-400">
                  Breadth-First Search (FIFO Queue) Output
                </div>
                <div className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                  {reportData.bfs.traversalLabels.join(' → ') || 'Empty Graph'}
                </div>
              </div>
            )}

            {(algorithmScope === 'Both' || algorithmScope === 'DFS') && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0D1526] space-y-1.5">
                <div className="font-semibold text-violet-700 dark:text-violet-400">
                  Depth-First Search (Recursive) Output
                </div>
                <div className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                  {reportData.dfs.traversalLabels.join(' → ') || 'Empty Graph'}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 4. Measured Execution Metrics Table & Chart */}
        <section className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-base font-display font-bold text-slate-900 dark:text-slate-100">
            04. Empirical Execution Metrics ({trialsCount}-Trial Average)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="py-2 pr-4">Algorithm</th>
                  <th className="py-2 px-3 text-right">Visited |V_r|</th>
                  <th className="py-2 px-3 text-right">Edges Examined</th>
                  <th className="py-2 px-3 text-right">Operations</th>
                  <th className="py-2 px-3 text-right">Peak Queue / Depth</th>
                  <th className="py-2 pl-3 text-right">Avg Time (ms)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(algorithmScope === 'Both' || algorithmScope === 'BFS') && (
                  <tr>
                    <td className="py-2.5 pr-4 font-semibold text-slate-900 dark:text-slate-100">
                      BFS (Queue)
                    </td>
                    <td className="py-2.5 px-3 text-right">{reportData.bfs.visitedCount}</td>
                    <td className="py-2.5 px-3 text-right">{reportData.bfs.edgesExamined}</td>
                    <td className="py-2.5 px-3 text-right">{reportData.bfs.operationsCount}</td>
                    <td className="py-2.5 px-3 text-right">
                      {reportData.bfs.peakAuxiliarySize} (Queue)
                    </td>
                    <td className="py-2.5 pl-3 text-right">{reportData.bench.bfsTimeMs}</td>
                  </tr>
                )}
                {(algorithmScope === 'Both' || algorithmScope === 'DFS') && (
                  <tr>
                    <td className="py-2.5 pr-4 font-semibold text-slate-900 dark:text-slate-100">
                      DFS (Recursive)
                    </td>
                    <td className="py-2.5 px-3 text-right">{reportData.dfs.visitedCount}</td>
                    <td className="py-2.5 px-3 text-right">{reportData.dfs.edgesExamined}</td>
                    <td className="py-2.5 px-3 text-right">{reportData.dfs.operationsCount}</td>
                    <td className="py-2.5 px-3 text-right">
                      {reportData.dfs.peakAuxiliarySize} (Depth)
                    </td>
                    <td className="py-2.5 pl-3 text-right">
                      {reportData.bench.dfsRecursiveTimeMs}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="h-56 w-full no-print">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Operations" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="EdgesExamined" name="Edges Examined" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="PeakStructure" name="Peak Queue / Depth" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 5. Complexity Analysis, Data-Driven Observations & Conclusion */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="space-y-1.5">
            <h3 className="text-sm font-display font-bold text-slate-900 dark:text-slate-100">
              05. Complexity Analysis
            </h3>
            <p>
              Using an adjacency list for <span className="font-mono">|V| = {reportData.connectivity.vertexCount}</span> and{' '}
              <span className="font-mono">|E| = {reportData.connectivity.edgeCount}</span>, theoretical time complexity is{' '}
              <span className="font-mono">O(V + E)</span> and auxiliary space complexity is{' '}
              <span className="font-mono">O(V)</span> for both BFS and DFS.
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-sm font-display font-bold text-slate-900 dark:text-slate-100">
              06. Empirical Observations
            </h3>
            <p>
              Starting from vertex <span className="font-mono">{startLabel}</span>,{' '}
              {reportData.bfs.visitedCount} of {reportData.connectivity.vertexCount} vertices were reached ({reportData.connectivity.components.length} component{reportData.connectivity.components.length === 1 ? '' : 's'} detected;{' '}
              {reportData.connectivity.cycle.hasCycle ? 'cycle present' : 'acyclic'}). BFS required a peak queue of{' '}
              <span className="font-mono">{reportData.bfs.peakAuxiliarySize}</span> vertices across{' '}
              <span className="font-mono">{reportData.bfs.maxDepthOrLevel}</span> hop level(s), while Recursive DFS reached maximum call depth{' '}
              <span className="font-mono">{reportData.dfs.peakAuxiliarySize}</span>.
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-sm font-display font-bold text-slate-900 dark:text-slate-100">
              07. Conclusion
            </h3>
            <p>
              Both traversals examined all reachable adjacency entries in linear{' '}
              <span className="font-mono">O(V + E)</span> operations. BFS discovered vertices in non-decreasing unweighted hop distance, whereas DFS explored deep paths first before systematic backtracking.
            </p>
          </div>
        </section>
      </article>
    </div>
  );
};
