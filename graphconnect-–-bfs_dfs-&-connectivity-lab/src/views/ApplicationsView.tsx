import React, { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { GraphCanvas } from '../components/GraphCanvas';
import { runBFS, runDFSRecursive } from '../algorithms/traversals';
import { REAL_WORLD_APPLICATIONS } from '../data/lessonsAndApps';
import { GraphData, PageId } from '../types/graph';

interface ApplicationsViewProps {
  onLoadGraphAndNavigate: (graph: GraphData, target: PageId) => void;
}

export const ApplicationsView: React.FC<ApplicationsViewProps> = ({
  onLoadGraphAndNavigate,
}) => {
  const [selectedId, setSelectedId] = useState<string>(
    REAL_WORLD_APPLICATIONS[0].id
  );
  const [previewAlgo, setPreviewAlgo] = useState<'BFS' | 'DFS'>('BFS');

  const activeApp =
    REAL_WORLD_APPLICATIONS.find((a) => a.id === selectedId) ??
    REAL_WORLD_APPLICATIONS[0];

  const previewTraversal = useMemo(() => {
    const g = activeApp.scenarioGraph;
    const startId = g.nodes[0]?.id ?? null;
    return previewAlgo === 'BFS'
      ? runBFS(g, startId, false)
      : runDFSRecursive(g, startId, false);
  }, [activeApp, previewAlgo]);

  return (
    <div className="space-y-8 pb-10">
      <div className="space-y-1.5">
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Applied Graph Engineering · 8 Interactive Case Studies
        </div>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">
          Real-World Applications of BFS & DFS
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
          <strong>Key Principle:</strong> Breadth-First Search guarantees <em>shortest hop paths</em> in unweighted graphs and models expanding wavefronts, whereas Depth-First Search excels at <em>exhaustive path exploration, backtracking, cycle detection, and structural decomposition</em>.
        </p>
      </div>

      {/* Selector Grid for all 8 Applications */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {REAL_WORLD_APPLICATIONS.map((app, idx) => {
          const isSelected = app.id === activeApp.id;
          return (
            <button
              key={app.id}
              type="button"
              onClick={() => setSelectedId(app.id)}
              className={`text-left p-4 rounded-xl border transition-colors ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                0{idx + 1} · {app.domain}
              </div>
              <div className="text-sm font-display font-bold text-slate-900 dark:text-slate-100 mt-1">
                {app.title}
              </div>
            </button>
          );
        })}
      </div>

      {/* Detailed Interactive Case Study */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-5">
          <div>
            <div className="text-xs font-mono text-blue-600 dark:text-cyan-400 font-semibold">
              {activeApp.domain} · Recommended Primary: {activeApp.recommendedPrimary}
            </div>
            <h2 className="text-xl font-display font-bold text-slate-900 dark:text-slate-100 mt-1">
              {activeApp.title}
            </h2>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Real-World Problem
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {activeApp.problem}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Graph Representation G = (V, E)
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {activeApp.graphRepresentation}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0D1526] space-y-1">
                <h4 className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-400">
                  How BFS Helps
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {activeApp.howBFSHelps}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0D1526] space-y-1">
                <h4 className="text-xs font-mono font-bold text-violet-700 dark:text-violet-400">
                  How DFS Helps
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {activeApp.howDFSHelps}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() =>
                onLoadGraphAndNavigate(
                  JSON.parse(JSON.stringify(activeApp.scenarioGraph)),
                  'comparison'
                )
              }
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold whitespace-nowrap"
            >
              <span>Load Scenario in Side-by-Side Comparison Lab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() =>
                onLoadGraphAndNavigate(
                  JSON.parse(JSON.stringify(activeApp.scenarioGraph)),
                  'connectivity'
                )
              }
              className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              Inspect Connectivity
            </button>
          </div>
        </div>

        {/* Interactive Scenario Topology Preview */}
        <div className="xl:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Interactive Scenario Preview
              </div>
              <h3 className="text-sm font-display font-bold text-slate-900 dark:text-slate-100">
                {activeApp.scenarioGraph.name}
              </h3>
            </div>

            <div className="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setPreviewAlgo('BFS')}
                className={`px-3 py-1 rounded-md text-xs font-semibold ${
                  previewAlgo === 'BFS'
                    ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Simulate BFS
              </button>
              <button
                type="button"
                onClick={() => setPreviewAlgo('DFS')}
                className={`px-3 py-1 rounded-md text-xs font-semibold ${
                  previewAlgo === 'DFS'
                    ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Simulate DFS
              </button>
            </div>
          </div>

          <GraphCanvas
            graph={activeApp.scenarioGraph}
            heightClass="h-[340px]"
            visitedIds={previewTraversal.traversalOrder}
            treeEdgeIds={previewTraversal.treeEdgeIds}
            accentVariant={previewAlgo === 'BFS' ? 'cyan' : 'violet'}
          />

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0D1526] text-xs space-y-1">
            <div className="text-slate-500 dark:text-slate-400">
              Resulting {previewAlgo} Discovery Sequence (starting at{' '}
              {activeApp.scenarioGraph.nodes[0]?.label}):
            </div>
            <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
              {previewTraversal.traversalLabels.join(' → ')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
