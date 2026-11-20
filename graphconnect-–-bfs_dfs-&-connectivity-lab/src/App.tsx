import React, { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  Compass,
  FileSpreadsheet,
  GitBranch,
  GitCompare,
  HelpCircle,
  LayoutDashboard,
  Menu,
  Moon,
  Network,
  Share2,
  Sun,
  Workflow,
  X,
} from 'lucide-react';
import { WalkthroughModal } from './components/WalkthroughModal';
import { SAMPLE_GRAPHS } from './data/sampleGraphs';
import { GraphData, PageId } from './types/graph';
import { ApplicationsView } from './views/ApplicationsView';
import { BFSVisualizerView } from './views/BFSVisualizerView';
import { ComparisonView } from './views/ComparisonView';
import { ConnectivityView } from './views/ConnectivityView';
import { DashboardView } from './views/DashboardView';
import { DFSVisualizerView } from './views/DFSVisualizerView';
import { ExperimentReportView } from './views/ExperimentReportView';
import { GraphBuilderView } from './views/GraphBuilderView';
import { LearningCenterView } from './views/LearningCenterView';
import { PerformanceView } from './views/PerformanceView';
import { QuizView } from './views/QuizView';

const ACTIVE_GRAPH_STORAGE_KEY = 'graphconnect_active_graph_v1';
const THEME_STORAGE_KEY = 'graphconnect_theme_v1';

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'builder', label: 'Graph Builder', icon: <Share2 className="w-4 h-4" /> },
  { id: 'bfs', label: 'BFS Visualizer', icon: <Workflow className="w-4 h-4" /> },
  { id: 'dfs', label: 'DFS Visualizer', icon: <GitBranch className="w-4 h-4" /> },
  { id: 'connectivity', label: 'Connectivity Analyzer', icon: <Network className="w-4 h-4" /> },
  { id: 'comparison', label: 'BFS vs DFS Comparison', icon: <GitCompare className="w-4 h-4" /> },
  { id: 'performance', label: 'Performance Analysis', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'learning', label: 'Learning Center', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'applications', label: 'Real-World Applications', icon: <Compass className="w-4 h-4" /> },
  { id: 'quiz', label: 'Practice & Quiz', icon: <ClipboardCheck className="w-4 h-4" /> },
  { id: 'reports', label: 'Experiment Reports', icon: <FileSpreadsheet className="w-4 h-4" /> },
];

