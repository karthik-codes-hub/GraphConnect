import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  GitBranch,
  GitCompare,
  Network,
  Pause,
  Play,
  Share2,
} from 'lucide-react';
import { GraphCanvas } from '../components/GraphCanvas';
import { runBFS, runDFSRecursive } from '../algorithms/traversals';
import { SAMPLE_GRAPHS } from '../data/sampleGraphs';
import { GraphData, PageId } from '../types/graph';

interface DashboardViewProps {
  activeGraph: GraphData;
  onNavigate: (page: PageId) => void;
  onOpenWalkthrough: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenWalkthrough,
}) => {
  const demoGraph = SAMPLE_GRAPHS[0].graph; // Simple Connected 7V, 8E
  const [demoMode, setDemoMode] = useState<'BFS' | 'DFS'>('BFS');
  const [autoPlay, setAutoPlay] = useState(true);
  const [stepIdx, setStepIdx] = useState(1);

  const demoResult = useMemo(() => {
    return demoMode === 'BFS'
      ? runBFS(demoGraph, demoGraph.nodes[0].id)
      : runDFSRecursive(demoGraph, demoGraph.nodes[0].id);
  }, [demoGraph, demoMode]);

  useEffect(() => {
    setStepIdx(1);
  }, [demoMode]);

  useEffect(() => {
    if (!autoPlay) return;
    const timer = window.setInterval(() => {
      setStepIdx((prev) => (prev + 1) % demoResult.steps.length);
    }, 1150);
    return () => window.clearInterval(timer);
  }, [autoPlay, demoResult.steps.length]);

  const currentStep =
    demoResult.steps[Math.min(stepIdx, demoResult.steps.length - 1)] ??
    demoResult.steps[0];

  const levelAnnotations = useMemo(() => {
    const out: Record<string, string> = {};
    for (const [nodeId, lvl] of Object.entries(currentStep.levels)) {
      out[nodeId] = demoMode === 'BFS' ? `L${lvl}` : `d=${lvl}`;
    }
    return out;
  }, [currentStep.levels, demoMode]);

  const featureCards: {
    title: string;
    kicker: string;
    description: string;
    target: PageId;
    cta: string;
    icon: React.ReactNode;
  }[] = [
    {
      title: 'Interactive Graph Builder',
      kicker: 'Visual Canvas · Edge & Matrix Parsers',
      description:
        'Construct directed or undirected, weighted or unweighted graphs by clicking on the coordinate stage, entering adjacency matrices, or loading 8 canonical presets.',
      target: 'builder',
      cta: 'Open Builder',
      icon: <Share2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
    },
    {
      title: 'BFS & DFS Visualizer',
      kicker: 'FIFO Queue · Call Stack & Explicit Stack',
      description:
        'Step forward and backward through level-order BFS waves and recursive/iterative DFS backtracking with live pseudocode tracing.',
      target: 'bfs',
      cta: 'Launch Visualizer',
      icon: <GitBranch className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
    },
    {
      title: 'Performance Analysis',
      kicker: 'Empirical O(V + E) Benchmarks · Recharts',
      description:
        'Generate sparse, dense, tree, linear, and complete graphs with seeded PRNGs and plot multi-trial averaged runtime and operation counts.',
      target: 'performance',
      cta: 'Run Benchmarks',
      icon: <BarChart3 className="w-5 h-5 text-violet-600 dark:text-violet-400" />,
    },
    {
      title: 'Algorithm Comparison',
      kicker: 'Synchronized Side-by-Side Execution',
      description:
        'Run BFS and DFS simultaneously on identical topologies to compare traversal sequences, peak frontier memory, and shortest-path guarantees.',
      target: 'comparison',
      cta: 'Compare Side-by-Side',
      icon: <GitCompare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
    },
  ];

  return (
    <div className="space-y-12 pb-10">
      {/* Hero Section: Two-Column Split with Live Animated Sample Graph */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-6 flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-7 sm:p-9">
          <div className="space-y-5">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Design & Analysis of Algorithms · Interactive Laboratory
            </div>

            <h1
              className="text-3xl sm:text-4xl xl:text-[2.55rem] font-display font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]"
              style={{ textWrap: 'balance' }}
            >
              Explore Graphs. Visualize Algorithms. Understand Connectivity.
            </h1>

            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              An interactive platform for learning, visualizing, and analyzing BFS and DFS graph traversal techniques.
            </p>
          </div>

          <div className="pt-7 space-y-4">
            {/* Primary & Secondary Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => onNavigate('builder')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <span>Start Exploring</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('bfs')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0"
              >
                <span>Learn BFS</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('dfs')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0"
              >
                <span>Learn DFS</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('comparison')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0"
              >
                <span>Compare Algorithms</span>
              </button>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span>Time Complexity: O(V + E)</span>
              <span aria-hidden="true">·</span>
              <span>Auxiliary Space: O(V)</span>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={onOpenWalkthrough}
                className="text-blue-600 dark:text-cyan-400 font-medium hover:underline"
              >
                New here? Read the 10-step walkthrough
              </button>
            </div>
          </div>
        </div>

        {/* Live Animated Sample Graph Stage */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 flex flex-col justify-between gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Live Traversal Preview · {demoGraph.nodes.length} Vertices · {demoGraph.edges.length} Edges
              </div>
              <h2 className="text-sm font-display font-bold text-slate-900 dark:text-slate-100">
                {currentStep.title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <div
                role="group"
                aria-label="Select live demo algorithm"
                className="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800/90"
              >
                <button
                  type="button"
                  onClick={() => setDemoMode('BFS')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                    demoMode === 'BFS'
                      ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  BFS Wave
                </button>
                <button
                  type="button"
                  onClick={() => setDemoMode('DFS')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                    demoMode === 'DFS'
                      ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  DFS Dive
                </button>
              </div>

              <button
                type="button"
                onClick={() => setAutoPlay((p) => !p)}
                aria-label={autoPlay ? 'Pause live sample animation' : 'Play live sample animation'}
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {autoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <GraphCanvas
            graph={demoGraph}
            heightClass="h-[310px]"
            activeNodeId={currentStep.activeNodeId}
            isBacktracking={currentStep.isBacktracking}
            visitedIds={currentStep.visitedIds}
            frontierIds={
              demoMode === 'BFS'
                ? currentStep.queue
                : currentStep.stack.map((s) => s.label)
            }
            exploringEdgeId={currentStep.exploringEdgeId}
            treeEdgeIds={currentStep.treeEdgeIds}
            nodeAnnotations={levelAnnotations}
            accentVariant={demoMode === 'BFS' ? 'cyan' : 'violet'}
          />

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/80 dark:border-slate-800">
            <span className="truncate max-w-md">{currentStep.explanation}</span>
            <span className="font-mono text-slate-800 dark:text-slate-200 tabular-nums whitespace-nowrap">
              {demoMode === 'BFS'
                ? `Queue: [${currentStep.queue.join(', ')}]`
                : `Call Stack: [${currentStep.stack.map((f) => f.label).join(' → ')}]`}
            </span>
          </div>
        </div>
      </section>

      {/* Four Primary Feature Cards */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-display font-bold text-slate-900 dark:text-slate-100">
              Core Laboratory Modules
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Four integrated environments connecting visual intuition with formal algorithm analysis.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {featureCards.map((card) => (
            <div
              key={card.title}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 flex flex-col justify-between gap-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {card.kicker}
                  </span>
                  {card.icon}
                </div>
                <h3 className="text-base font-display font-bold text-slate-900 dark:text-slate-100">
                  {card.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => onNavigate(card.target)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline whitespace-nowrap"
                >
                  <span>{card.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What Graph Connectivity Means + Project Overview */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-7 space-y-4">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Foundational Concept · Graph Theory
          </div>
          <h2 className="text-xl font-display font-bold text-slate-900 dark:text-slate-100">
            What Does Graph Connectivity Mean?
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            In mathematics and computer science, <strong>connectivity</strong> measures whether vertices in a graph{' '}
            <span className="font-mono">G = (V, E)</span> can communicate through sequences of edges called paths. Understanding connectivity tells us whether a computer network stays intact after a cable cut, whether a maze has an exit path, or how users cluster into communities.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Undirected Connectivity
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Connected if a path exists between every pair of vertices. Otherwise partitioned into disjoint Connected Components.
              </p>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Strong vs. Weak (Directed)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Strongly connected requires mutual directed paths u →* v and v →* u; weakly connected requires connectivity only when ignoring arrows.
              </p>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Reachability & Cycles
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Both BFS and DFS test reachability in O(V + E) time; BFS guarantees minimum unweighted hops while DFS exposes cycle structure.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate('connectivity')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline"
            >
              <span>Inspect Current Graph in Connectivity Analyzer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Project Objectives */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-7 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Academic Project Overview · B.Tech CSE (AI & ML)
            </div>
            <h2 className="text-xl font-display font-bold text-slate-900 dark:text-slate-100">
              Project Objectives
            </h2>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
              <li>
                <strong>01. Visual Algorithmic Mastery:</strong> Demystify FIFO queue waves (BFS) vs. LIFO stack & recursive backtracking (DFS).
              </li>
              <li>
                <strong>02. Rigorous Connectivity Diagnostics:</strong> Accurately compute components, Kosaraju SCCs, isolated vertices, reachability paths, and cycle witnesses.
              </li>
              <li>
                <strong>03. Empirical DAA Validation:</strong> Benchmark measured execution times and operation counts against theoretical O(V + E) time and O(V) auxiliary space bounds.
              </li>
              <li>
                <strong>04. Reproducible Reporting:</strong> Generate truthful academic experiment reports and exportable CSV datasets.
              </li>
            </ul>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => onNavigate('learning')}
              className="font-semibold text-blue-600 dark:text-cyan-400 hover:underline"
            >
              Explore Learning Center →
            </button>
            <button
              type="button"
              onClick={() => onNavigate('quiz')}
              className="font-semibold text-slate-700 dark:text-slate-300 hover:underline"
            >
              Take 22-Question Quiz →
            </button>
          </div>
        </div>
      </section>

      {/* How It Works + Applications */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* How It Works */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-display font-bold text-slate-900 dark:text-slate-100">
              How GraphConnect Works
            </h2>
            <Network className="w-4 h-4 text-blue-500" />
          </div>
          <ol className="space-y-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <li>
              <strong className="text-slate-900 dark:text-slate-200">01. Construct Topology:</strong> Draw vertices and edges visually, paste an adjacency list/matrix, or load a sample preset.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-slate-200">02. Step Through Traversals:</strong> Inspect the live Queue, Stack, or Recursion Depth after every single edge check.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-slate-200">03. Diagnose Structure:</strong> Audit components, shortest unweighted paths, isolated nodes, and cycles.
            </li>
            <li>
              <strong className="text-slate-900 dark:text-slate-200">04. Benchmark & Export:</strong> Run multi-trial sweeps across graph densities and export CSV results.
            </li>
          </ol>
        </div>

        {/* Real-World Applications */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-display font-bold text-slate-900 dark:text-slate-100">
                Applications of Graph Traversal
              </h2>
              <BookOpen className="w-4 h-4 text-cyan-500" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Explore 8 interactive domain case studies showing where BFS shortest-hop waves and DFS deep structural analysis power production engineering:
            </p>
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Router Connectivity · Social Degrees of Separation · Transit Routing · Web Crawlers · Maze Robotics · Compiler Dependency DAGs · Smart Campus Maps · Fire Evacuation
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('applications')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline"
          >
            <span>Explore All 8 Interactive Scenarios</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    </div>
  );
};
