import React, { useEffect, useState } from 'react';
import {
  Check,
  FolderOpen,
  MousePointer,
  PlusCircle,
  Redo2,
  Save,
  Shuffle,
  Trash2,
  Undo2,
  Waypoints,
} from 'lucide-react';
import { BuilderTool, GraphCanvas } from '../components/GraphCanvas';
import {
  generateGraph,
  generateVertexLabel,
  parseAdjacencyListInput,
  parseAdjacencyMatrixInput,
  parseEdgeListInput,
  serializeToAdjacencyList,
  serializeToAdjacencyMatrix,
  serializeToEdgeList,
} from '../algorithms/graphCore';
import { SAMPLE_GRAPHS } from '../data/sampleGraphs';
import {
  GeneratedGraphType,
  GraphData,
  PageId,
  SavedGraphRecord,
} from '../types/graph';

const SAVED_GRAPHS_STORAGE_KEY = 'graphconnect_saved_graphs_v1';

interface GraphBuilderViewProps {
  graph: GraphData;
  canUndo: boolean;
  canRedo: boolean;
  onUpdateGraph: (next: GraphData, recordHistory?: boolean) => void;
  onCommitHistory: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onNavigate: (page: PageId) => void;
}

export const GraphBuilderView: React.FC<GraphBuilderViewProps> = ({
  graph,
  canUndo,
  canRedo,
  onUpdateGraph,
  onCommitHistory,
  onUndo,
  onRedo,
  onNavigate,
}) => {
  const [activeTool, setActiveTool] = useState<BuilderTool>('select');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [pendingEdgeSourceId, setPendingEdgeSourceId] = useState<string | null>(null);

  // Selected vertex rename & edge weight inputs
  const [renameValue, setRenameValue] = useState('');
  const [edgeWeightValue, setEdgeWeightValue] = useState('1');
  const [defaultNewEdgeWeight, setDefaultNewEdgeWeight] = useState(1);

  // Random generator controls
  const [randVertices, setRandVertices] = useState(8);
  const [randType, setRandType] = useState<GeneratedGraphType>('random');
  const [randDensity, setRandDensity] = useState(0.35);

  // Manual input panel state
  const [manualFormat, setManualFormat] = useState<
    'edge-list' | 'adj-list' | 'adj-matrix'
  >('edge-list');
  const [manualVCount, setManualVCount] = useState<string>(String(graph.nodes.length));
  const [manualECount, setManualECount] = useState<string>(String(graph.edges.length));
  const [manualText, setManualText] = useState<string>(() =>
    serializeToEdgeList(graph)
  );
  const [manualError, setManualError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  // Saved graphs in localStorage
  const [savedGraphs, setSavedGraphs] = useState<SavedGraphRecord[]>(() => {
    try {
      const raw = localStorage.getItem(SAVED_GRAPHS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [saveName, setSaveName] = useState(graph.name);

  useEffect(() => {
    setSaveName(graph.name);
  }, [graph.name]);

  // Sync manual panel text whenever format changes or user clicks sync
  const syncManualFromGraph = (
    targetGraph: GraphData = graph,
    fmt: 'edge-list' | 'adj-list' | 'adj-matrix' = manualFormat
  ) => {
    setManualVCount(String(targetGraph.nodes.length));
    setManualECount(String(targetGraph.edges.length));
    setManualError(null);
    if (fmt === 'edge-list') {
      setManualText(serializeToEdgeList(targetGraph));
    } else if (fmt === 'adj-list') {
      setManualText(serializeToAdjacencyList(targetGraph));
    } else {
      setManualText(serializeToAdjacencyMatrix(targetGraph));
    }
  };

  useEffect(() => {
    syncManualFromGraph(graph, manualFormat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualFormat]);

  const showBanner = (msg: string) => {
    setStatusMessage(msg);
    window.setTimeout(() => {
      setStatusMessage((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  const getNextAvailableLabel = (): string => {
    const used = new Set(graph.nodes.map((n) => n.label.toUpperCase()));
    let idx = 0;
    while (used.has(generateVertexLabel(idx))) {
      idx++;
    }
    return generateVertexLabel(idx);
  };

  const handleCanvasAddNode = (x: number, y: number) => {
    const label = getNextAvailableLabel();
    const newNode = {
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label,
      x,
      y,
    };
    const next: GraphData = {
      ...graph,
      nodes: [...graph.nodes, newNode],
    };
    onUpdateGraph(next, true);
    setSelectedNodeId(newNode.id);
    setSelectedEdgeId(null);
    setRenameValue(label);
    syncManualFromGraph(next, manualFormat);
    showBanner(`Added vertex ${label} at (${x}, ${y}).`);
  };

  const handleNodeClick = (nodeId: string) => {
    const clickedNode = graph.nodes.find((n) => n.id === nodeId);
    if (!clickedNode) return;

    if (activeTool === 'delete') {
      const next: GraphData = {
        ...graph,
        nodes: graph.nodes.filter((n) => n.id !== nodeId),
        edges: graph.edges.filter(
          (e) => e.source !== nodeId && e.target !== nodeId
        ),
      };
      onUpdateGraph(next, true);
      setSelectedNodeId(null);
      setPendingEdgeSourceId(null);
      syncManualFromGraph(next, manualFormat);
      showBanner(`Deleted vertex ${clickedNode.label} and its incident edges.`);
      return;
    }

    if (activeTool === 'add-edge') {
      if (!pendingEdgeSourceId) {
        setPendingEdgeSourceId(nodeId);
        setSelectedNodeId(nodeId);
        return;
      }
      if (pendingEdgeSourceId === nodeId) {
        setPendingEdgeSourceId(null);
        showBanner('Self-loops are disabled. Select two distinct vertices to connect.');
        return;
      }

      // Check duplicate edge
      const duplicate = graph.edges.some((e) =>
        graph.directed
          ? e.source === pendingEdgeSourceId && e.target === nodeId
          : (e.source === pendingEdgeSourceId && e.target === nodeId) ||
            (e.source === nodeId && e.target === pendingEdgeSourceId)
      );

      if (duplicate) {
        setPendingEdgeSourceId(null);
        showBanner('An edge between those vertices already exists.');
        return;
      }

      const sourceNode = graph.nodes.find((n) => n.id === pendingEdgeSourceId);
      const newEdge = {
        id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        source: pendingEdgeSourceId,
        target: nodeId,
        weight: graph.weighted ? Math.max(1, defaultNewEdgeWeight) : 1,
      };
      const next: GraphData = {
        ...graph,
        edges: [...graph.edges, newEdge],
      };
      onUpdateGraph(next, true);
      setPendingEdgeSourceId(null);
      setSelectedEdgeId(newEdge.id);
      setSelectedNodeId(null);
      setEdgeWeightValue(String(newEdge.weight));
      syncManualFromGraph(next, manualFormat);
      showBanner(
        `Connected ${sourceNode?.label ?? ''} ${graph.directed ? '→' : '—'} ${clickedNode.label}.`
      );
      return;
    }

    // Default Select mode
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    setPendingEdgeSourceId(null);
    setRenameValue(clickedNode.label);
  };

  const handleEdgeClick = (edgeId: string) => {
    const edge = graph.edges.find((e) => e.id === edgeId);
    if (!edge) return;

    if (activeTool === 'delete') {
      const next: GraphData = {
        ...graph,
        edges: graph.edges.filter((e) => e.id !== edgeId),
      };
      onUpdateGraph(next, true);
      setSelectedEdgeId(null);
      syncManualFromGraph(next, manualFormat);
      showBanner('Deleted selected edge.');
      return;
    }

    setSelectedEdgeId(edgeId);
    setSelectedNodeId(null);
    setPendingEdgeSourceId(null);
    setEdgeWeightValue(String(edge.weight));
  };

  const handleNodeMove = (nodeId: string, x: number, y: number) => {
    const next: GraphData = {
      ...graph,
      nodes: graph.nodes.map((n) => (n.id === nodeId ? { ...n, x, y } : n)),
    };
    onUpdateGraph(next, false);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNodeId) return;
    const trimmed = renameValue.trim();
    if (!/^[A-Za-z0-9_]{1,6}$/.test(trimmed)) {
      setManualError('Vertex label must be 1–6 alphanumeric characters (e.g., A, V1, Lab2).');
      return;
    }
    const conflict = graph.nodes.some(
      (n) => n.id !== selectedNodeId && n.label.toLowerCase() === trimmed.toLowerCase()
    );
    if (conflict) {
      setManualError(`Another vertex is already named "${trimmed}". Labels must be unique.`);
      return;
    }
    setManualError(null);
    const next: GraphData = {
      ...graph,
      nodes: graph.nodes.map((n) =>
        n.id === selectedNodeId ? { ...n, label: trimmed } : n
      ),
    };
    onUpdateGraph(next, true);
    syncManualFromGraph(next, manualFormat);
    showBanner(`Renamed vertex to "${trimmed}".`);
  };

  const handleEdgeWeightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEdgeId) return;
    const w = Number(edgeWeightValue);
    if (!Number.isFinite(w) || w <= 0) {
      setManualError('Edge weight must be a positive number.');
      return;
    }
    setManualError(null);
    const next: GraphData = {
      ...graph,
      weighted: true,
      edges: graph.edges.map((ed) =>
        ed.id === selectedEdgeId ? { ...ed, weight: w } : ed
      ),
    };
    onUpdateGraph(next, true);
    syncManualFromGraph(next, manualFormat);
    showBanner(`Updated edge weight to ${w}.`);
  };

  const handleApplyManualInput = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);

    if (manualFormat === 'edge-list') {
      const vParsed = manualVCount.trim() === '' ? null : Number(manualVCount);
      const eParsed = manualECount.trim() === '' ? null : Number(manualECount);
      const res = parseEdgeListInput(
        manualText,
        vParsed,
        eParsed,
        graph.directed,
        graph.weighted
      );
      if (!res.ok || !res.graph) {
        setManualError(res.error ?? 'Invalid edge list input.');
        return;
      }
      onUpdateGraph(res.graph, true);
      showBanner(
        `Built graph from Edge List (${res.graph.nodes.length}V, ${res.graph.edges.length}E).`
      );
    } else if (manualFormat === 'adj-list') {
      const res = parseAdjacencyListInput(
        manualText,
        graph.directed,
        graph.weighted
      );
      if (!res.ok || !res.graph) {
        setManualError(res.error ?? 'Invalid adjacency list input.');
        return;
      }
      onUpdateGraph(res.graph, true);
      setManualVCount(String(res.graph.nodes.length));
      setManualECount(String(res.graph.edges.length));
      showBanner(
        `Built graph from Adjacency List (${res.graph.nodes.length}V, ${res.graph.edges.length}E).`
      );
    } else {
      const res = parseAdjacencyMatrixInput(
        manualText,
        graph.directed,
        graph.weighted
      );
      if (!res.ok || !res.graph) {
        setManualError(res.error ?? 'Invalid adjacency matrix input.');
        return;
      }
      onUpdateGraph(res.graph, true);
      setManualVCount(String(res.graph.nodes.length));
      setManualECount(String(res.graph.edges.length));
      showBanner(
        `Built graph from Adjacency Matrix (${res.graph.nodes.length}V, ${res.graph.edges.length}E).`
      );
    }
  };

  const handleGenerateRandom = () => {
    const seed = Math.floor(Math.random() * 100000);
    const next = generateGraph({
      type: randType,
      vertexCount: randVertices,
      density: randDensity,
      directed: graph.directed,
      weighted: graph.weighted,
      seed,
    });
    onUpdateGraph(next, true);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    syncManualFromGraph(next, manualFormat);
    showBanner(`Generated ${next.name}.`);
  };

  const handleSaveGraph = () => {
    const cleanName = saveName.trim() || 'Untitled Graph';
    const record: SavedGraphRecord = {
      id: `saved-${Date.now()}`,
      savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      graph: { ...graph, name: cleanName },
    };
    const nextSaved = [record, ...savedGraphs].slice(0, 12);
    setSavedGraphs(nextSaved);
    try {
      localStorage.setItem(SAVED_GRAPHS_STORAGE_KEY, JSON.stringify(nextSaved));
      showBanner(`Saved "${cleanName}" to browser storage.`);
    } catch {
      setManualError('Unable to write to browser localStorage.');
    }
  };

  const handleDeleteSaved = (id: string) => {
    const nextSaved = savedGraphs.filter((s) => s.id !== id);
    setSavedGraphs(nextSaved);
    try {
      localStorage.setItem(SAVED_GRAPHS_STORAGE_KEY, JSON.stringify(nextSaved));
    } catch {
      // ignore
    }
  };

  const selectedNode = graph.nodes.find((n) => n.id === selectedNodeId) ?? null;
  const selectedEdge = graph.edges.find((e) => e.id === selectedEdgeId) ?? null;

  return (
    <div className="space-y-8 pb-10">
      {/* Header & Quick Instructions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Graph Construction Studio · Visual Stage & Matrix/List Parsers
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">
            Interactive Graph Builder
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Add vertices by clicking on the canvas (in Add Vertex mode or double-clicking anytime), connect pairs in Add Edge mode, drag to reposition, or load any preset below.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('bfs')}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors whitespace-nowrap"
          >
            Visualize in BFS →
          </button>
          <button
            type="button"
            onClick={() => onNavigate('connectivity')}
            className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors whitespace-nowrap"
          >
            Analyze Connectivity →
          </button>
        </div>
      </div>

      {/* Feedback / Confirmation / Validation Banners */}
      {statusMessage && (
        <div
          role="status"
          className="rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2.5 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center justify-between"
        >
          <span className="inline-flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-emerald-700 dark:text-emerald-300 hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {manualError && (
        <div
          role="alert"
          className="rounded-xl border border-red-300 dark:border-red-800/80 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-xs font-medium text-red-800 dark:text-red-300 flex items-center justify-between"
        >
          <span>Validation Error: {manualError}</span>
          <button
            type="button"
            onClick={() => setManualError(null)}
            className="text-red-700 dark:text-red-300 hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Split: Left = Visual Editor Stage (7 cols), Right = Manual Input & Saved Graphs (5 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Visual Graph Editor */}
        <div className="xl:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
          {/* Top Toolbar: Mode Tools + Directed/Weighted Toggles + Undo/Redo/Clear */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div
              role="group"
              aria-label="Graph editing tool modes"
              className="inline-flex flex-wrap p-1 rounded-lg bg-slate-100 dark:bg-slate-800/90 gap-1"
            >
              <button
                type="button"
                onClick={() => {
                  setActiveTool('select');
                  setPendingEdgeSourceId(null);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeTool === 'select'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <MousePointer className="w-3.5 h-3.5" />
                <span>Select / Move</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTool('add-vertex');
                  setPendingEdgeSourceId(null);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeTool === 'add-vertex'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Vertex</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTool('add-edge');
                  setPendingEdgeSourceId(null);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeTool === 'add-edge'
                    ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Waypoints className="w-3.5 h-3.5" />
                <span>Add Edge</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTool('delete');
                  setPendingEdgeSourceId(null);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeTool === 'delete'
                    ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>

            {/* Undo / Redo / Clear */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                aria-label="Undo graph change"
                title="Undo"
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onRedo}
                disabled={!canRedo}
                aria-label="Redo graph change"
                title="Redo"
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>

              {!confirmClear ? (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  disabled={graph.nodes.length === 0}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-40 whitespace-nowrap"
                >
                  Clear Graph
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const empty: GraphData = {
                        ...graph,
                        name: 'Empty Graph',
                        nodes: [],
                        edges: [],
                      };
                      onUpdateGraph(empty, true);
                      setSelectedNodeId(null);
                      setSelectedEdgeId(null);
                      setConfirmClear(false);
                      syncManualFromGraph(empty, manualFormat);
                      showBanner('Cleared all vertices and edges.');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold whitespace-nowrap"
                  >
                    Confirm Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Graph Model Toggles: Directed/Undirected & Weighted/Unweighted */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const next = { ...graph, directed: false };
                    onUpdateGraph(next, true);
                    syncManualFromGraph(next, manualFormat);
                  }}
                  className={`px-3 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                    !graph.directed
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Undirected
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = { ...graph, directed: true };
                    onUpdateGraph(next, true);
                    syncManualFromGraph(next, manualFormat);
                  }}
                  className={`px-3 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                    graph.directed
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Directed
                </button>
              </div>

              <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const next = { ...graph, weighted: false };
                    onUpdateGraph(next, true);
                    syncManualFromGraph(next, manualFormat);
                  }}
                  className={`px-3 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                    !graph.weighted
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Unweighted
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = { ...graph, weighted: true };
                    onUpdateGraph(next, true);
                    syncManualFromGraph(next, manualFormat);
                  }}
                  className={`px-3 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                    graph.weighted
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Weighted
                </button>
              </div>

              {graph.weighted && activeTool === 'add-edge' && (
                <label className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span>New Edge Weight:</span>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={defaultNewEdgeWeight}
                    onChange={(e) => setDefaultNewEdgeWeight(Number(e.target.value) || 1)}
                    className="w-16 px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
                  />
                </label>
              )}
            </div>

            <div className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              {graph.nodes.length} Vertices · {graph.edges.length} Edges
            </div>
          </div>

          {/* Contextual Hint Line */}
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {activeTool === 'add-vertex' &&
              'Click anywhere on the coordinate grid below to place a new vertex.'}
            {activeTool === 'add-edge' &&
              (pendingEdgeSourceId
                ? `Source vertex "${graph.nodes.find((n) => n.id === pendingEdgeSourceId)?.label}" selected — now click a second vertex to create an edge.`
                : 'Click a source vertex first, then click a destination vertex to connect them.')}
            {activeTool === 'select' &&
              'Drag any vertex to reposition it, click a vertex/edge to rename or edit weight, or double-click empty space to add a vertex.'}
            {activeTool === 'delete' &&
              'Click any vertex or edge on the canvas to remove it immediately.'}
          </div>

          {/* Interactive SVG Graph Canvas */}
          <GraphCanvas
            graph={graph}
            editable
            activeTool={activeTool}
            selectedNodeId={selectedNodeId}
            selectedEdgeId={selectedEdgeId}
            pendingEdgeSourceId={pendingEdgeSourceId}
            onCanvasAddNode={handleCanvasAddNode}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            onNodeMove={handleNodeMove}
            onNodeDragEnd={onCommitHistory}
          />

          {/* Selected Vertex or Edge Inspector */}
          {selectedNode && (
            <form
              onSubmit={handleRenameSubmit}
              className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center gap-2">
                <label
                  htmlFor="rename-vertex-input"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  Selected Vertex ({selectedNode.label}):
                </label>
                <input
                  id="rename-vertex-input"
                  type="text"
                  maxLength={6}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-slate-100"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold whitespace-nowrap"
                >
                  Rename Vertex
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next: GraphData = {
                    ...graph,
                    nodes: graph.nodes.filter((n) => n.id !== selectedNode.id),
                    edges: graph.edges.filter(
                      (e) => e.source !== selectedNode.id && e.target !== selectedNode.id
                    ),
                  };
                  onUpdateGraph(next, true);
                  setSelectedNodeId(null);
                  syncManualFromGraph(next, manualFormat);
                  showBanner(`Deleted vertex ${selectedNode.label}.`);
                }}
                className="px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-medium whitespace-nowrap"
              >
                Delete Vertex
              </button>
            </form>
          )}

          {selectedEdge && (
            <form
              onSubmit={handleEdgeWeightSubmit}
              className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center gap-2">
                <label
                  htmlFor="edit-edge-weight-input"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  Selected Edge (
                  {graph.nodes.find((n) => n.id === selectedEdge.source)?.label}{' '}
                  {graph.directed ? '→' : '—'}{' '}
                  {graph.nodes.find((n) => n.id === selectedEdge.target)?.label}
                  ) Weight:
                </label>
                <input
                  id="edit-edge-weight-input"
                  type="number"
                  min={1}
                  step="any"
                  value={edgeWeightValue}
                  onChange={(e) => setEdgeWeightValue(e.target.value)}
                  className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-slate-100"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold whitespace-nowrap"
                >
                  Update Weight
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next: GraphData = {
                    ...graph,
                    edges: graph.edges.filter((e) => e.id !== selectedEdge.id),
                  };
                  onUpdateGraph(next, true);
                  setSelectedEdgeId(null);
                  syncManualFromGraph(next, manualFormat);
                  showBanner('Deleted selected edge.');
                }}
                className="px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-medium whitespace-nowrap"
              >
                Delete Edge
              </button>
            </form>
          )}

          {/* Random Graph Generator Strip */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label
                  htmlFor="rand-type-select"
                  className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1"
                >
                  Generator Topology
                </label>
                <select
                  id="rand-type-select"
                  value={randType}
                  onChange={(e) => setRandType(e.target.value as GeneratedGraphType)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="random">Random Erdos-Renyi</option>
                  <option value="sparse">Sparse Connected</option>
                  <option value="dense">Dense Cluster</option>
                  <option value="tree">Hierarchical Tree</option>
                  <option value="linear">Linear Path</option>
                  <option value="cyclic">Cyclic Ring</option>
                  <option value="complete">Complete Graph</option>
                  <option value="disconnected">Disconnected Multi-Cluster</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="rand-v-slider"
                  className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1"
                >
                  Vertices:{' '}
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                    {randVertices}
                  </span>
                </label>
                <input
                  id="rand-v-slider"
                  type="range"
                  min={3}
                  max={18}
                  value={randVertices}
                  onChange={(e) => setRandVertices(Number(e.target.value))}
                  className="w-28 accent-blue-600 cursor-pointer"
                />
              </div>

              {randType === 'random' && (
                <div>
                  <label
                    htmlFor="rand-density-slider"
                    className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1"
                  >
                    Density:{' '}
                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                      {Math.round(randDensity * 100)}%
                    </span>
                  </label>
                  <input
                    id="rand-density-slider"
                    type="range"
                    min={0.15}
                    max={0.9}
                    step={0.05}
                    value={randDensity}
                    onChange={(e) => setRandDensity(Number(e.target.value))}
                    className="w-24 accent-blue-600 cursor-pointer"
                  />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleGenerateRandom}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Generate Random Graph</span>
            </button>
          </div>
        </div>

        {/* Right: Manual Input Panel + LocalStorage Save/Load */}
        <div className="xl:col-span-5 space-y-6">
          {/* Manual Graph Input Panel */}
          <form
            onSubmit={handleApplyManualInput}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-display font-bold text-slate-900 dark:text-slate-100">
                  Manual Graph Input Panel
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Build or inspect the graph via Edge List, Adjacency List, or Adjacency Matrix.
                </p>
              </div>
              <button
                type="button"
                onClick={() => syncManualFromGraph(graph, manualFormat)}
                className="text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline whitespace-nowrap"
              >
                Sync from Canvas
              </button>
            </div>

            {/* Format Tabs */}
            <div
              role="group"
              aria-label="Manual input representation"
              className="grid grid-cols-3 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 gap-1"
            >
              <button
                type="button"
                onClick={() => setManualFormat('edge-list')}
                className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                  manualFormat === 'edge-list'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Edge List
              </button>
              <button
                type="button"
                onClick={() => setManualFormat('adj-list')}
                className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                  manualFormat === 'adj-list'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Adjacency List
              </button>
              <button
                type="button"
                onClick={() => setManualFormat('adj-matrix')}
                className={`py-1.5 px-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                  manualFormat === 'adj-matrix'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Adjacency Matrix
              </button>
            </div>

            {manualFormat === 'edge-list' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="manual-vertex-count"
                    className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
                  >
                    Number of Vertices (optional)
                  </label>
                  <input
                    id="manual-vertex-count"
                    type="number"
                    min={0}
                    max={80}
                    placeholder="Auto"
                    value={manualVCount}
                    onChange={(e) => setManualVCount(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="manual-edge-count"
                    className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
                  >
                    Number of Edges (optional)
                  </label>
                  <input
                    id="manual-edge-count"
                    type="number"
                    min={0}
                    max={400}
                    placeholder="Auto"
                    value={manualECount}
                    onChange={(e) => setManualECount(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="manual-graph-textarea"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
              >
                {manualFormat === 'edge-list' &&
                  'One edge per line: "Source Target" or "Source Target Weight" (e.g., A B 4)'}
                {manualFormat === 'adj-list' &&
                  'One vertex per line: "A: B, C" or weighted "A: B(4), C(2)"'}
                {manualFormat === 'adj-matrix' &&
                  'Square N × N grid of numbers (0 = no edge, >0 = edge / weight)'}
              </label>
              <textarea
                id="manual-graph-textarea"
                rows={7}
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                spellCheck={false}
                className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0D1526] font-mono text-xs text-slate-900 dark:text-slate-100 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
            >
              Validate & Apply to Graph Canvas
            </button>
          </form>

          {/* Save & Load Graphs (LocalStorage) */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
            <h2 className="text-base font-display font-bold text-slate-900 dark:text-slate-100">
              Save & Load Workspace Graphs
            </h2>

            <div className="flex items-center gap-2">
              <label htmlFor="save-graph-name" className="sr-only">
                Graph Name
              </label>
              <input
                id="save-graph-name"
                type="text"
                placeholder="Enter graph title..."
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={handleSaveGraph}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold whitespace-nowrap"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Graph</span>
              </button>
            </div>

            {savedGraphs.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
                No custom graphs saved yet. Saved graphs persist in your browser across sessions.
              </p>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {savedGraphs.map((item) => (
                  <div
                    key={item.id}
                    className="pt-2 first:pt-0 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {item.graph.name}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {item.graph.nodes.length}V · {item.graph.edges.length}E · Saved {item.savedAt}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateGraph(item.graph, true);
                          syncManualFromGraph(item.graph, manualFormat);
                          showBanner(`Loaded saved graph "${item.graph.name}".`);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-700 text-blue-600 dark:text-cyan-400 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <FolderOpen className="w-3 h-3" />
                        <span>Load</span>
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete saved graph ${item.graph.name}`}
                        onClick={() => handleDeleteSaved(item.id)}
                        className="p-1 text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* One-Click Sample Graph Presets */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-display font-bold text-slate-900 dark:text-slate-100">
            One-Click Sample Graph Library
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Load any canonical topology immediately into the builder and all visualization modules.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SAMPLE_GRAPHS.map((preset) => (
            <div
              key={preset.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {preset.category}
                </div>
                <h3 className="text-sm font-display font-bold text-slate-900 dark:text-slate-100">
                  {preset.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {preset.summary}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const cloned: GraphData = JSON.parse(JSON.stringify(preset.graph));
                  onUpdateGraph(cloned, true);
                  setSelectedNodeId(null);
                  setSelectedEdgeId(null);
                  syncManualFromGraph(cloned, manualFormat);
                  showBanner(`Loaded preset "${preset.title}".`);
                }}
                className="w-full py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors whitespace-nowrap"
              >
                Load {preset.title}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
