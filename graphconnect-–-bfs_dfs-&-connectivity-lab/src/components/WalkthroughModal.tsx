import React from 'react';
import { ArrowRight, X } from 'lucide-react';
import { PageId } from '../types/graph';

interface WalkthroughStep {
  step: number;
  title: string;
  description: string;
  targetPage: PageId;
  actionLabel: string;
}

const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    step: 1,
    title: 'Open Graph Builder',
    description: 'Navigate to the Interactive Graph Builder workspace where you can construct custom graphs visually or through structured text inputs.',
    targetPage: 'builder',
    actionLabel: 'Go to Graph Builder',
  },
  {
    step: 2,
    title: 'Create a Graph or Select a Sample Graph',
    description: 'Click on the canvas to add vertices, click pairs of vertices to add edges, or load one of the 8 curated topologies (Connected, Disconnected, Tree, Cyclic, Complete, Sparse, Dense, Linear) in one click.',
    targetPage: 'builder',
    actionLabel: 'Try Sample Presets',
  },
  {
    step: 3,
    title: 'Select BFS or DFS',
    description: 'Open either the BFS Visualizer (queue-driven level wavefront) or DFS Visualizer (recursive call-stack or explicit LIFO stack exploration).',
    targetPage: 'bfs',
    actionLabel: 'Open BFS Visualizer',
  },
  {
    step: 4,
    title: 'Choose a Starting Vertex',
    description: 'Use the Starting Vertex selector in the control deck to pick any vertex in your active graph as the traversal root.',
    targetPage: 'bfs',
    actionLabel: 'Configure Start Vertex',
  },
  {
    step: 5,
    title: 'Click Run Visualization',
    description: 'Press Run Visualization for smooth automated playback, or step forward and backward manually at your own learning pace.',
    targetPage: 'bfs',
    actionLabel: 'Run Step-by-Step',
  },
  {
    step: 6,
    title: 'Observe the Animation & Data Structure',
    description: 'Watch how the FIFO Queue (in BFS) or LIFO Stack / Recursion Depth (in DFS) evolves alongside the highlighted active pseudocode line and dynamic explanation.',
    targetPage: 'dfs',
    actionLabel: 'Inspect DFS Stack',
  },
  {
    step: 7,
    title: 'Open Connectivity Analyzer',
    description: 'Inspect connected components, directed Strong vs. Weak connectivity, source-to-target reachability paths, isolated vertices, cycle witnesses, and graph density.',
    targetPage: 'connectivity',
    actionLabel: 'Open Connectivity Lab',
  },
  {
    step: 8,
    title: 'Compare BFS and DFS Side-by-Side',
    description: 'Launch the synchronized dual-canvas Comparison Lab to contrast BFS and DFS traversal orders, peak auxiliary memory, and edge inspection counts on the exact same graph.',
    targetPage: 'comparison',
    actionLabel: 'Compare BFS vs DFS',
  },
  {
    step: 9,
    title: 'Open Performance Lab',
    description: 'Generate configurable graphs up to hundreds of vertices, run multi-trial averaged benchmarks, and inspect 6 empirical Recharts plots against O(V + E) theory.',
    targetPage: 'performance',
    actionLabel: 'Open Performance Lab',
  },
  {
    step: 10,
    title: 'Generate & Export Experiment Results',
    description: 'Compile a structured academic experiment report with truthful measured data, print to PDF, or download benchmark tables in CSV format.',
    targetPage: 'reports',
    actionLabel: 'Open Experiment Reports',
  },
];

interface WalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: PageId) => void;
}

export const WalkthroughModal: React.FC<WalkthroughModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="walkthrough-heading"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-4xl max-h-[88vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2
              id="walkthrough-heading"
              className="text-lg font-display font-bold text-slate-900 dark:text-slate-100"
            >
              How to Use GraphConnect — 10-Step Guided Walkthrough
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Follow these steps to build graphs, visualize BFS & DFS, and run DAA experiments. Your active graph is automatically shared across all modules.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close walkthrough guide"
            className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {WALKTHROUGH_STEPS.map((item) => (
              <div
                key={item.step}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0D1526] flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="text-xs font-mono font-semibold text-blue-600 dark:text-cyan-400">
                    Step {item.step.toString().padStart(2, '0')}
                  </div>
                  <h3 className="text-sm font-display font-semibold text-slate-900 dark:text-slate-100">
                    {item.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    {item.description}
                  </p>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate(item.targetPage);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
                  >
                    <span>{item.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#0D1526]">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Tip: You can reopen this guide anytime from the top workspace bar.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors whitespace-nowrap"
          >
            Got It, Let’s Explore
          </button>
        </div>
      </div>
    </div>
  );
};
