import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, Play, Shuffle } from 'lucide-react';
import {
  exportBenchmarksToCSV,
  FullBenchmarkSuiteResult,
  runBenchmarkSuite,
} from '../algorithms/benchmark';
import { GeneratedGraphType } from '../types/graph';

export const PerformanceView: React.FC = () => {
  const [baseVertices, setBaseVertices] = useState(80);
  const [baseDensity, setBaseDensity] = useState(0.35);
  const [graphType, setGraphType] = useState<GeneratedGraphType>('random');
  const [directed, setDirected] = useState(false);
  const [seed, setSeed] = useState(2026);
  const [trials, setTrials] = useState(6);

  const [suite, setSuite] = useState<FullBenchmarkSuiteResult>(() =>
    runBenchmarkSuite({
      baseVertices: 80,
      baseDensity: 0.35,
      graphType: 'random',
      directed: false,
      seed: 2026,
      trials: 6,
    })
  );

  const estimatedEdges = useMemo(() => {
    const maxE = directed
      ? baseVertices * (baseVertices - 1)
      : (baseVertices * (baseVertices - 1)) / 2;
    if (graphType === 'linear' || graphType === 'tree') return Math.max(0, baseVertices - 1);
    if (graphType === 'complete') return maxE;
    if (graphType === 'sparse') return Math.min(maxE, Math.round(baseVertices * 1.25));
    if (graphType === 'dense') return Math.round(maxE * 0.72);
    return Math.round(maxE * baseDensity);
  }, [baseVertices, baseDensity, graphType, directed]);

  const handleRunSuite = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const nextSuite = runBenchmarkSuite({
      baseVertices,
      baseDensity,
      graphType,
      directed,
      seed,
      trials,
    });
    setSuite(nextSuite);
  };

  const handleDownloadCSV = () => {
    const allRows = [
      ...suite.vertexScaling,
      ...suite.edgeScaling,
      ...suite.densityScaling,
      ...suite.topologyComparison,
    ];
    const csv = exportBenchmarksToCSV(allRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `graphconnect_benchmarks_seed_${seed}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Empirical DAA Laboratory · Multi-Trial Averaged Benchmarks · Recharts
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">
            Performance Analysis Lab
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
            Generate actual graphs with deterministic seeds, run JIT warm-up passes, execute repeated BFS and DFS trials, and compare measured browser runtimes and primitive operation counts against O(V + E) asymptotic bounds.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadCSV}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Download CSV Dataset</span>
        </button>
      </div>

      {/* Benchmark Configuration Form */}
      <form
        onSubmit={handleRunSuite}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          <div>
            <label
              htmlFor="perf-graph-type"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
            >
              Graph Topology
            </label>
            <select
              id="perf-graph-type"
              value={graphType}
              onChange={(e) => setGraphType(e.target.value as GeneratedGraphType)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
            >
              <option value="random">Random Graph</option>
              <option value="sparse">Sparse Graph</option>
              <option value="dense">Dense Graph</option>
              <option value="linear">Linear Graph</option>
              <option value="tree">Tree Graph</option>
              <option value="complete">Complete Graph</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="perf-vertices"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
            >
              Base Vertices |V|:{' '}
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {baseVertices}
              </span>
            </label>
            <input
              id="perf-vertices"
              type="range"
              min={20}
              max={220}
              step={10}
              value={baseVertices}
              onChange={(e) => setBaseVertices(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          <div>
            <label
              htmlFor="perf-density"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
            >
              Density:{' '}
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {baseDensity.toFixed(2)} (~{estimatedEdges}E)
              </span>
            </label>
            <input
              id="perf-density"
              type="range"
              min={0.1}
              max={0.95}
              step={0.05}
              value={baseDensity}
              onChange={(e) => setBaseDensity(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          <div>
            <label
              htmlFor="perf-seed"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
            >
              Random Seed
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id="perf-seed"
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value) || 1)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-slate-100"
              />
              <button
                type="button"
                aria-label="Randomize seed"
                title="Randomize Seed"
                onClick={() => setSeed(Math.floor(Math.random() * 9000) + 1000)}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="perf-trials"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
            >
              Trials Averaged:{' '}
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {trials}
              </span>
            </label>
            <input
              id="perf-trials"
              type="range"
              min={3}
              max={15}
              step={1}
              value={trials}
              onChange={(e) => setTrials(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Run Benchmark</span>
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <label className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={directed}
              onChange={(e) => setDirected(e.target.checked)}
              className="rounded accent-blue-600"
            />
            <span>Generate Directed Graphs</span>
          </label>

          <div className="font-mono text-slate-600 dark:text-slate-300 tabular-nums">
            Current Config Snapshot ({suite.singleExperiment.vertices}V,{' '}
            {suite.singleExperiment.edges}E): BFS = {suite.singleExperiment.bfsTimeMs}ms (Peak Q:{' '}
            {suite.singleExperiment.bfsPeakQueue}) · DFS ={' '}
            {suite.singleExperiment.dfsRecursiveTimeMs}ms (Max Depth:{' '}
            {suite.singleExperiment.dfsPeakDepth})
          </div>
        </div>
      </form>

      {/* Six Analytical Recharts Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Number of Vertices vs Execution Time */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
          <div>
            <h2 className="text-sm font-display font-bold text-slate-900 dark:text-slate-100">
              01. Number of Vertices (|V|) vs. Execution Time (ms)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Averaged across {trials} trials per point after JIT warm-up ({graphType} topology).
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={suite.vertexScaling}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
                <XAxis dataKey="vertices" tick={{ fontSize: 11 }} />
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
                <Line
                  type="monotone"
                  dataKey="bfsTimeMs"
                  name="BFS Time (ms)"
                  stroke="#06B6D4"
                  strokeWidth={2.5}
                  dot={{ r: 3.5 }}
                />
                <Line
                  type="monotone"
                  dataKey="dfsRecursiveTimeMs"
                  name="DFS Recursive (ms)"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  dot={{ r: 3.5 }}
                />
                <Line
                  type="monotone"
                  dataKey="dfsIterativeTimeMs"
                  name="DFS Iterative (ms)"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Number of Edges vs Execution Time */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
          <div>
            <h2 className="text-sm font-display font-bold text-slate-900 dark:text-slate-100">
              02. Number of Edges (|E|) vs. Execution Time (ms)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Holding |V| fixed while scaling |E| demonstrates linear O(E) edge-scan growth.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={suite.edgeScaling}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
                <XAxis dataKey="edges" tick={{ fontSize: 11 }} />
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
                <Line
                  type="monotone"
                  dataKey="bfsTimeMs"
                  name="BFS Time (ms)"
                  stroke="#06B6D4"
                  strokeWidth={2.5}
                />
                <Line
                  type="monotone"
                  dataKey="dfsRecursiveTimeMs"
                  name="DFS Time (ms)"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Graph Density vs Execution Time */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
          <div>
            <h2 className="text-sm font-display font-bold text-slate-900 dark:text-slate-100">
              03. Graph Density vs. Execution Time (ms)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Density sweeps from 0.10 (sparse) to 0.95 (near-complete).
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={suite.densityScaling}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
                <XAxis dataKey="density" tick={{ fontSize: 11 }} />
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
                <Line
                  type="monotone"
                  dataKey="bfsTimeMs"
                  name="BFS Time (ms)"
                  stroke="#06B6D4"
                  strokeWidth={2.5}
                />
                <Line
                  type="monotone"
                  dataKey="dfsRecursiveTimeMs"
                  name="DFS Time (ms)"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. BFS vs DFS Runtime Comparison across Topologies */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
          <div>
            <h2 className="text-sm font-display font-bold text-slate-900 dark:text-slate-100">
              04. BFS vs. DFS Runtime Comparison by Graph Type
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Direct side-by-side runtime (ms) across Sparse, Dense, Random, Linear, Tree, and Complete graphs.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={suite.topologyComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
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
                <Bar dataKey="bfsTimeMs" name="BFS (ms)" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="dfsRecursiveTimeMs"
                  name="DFS Recursive (ms)"
                  fill="#8B5CF6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Number of Vertices Visited Comparison */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
          <div>
            <h2 className="text-sm font-display font-bold text-slate-900 dark:text-slate-100">
              05. Number of Vertices Visited by Both Algorithms
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              From an identical starting vertex, both BFS and DFS reach the exact same connected component size.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={suite.topologyComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
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
                <Bar
                  dataKey="bfsVisited"
                  name="BFS Visited Vertices"
                  fill="#0EA5E9"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="dfsVisited"
                  name="DFS Visited Vertices"
                  fill="#A855F7"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6. Primitive Operations Count Comparison */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
          <div>
            <h2 className="text-sm font-display font-bold text-slate-900 dark:text-slate-100">
              06. Exact Primitive Operations Count Comparison (V + E Work)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Noise-free deterministic count of queue/stack ops plus neighbor inspections across vertex scales.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={suite.vertexScaling}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="bfsOperations"
                  name="BFS Operations"
                  fill="#06B6D4"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="dfsOperations"
                  name="DFS Operations"
                  fill="#8B5CF6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Theoretical Complexity & Measurement Caveat Note */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-4">
        <h2 className="text-lg font-display font-bold text-slate-900 dark:text-slate-100">
          Theoretical Complexity vs. Empirical Runtime Interpretation
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-mono">
              Time Complexity: O(V + E)
            </h3>
            <p>
              For an Adjacency List representation, both BFS and DFS visit each reachable vertex at most once — <span className="font-mono">O(V)</span> — and scan each incident adjacency entry once (<span className="font-mono">E</span> entries in directed graphs, <span className="font-mono">2E</span> in undirected graphs) — <span className="font-mono">O(E)</span>. Chart 06 confirms this exact <span className="font-mono">Θ(V + E)</span> operation count empirically.
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-mono">
              Auxiliary Space: O(V)
            </h3>
            <p>
              Both algorithms maintain a <span className="font-mono">visited</span> set of up to <span className="font-mono">V</span> vertices. Additionally, BFS allocates up to <span className="font-mono">O(V)</span> queue slots (peaking on wide star/complete graphs), whereas DFS allocates up to <span className="font-mono">O(V)</span> stack frames (peaking on long chordless paths).
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Experimental Measurement Notes
            </h3>
            <p>
              Browser <span className="font-mono">performance.now()</span> timers are clamped to coarse microsecond/millisecond precision for security (Spectre mitigation) and are influenced by JavaScript JIT compilation, garbage collection, and OS scheduling. Therefore, very small graphs (&lt;50V) exhibit timer quantization noise; inspect multi-trial averages at larger scales alongside Chart 06’s exact operation counts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
