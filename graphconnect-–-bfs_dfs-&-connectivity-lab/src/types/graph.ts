export type PageId =
  | 'dashboard'
  | 'builder'
  | 'bfs'
  | 'dfs'
  | 'connectivity'
  | 'comparison'
  | 'performance'
  | 'learning'
  | 'applications'
  | 'quiz'
  | 'reports';

export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
}

export interface GraphData {
  id?: string;
  name: string;
  description?: string;
  directed: boolean;
  weighted: boolean;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface AdjacencyEntry {
  neighborId: string;
  neighborLabel: string;
  edgeId: string;
  weight: number;
}

export type TraversalEventType =
  | 'init'
  | 'start-component'
  | 'enqueue'
  | 'dequeue'
  | 'push'
  | 'pop'
  | 'visit'
  | 'inspect-edge'
  | 'skip-visited'
  | 'backtrack'
  | 'complete';

export interface StackFrame {
  nodeId: string;
  label: string;
  depth: number;
}

export interface TraversalStep {
  stepIndex: number;
  eventType: TraversalEventType;
  activeNodeId: string | null;
  exploringEdgeId: string | null;
  visitedIds: string[];
  unvisitedIds: string[];
  treeEdgeIds: string[];
  checkedEdgeIds: string[];
  /** Queue contents (node labels/IDs) for BFS */
  queue: string[];
  /** Explicit stack or call-stack frames for DFS */
  stack: StackFrame[];
  /** BFS level map (nodeId -> distance from source) */
  levels: Record<string, number>;
  currentLevel: number;
  recursionDepth: number;
  isBacktracking: boolean;
  title: string;
  explanation: string;
  pseudocodeLine: number;
}

export interface TraversalResult {
  algorithm: 'BFS' | 'DFS-Recursive' | 'DFS-Iterative';
  startNodeId: string | null;
  traversalOrder: string[];
  traversalLabels: string[];
  visitedCount: number;
  edgesExamined: number;
  executionTimeMs: number;
  peakAuxiliarySize: number;
  maxDepthOrLevel: number;
  operationsCount: number;
  estimatedMemoryBytes: number;
  steps: TraversalStep[];
  levels: Record<string, number>;
  treeEdgeIds: string[];
}

export interface ComponentInfo {
  index: number;
  nodeIds: string[];
  labels: string[];
  color: string;
}

export interface CycleInfo {
  hasCycle: boolean;
  cycleNodeIds: string[];
  cycleLabels: string[];
  cycleEdgeIds: string[];
  explanation: string;
}

export interface DegreeInfo {
  nodeId: string;
  label: string;
  inDegree: number;
  outDegree: number;
  totalDegree: number;
}

export interface ConnectivityReport {
  directed: boolean;
  vertexCount: number;
  edgeCount: number;
  /** For undirected: standard connectivity. For directed: strong connectivity. */
  isConnected: boolean;
  /** Only populated for directed graphs */
  isStronglyConnected?: boolean;
  /** Only populated for directed graphs */
  isWeaklyConnected?: boolean;
  connectivityLabel: string;
  connectivityExplanation: string;
  /** Undirected components OR Strongly Connected Components (for directed) */
  components: ComponentInfo[];
  /** Weakly Connected Components when graph is directed */
  weakComponents?: ComponentInfo[];
  isolatedVertices: { id: string; label: string }[];
  cycle: CycleInfo;
  degrees: DegreeInfo[];
  density: number;
  maxPossibleEdges: number;
  densityClassification: 'Empty' | 'Sparse' | 'Moderate' | 'Dense' | 'Complete';
  averageDegree: number;
}

export interface ReachabilityResult {
  sourceId: string;
  targetId: string;
  reachable: boolean;
  pathNodeIds: string[];
  pathLabels: string[];
  pathEdgeIds: string[];
  exploredNodeIds: string[];
  exploredLabels: string[];
  exploredEdgeIds: string[];
  hopCount: number;
  explanation: string;
}

export type GeneratedGraphType =
  | 'sparse'
  | 'dense'
  | 'random'
  | 'linear'
  | 'complete'
  | 'tree'
  | 'cyclic'
  | 'disconnected';

export interface BenchmarkDataPoint {
  id: string;
  label: string;
  graphType: GeneratedGraphType;
  vertices: number;
  edges: number;
  density: number;
  bfsTimeMs: number;
  dfsRecursiveTimeMs: number;
  dfsIterativeTimeMs: number;
  bfsVisited: number;
  dfsVisited: number;
  bfsEdgesExamined: number;
  dfsEdgesExamined: number;
  bfsOperations: number;
  dfsOperations: number;
  bfsPeakQueue: number;
  dfsPeakDepth: number;
  trials: number;
}

export interface SavedGraphRecord {
  id: string;
  savedAt: string;
  graph: GraphData;
}