export default function App() {
  const [activePage, setActivePage] = useState<PageId>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') return 'builder';
    const p = params.get('page') as PageId | null;
    if (p && NAV_ITEMS.some((i) => i.id === p)) return p;
    return 'dashboard';
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const [graph, setGraph] = useState<GraphData>(() => {
    try {
      const raw = localStorage.getItem(ACTIVE_GRAPH_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as GraphData;
        if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
          return parsed;
        }
      }
    } catch {
      // fallback to default sample
    }
    return JSON.parse(JSON.stringify(SAMPLE_GRAPHS[0].graph));
  });

  const [past, setPast] = useState<GraphData[]>([]);
  const [future, setFuture] = useState<GraphData[]>([]);
  const preDragSnapshotRef = useRef<GraphData | null>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  const mainScrollRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_GRAPH_STORAGE_KEY, JSON.stringify(graph));
    } catch {
      // ignore
    }
  }, [graph]);

  const handleNavigate = (page: PageId) => {
    setActivePage(page);
    setMobileMenuOpen(false);
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateGraph = (next: GraphData, recordHistory = true) => {
    if (recordHistory) {
      setPast((prev) => [...prev.slice(-24), graph]);
      setFuture([]);
      preDragSnapshotRef.current = null;
    } else if (!preDragSnapshotRef.current) {
      preDragSnapshotRef.current = graph;
    }
    setGraph(next);
  };

  const handleCommitHistory = () => {
    if (preDragSnapshotRef.current) {
      const snap = preDragSnapshotRef.current;
      setPast((prev) => [...prev.slice(-24), snap]);
      setFuture([]);
      preDragSnapshotRef.current = null;
    }
  };

  const handleUndo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast((prev) => prev.slice(0, -1));
    setFuture((f) => [graph, ...f]);
    setGraph(previous);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setPast((p) => [...p, graph]);
    setGraph(next);
  };

  const handleLoadGraphAndNavigate = (nextGraph: GraphData, target: PageId) => {
    handleUpdateGraph(nextGraph, true);
    handleNavigate(target);
  };

  const currentNavLabel =
    NAV_ITEMS.find((i) => i.id === activePage)?.label ?? 'Dashboard';

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar Navigation */}
      <aside
        aria-label="Primary Sidebar Navigation"
        className="no-print hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]"
      >
        <div className="h-16 px-5 flex items-center border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => handleNavigate('dashboard')}
            className="text-lg font-display font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap"
          >
            GraphConnect
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
          <div className="font-semibold text-slate-700 dark:text-slate-300 truncate">
            Active: {graph.name}
          </div>
          <div className="font-mono tabular-nums">
            {graph.nodes.length} Vertices · {graph.edges.length} Edges ·{' '}
            {graph.directed ? 'Directed' : 'Undirected'}
          </div>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="no-print fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            aria-label="Mobile Navigation Drawer"
            className="relative z-10 w-72 max-w-[82vw] h-full flex flex-col bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-slate-800"
          >
            <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <span className="text-base font-display font-extrabold text-slate-900 dark:text-white">
                GraphConnect
              </span>
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Workspace Top Bar (Strict 1-row structure, <= 64px height) */}
        <header className="no-print h-14 sm:h-16 px-4 sm:px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden sm:inline text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">
                GraphConnect
              </span>
              <span
                aria-hidden="true"
                className="hidden sm:inline text-slate-300 dark:text-slate-700"
              >
                /
              </span>
              <span className="font-display font-bold text-slate-900 dark:text-slate-100 truncate">
                {currentNavLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setWalkthroughOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
              <span>How to Use</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              aria-label={
                theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
              }
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-700" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Scrollable Viewport */}
        <main
          ref={mainScrollRef}
          className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 sm:py-8"
        >
          <div className="max-w-7xl mx-auto">
            {activePage === 'dashboard' && (
              <DashboardView
                activeGraph={graph}
                onNavigate={handleNavigate}
                onOpenWalkthrough={() => setWalkthroughOpen(true)}
              />
            )}

            {activePage === 'builder' && (
              <GraphBuilderView
                graph={graph}
                canUndo={past.length > 0}
                canRedo={future.length > 0}
                onUpdateGraph={handleUpdateGraph}
                onCommitHistory={handleCommitHistory}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onNavigate={handleNavigate}
              />
            )}

            {activePage === 'bfs' && (
              <BFSVisualizerView graph={graph} onNavigate={handleNavigate} />
            )}

            {activePage === 'dfs' && (
              <DFSVisualizerView graph={graph} onNavigate={handleNavigate} />
            )}

            {activePage === 'connectivity' && (
              <ConnectivityView
                graph={graph}
                onUpdateGraph={handleUpdateGraph}
                onNavigate={handleNavigate}
              />
            )}

            {activePage === 'comparison' && (
              <ComparisonView graph={graph} onNavigate={handleNavigate} />
            )}

            {activePage === 'performance' && <PerformanceView />}

            {activePage === 'learning' && (
              <LearningCenterView
                onLoadGraphAndNavigate={handleLoadGraphAndNavigate}
              />
            )}

            {activePage === 'applications' && (
              <ApplicationsView
                onLoadGraphAndNavigate={handleLoadGraphAndNavigate}
              />
            )}

            {activePage === 'quiz' && <QuizView />}

            {activePage === 'reports' && (
              <ExperimentReportView workspaceGraph={graph} />
            )}

            {/* Clean Academic Footer */}
            <footer className="no-print mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div>
                GraphConnect — Interactive Graph Connectivity Analyzer & BFS/DFS Performance Laboratory
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setWalkthroughOpen(true)}
                  className="hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Walkthrough Guide
                </button>
              </div>
            </footer>
          </div>
        </main>
      </div>

      {/* 10-Step Guided Walkthrough Modal */}
      <WalkthroughModal
        isOpen={walkthroughOpen}
        onClose={() => setWalkthroughOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
}

