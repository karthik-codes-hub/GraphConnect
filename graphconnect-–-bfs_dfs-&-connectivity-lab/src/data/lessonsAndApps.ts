import { GraphData } from '../types/graph';

export interface LessonItem {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  readTime: string;
  sections: {
    heading: string;
    body: string;
    bullets?: string[];
    code?: string;
  }[];
  demoGraph: GraphData;
}

export const LESSONS: LessonItem[] = [
  {
    id: 'lesson-1',
    number: 'Lesson 01',
    title: 'Introduction to Graphs',
    subtitle: 'Vertices, edges, directed vs. undirected models, weights, and memory representations.',
    readTime: '6 min study',
    sections: [
      {
        heading: 'Formal Definition G = (V, E)',
        body: 'A graph G = (V, E) is a mathematical structure consisting of a finite set V of vertices (also called nodes) and a set E of edges (links or arcs) connecting pairs of vertices. Graphs model pairwise relationships across computer networks, road maps, social circles, and dependency trees.',
        bullets: [
          'Undirected Graph: Edges are unordered pairs {u, v}. Traversing u — v works identically in both directions.',
          'Directed Graph (Digraph): Edges are ordered pairs (u, v) written u → v, leaving tail u and entering head v.',
          'Weighted Graph: Each edge e ∈ E carries a numerical cost w(e) representing distance, latency, or capacity.',
        ],
      },
      {
        heading: 'Graph Representations in Memory',
        body: 'Choosing how to store G = (V, E) directly governs traversal time and memory footprint:',
        bullets: [
          'Adjacency List: Array/Map of V lists where Adj[u] stores neighbors of u. Space = Θ(V + E). Optimal for sparse graphs and achieves O(V + E) BFS/DFS runtime.',
          'Adjacency Matrix: A V × V grid where M[u][v] = 1 (or weight w) if edge (u, v) exists, else 0. Space = Θ(V²). O(1) edge lookup, but forces O(V²) traversal time.',
          'Edge List: Flat array of E tuples (u, v, w). Space = Θ(E). Compact for storage and Kruskal’s MST, but converted to Adjacency List before BFS/DFS.',
        ],
        code: `// Adjacency List (Space: O(V + E))
A: [B, C]
B: [A, D]
C: [A, D]
D: [B, C]`,
      },
    ],
    demoGraph: {
      name: 'Lesson 1 Demo Graph',
      directed: false,
      weighted: true,
      nodes: [
        { id: 'l1-a', label: 'A', x: 180, y: 120 },
        { id: 'l1-b', label: 'B', x: 420, y: 95 },
        { id: 'l1-c', label: 'C', x: 180, y: 290 },
        { id: 'l1-d', label: 'D', x: 420, y: 290 },
      ],
      edges: [
        { id: 'l1-e1', source: 'l1-a', target: 'l1-b', weight: 4 },
        { id: 'l1-e2', source: 'l1-a', target: 'l1-c', weight: 2 },
        { id: 'l1-e3', source: 'l1-b', target: 'l1-d', weight: 5 },
        { id: 'l1-e4', source: 'l1-c', target: 'l1-d', weight: 3 },
      ],
    },
  },
  {
    id: 'lesson-2',
    number: 'Lesson 02',
    title: 'Breadth-First Search (BFS)',
    subtitle: 'Level-order wavefront traversal powered by a First-In, First-Out (FIFO) queue.',
    readTime: '7 min study',
    sections: [
      {
        heading: 'Working Principle & Queue Mechanics',
        body: 'Breadth-First Search explores a graph in concentric rings (levels) outward from a source vertex s. It visits all vertices at distance 1 hop before any vertex at distance 2 hops, and all vertices at distance d before distance d + 1.',
        bullets: [
          'Initialization: Mark start vertex s as visited (Level 0) and enqueue s into FIFO queue Q.',
          'Expansion: Repeatedly dequeue front vertex u, inspect every neighbor v ∈ Adj[u], and if v is unvisited, mark v visited (Level[u] + 1) and enqueue v.',
          'Shortest Path Theorem: In any unweighted graph, BFS computes the minimum-hop path from s to every reachable vertex.',
        ],
        code: `BFS(G, s):
  create empty FIFO queue Q
  mark s as visited; level[s] = 0
  enqueue(Q, s)
  while Q is not empty:
    u = dequeue(Q)
    for each v in Adj[u]:
      if v is not visited:
        mark v as visited
        level[v] = level[u] + 1
        enqueue(Q, v)`,
      },
      {
        heading: 'Complexity Analysis',
        body: 'Each reachable vertex is enqueued and dequeued at most once: O(V) queue operations. When dequeued, its adjacency list is scanned once, summing to E scans (directed) or 2E scans (undirected): O(E). Total Time = O(V + E). Auxiliary Space = O(V) for the visited set and queue.',
      },
    ],
    demoGraph: {
      name: 'BFS Wavefront Tree',
      directed: false,
      weighted: false,
      nodes: [
        { id: 'l2-a', label: 'A', x: 300, y: 65 },
        { id: 'l2-b', label: 'B', x: 180, y: 185 },
        { id: 'l2-c', label: 'C', x: 420, y: 185 },
        { id: 'l2-d', label: 'D', x: 120, y: 315 },
        { id: 'l2-e', label: 'E', x: 245, y: 315 },
        { id: 'l2-f', label: 'F', x: 420, y: 315 },
      ],
      edges: [
        { id: 'l2-e1', source: 'l2-a', target: 'l2-b', weight: 1 },
        { id: 'l2-e2', source: 'l2-a', target: 'l2-c', weight: 1 },
        { id: 'l2-e3', source: 'l2-b', target: 'l2-d', weight: 1 },
        { id: 'l2-e4', source: 'l2-b', target: 'l2-e', weight: 1 },
        { id: 'l2-e5', source: 'l2-c', target: 'l2-f', weight: 1 },
      ],
    },
  },
  {
    id: 'lesson-3',
    number: 'Lesson 03',
    title: 'Depth-First Search (DFS)',
    subtitle: 'Deep path exploration and systematic backtracking via recursion or an explicit LIFO stack.',
    readTime: '7 min study',
    sections: [
      {
        heading: 'Working Principle: Dive Deep, Then Backtrack',
        body: 'Depth-First Search follows a single path forward as deep as unvisited edges allow. Only when it hits a dead end (a vertex whose neighbors are all already visited) does it backtrack to the most recent branching vertex with unexplored neighbors.',
        bullets: [
          'Recursive Implementation: Uses the program call stack implicitly; clean and expressive for tree/back/cross edge classification.',
          'Iterative Implementation: Uses an explicit LIFO stack in heap memory, preventing call-stack overflow on deep chains with tens of thousands of vertices.',
        ],
        code: `DFS_Recursive(G, u):
  mark u as visited
  for each v in Adj[u]:
    if v is not visited:
      DFS_Recursive(G, v)
  // backtrack when loop finishes`,
      },
      {
        heading: 'Complexity & Structural Power',
        body: 'Like BFS, DFS visits each vertex once and inspects each adjacency entry once: Time = O(V + E), Auxiliary Space = O(V). Its entry/finish timestamps unlock cycle detection, topological sort, bridges/articulation points, and Strongly Connected Components.',
      },
    ],
    demoGraph: {
      name: 'DFS Backtracking Demo',
      directed: false,
      weighted: false,
      nodes: [
        { id: 'l3-a', label: 'A', x: 160, y: 95 },
        { id: 'l3-b', label: 'B', x: 310, y: 95 },
        { id: 'l3-c', label: 'C', x: 460, y: 95 },
        { id: 'l3-d', label: 'D', x: 310, y: 265 },
        { id: 'l3-e', label: 'E', x: 460, y: 265 },
      ],
      edges: [
        { id: 'l3-e1', source: 'l3-a', target: 'l3-b', weight: 1 },
        { id: 'l3-e2', source: 'l3-b', target: 'l3-c', weight: 1 },
        { id: 'l3-e3', source: 'l3-b', target: 'l3-d', weight: 1 },
        { id: 'l3-e4', source: 'l3-d', target: 'l3-e', weight: 1 },
      ],
    },
  },
  {
    id: 'lesson-4',
    number: 'Lesson 04',
    title: 'Graph Connectivity',
    subtitle: 'Connected components, reachability, isolated vertices, and directed strong vs. weak connectivity.',
    readTime: '8 min study',
    sections: [
      {
        heading: 'Undirected Connectivity & Components',
        body: 'An undirected graph is connected if a path exists between every pair of vertices u, v ∈ V. If not, G is disconnected and partitions uniquely into maximal connected subgraphs called Connected Components.',
        bullets: [
          'Component Counting via BFS/DFS: Loop over all vertices v ∈ V; each time an unvisited vertex is found, increment componentCount and launch BFS/DFS to mark its entire component.',
          'Isolated Vertex: Any vertex with total degree 0 (no incident edges). Each isolated vertex forms a singleton component {v}.',
          'Reachability(s, t): Target t is reachable from source s iff BFS/DFS launched from s visits t.',
        ],
      },
      {
        heading: 'Directed Graphs: Strong vs. Weak Connectivity',
        body: 'In directed graphs, edge orientation requires two distinct mathematical definitions:',
        bullets: [
          'Strongly Connected: For EVERY ordered pair (u, v), a directed path exists from u →* v AND from v →* u. Partitioned into Strongly Connected Components (SCCs) via Kosaraju’s or Tarjan’s O(V + E) DFS algorithm.',
          'Weakly Connected: Replacing all directed edges with undirected edges produces a connected undirected graph. A graph like A → B → C is weakly connected, NOT strongly connected.',
        ],
      },
    ],
    demoGraph: {
      name: 'Directed Weak vs Strong Demo',
      directed: true,
      weighted: false,
      nodes: [
        { id: 'l4-a', label: 'A', x: 150, y: 120 },
        { id: 'l4-b', label: 'B', x: 280, y: 260 },
        { id: 'l4-c', label: 'C', x: 150, y: 290 },
        { id: 'l4-d', label: 'D', x: 455, y: 205 },
      ],
      edges: [
        { id: 'l4-e1', source: 'l4-a', target: 'l4-b', weight: 1 },
        { id: 'l4-e2', source: 'l4-b', target: 'l4-c', weight: 1 },
        { id: 'l4-e3', source: 'l4-c', target: 'l4-a', weight: 1 },
        { id: 'l4-e4', source: 'l4-b', target: 'l4-d', weight: 1 },
      ],
    },
  },
  {
    id: 'lesson-5',
    number: 'Lesson 05',
    title: 'BFS vs. DFS Analytical Synthesis',
    subtitle: 'When to choose queue wavefronts versus stack/recursive depth exploration.',
    readTime: '6 min study',
    sections: [
      {
        heading: 'Key Algorithmic Trade-Offs',
        body: 'Although both BFS and DFS run in O(V + E) time and O(V) worst-case auxiliary space on adjacency lists, their structural behavior differs sharply:',
        bullets: [
          'Shortest Unweighted Path: BFS guarantees shortest hop count; DFS does NOT.',
          'Wide Shallow Graphs (e.g., high-branching social networks): BFS queue swells rapidly with frontier width O(b^d), while DFS stack stays shallow at depth d.',
          'Deep Narrow Graphs (e.g., long chains or mazes): BFS queue stays tiny, while Recursive DFS risks deep call stacks (mitigated by Iterative Stack DFS).',
          'Cycle & Ordering Analysis: DFS naturally classifies tree/back/forward/cross edges for DAG topological sorting and SCC decomposition.',
        ],
      },
    ],
    demoGraph: {
      name: 'BFS vs DFS Contrast Graph',
      directed: false,
      weighted: false,
      nodes: [
        { id: 'l5-s', label: 'S', x: 140, y: 195 },
        { id: 'l5-a', label: 'A', x: 285, y: 95 },
        { id: 'l5-b', label: 'B', x: 285, y: 295 },
        { id: 'l5-c', label: 'C', x: 430, y: 95 },
        { id: 'l5-t', label: 'T', x: 470, y: 245 },
      ],
      edges: [
        { id: 'l5-e1', source: 'l5-s', target: 'l5-a', weight: 1 },
        { id: 'l5-e2', source: 'l5-s', target: 'l5-b', weight: 1 },
        { id: 'l5-e3', source: 'l5-a', target: 'l5-c', weight: 1 },
        { id: 'l5-e4', source: 'l5-c', target: 'l5-t', weight: 1 },
        { id: 'l5-e5', source: 'l5-b', target: 'l5-t', weight: 1 },
      ],
    },
  },
];

export interface RealWorldApplication {
  id: string;
  title: string;
  domain: string;
  problem: string;
  graphRepresentation: string;
  howBFSHelps: string;
  howDFSHelps: string;
  recommendedPrimary: 'BFS' | 'DFS' | 'Both';
  scenarioGraph: GraphData;
}

export const REAL_WORLD_APPLICATIONS: RealWorldApplication[] = [
  {
    id: 'network-connectivity',
    title: 'Computer Network Connectivity',
    domain: 'Distributed Systems & Routing',
    problem: 'Detect network partitions when a fiber link fails and compute minimum-hop packet forwarding tables across routers.',
    graphRepresentation: 'Vertices = Routers / Switches; Edges = Active physical or logical communication links.',
    howBFSHelps: 'Computes minimum-hop routing paths (as in RIP unweighted hop counts) and broadcasts link-state probes level-by-level.',
    howDFSHelps: 'Identifies critical bridges and articulation routers (Tarjan’s DFS) whose single failure would split the network into disconnected components.',
    recommendedPrimary: 'Both',
    scenarioGraph: {
      name: 'Router Backbone Topology',
      directed: false,
      weighted: false,
      nodes: [
        { id: 'r1', label: 'R1', x: 150, y: 130 },
        { id: 'r2', label: 'R2', x: 150, y: 310 },
        { id: 'r3', label: 'R3', x: 310, y: 220 },
        { id: 'r4', label: 'R4', x: 470, y: 220 },
        { id: 'r5', label: 'R5', x: 600, y: 130 },
        { id: 'r6', label: 'R6', x: 600, y: 310 },
      ],
      edges: [
        { id: 're1', source: 'r1', target: 'r2', weight: 1 },
        { id: 're2', source: 'r1', target: 'r3', weight: 1 },
        { id: 're3', source: 'r2', target: 'r3', weight: 1 },
        { id: 're4', source: 'r3', target: 'r4', weight: 1 }, // Bridge link!
        { id: 're5', source: 'r4', target: 'r5', weight: 1 },
        { id: 're6', source: 'r4', target: 'r6', weight: 1 },
        { id: 're7', source: 'r5', target: 'r6', weight: 1 },
      ],
    },
  },
  {
    id: 'social-network',
    title: 'Social Network Analysis',
    domain: 'Graph Data Science',
    problem: 'Find "People You May Know" (2nd- and 3rd-degree connections) and discover isolated or tightly-knit user communities.',
    graphRepresentation: 'Vertices = User profiles; Edges = Mutual friendships (undirected) or follower links (directed).',
    howBFSHelps: 'Finds exact degrees of separation (Level 1 = direct friends, Level 2 = friends-of-friends) without wandering millions of hops away.',
    howDFSHelps: 'Extracts connected user communities and Strongly Connected Components in directed follower graphs.',
    recommendedPrimary: 'BFS',
    scenarioGraph: {
      name: 'Social Degrees of Separation',
      directed: false,
      weighted: false,
      nodes: [
        { id: 'u1', label: 'You', x: 350, y: 220 },
        { id: 'u2', label: 'Ana', x: 205, y: 120 },
        { id: 'u3', label: 'Ben', x: 495, y: 120 },
        { id: 'u4', label: 'Dev', x: 205, y: 330 },
        { id: 'u5', label: 'Eva', x: 95, y: 220 },
        { id: 'u6', label: 'Kai', x: 615, y: 220 },
      ],
      edges: [
        { id: 'se1', source: 'u1', target: 'u2', weight: 1 },
        { id: 'se2', source: 'u1', target: 'u3', weight: 1 },
        { id: 'se3', source: 'u1', target: 'u4', weight: 1 },
        { id: 'se4', source: 'u2', target: 'u5', weight: 1 },
        { id: 'se5', source: 'u4', target: 'u5', weight: 1 },
        { id: 'se6', source: 'u3', target: 'u6', weight: 1 },
      ],
    },
  },
  {
    id: 'gps-route',
    title: 'GPS & Unweighted Transit Exploration',
    domain: 'Urban Mobility & Transit',
    problem: 'Find subway itineraries with the minimum number of station stops or line transfers, and verify whether detours exist during closures.',
    graphRepresentation: 'Vertices = Transit stations / intersections; Edges = Rail segments or one-way road lanes.',
    howBFSHelps: 'Finds the route with the fewest stops in unweighted station networks in O(V + E) time (generalizing to Dijkstra/A* when segment travel times vary).',
    howDFSHelps: 'Enumerates alternative detour corridors and detects one-way traffic traps (sink components) in directed road edits.',
    recommendedPrimary: 'BFS',
    scenarioGraph: {
      name: 'Metro Station Network',
      directed: false,
      weighted: false,
      nodes: [
        { id: 'm1', label: 'S1', x: 120, y: 220 },
        { id: 'm2', label: 'S2', x: 260, y: 115 },
        { id: 'm3', label: 'S3', x: 420, y: 115 },
        { id: 'm4', label: 'S4', x: 290, y: 315 },
        { id: 'm5', label: 'S5', x: 560, y: 220 },
      ],
      edges: [
        { id: 'me1', source: 'm1', target: 'm2', weight: 1 },
        { id: 'me2', source: 'm2', target: 'm3', weight: 1 },
        { id: 'me3', source: 'm3', target: 'm5', weight: 1 },
        { id: 'me4', source: 'm1', target: 'm4', weight: 1 },
        { id: 'me5', source: 'm4', target: 'm5', weight: 1 },
      ],
    },
  },
  {
    id: 'web-crawling',
    title: 'Search Engine Web Crawling',
    domain: 'Information Retrieval',
    problem: 'Discover and index linked web pages starting from authoritative seed URLs without getting trapped in infinite calendar/pagination loops.',
    graphRepresentation: 'Vertices = Web URLs; Directed Edges = HTML <a href> hyperlinks from page u to page v.',
    howBFSHelps: 'Production crawlers prioritize BFS queues so high-authority shallow pages across domains are indexed before deep infinite URL traps.',
    howDFSHelps: 'Maps deep directory hierarchies within a single documentation site and detects mutual link rings (SCCs).',
    recommendedPrimary: 'BFS',
    scenarioGraph: {
      name: 'Web Hyperlink Digraph',
      directed: true,
      weighted: false,
      nodes: [
        { id: 'w1', label: 'Home', x: 160, y: 210 },
        { id: 'w2', label: 'Docs', x: 340, y: 105 },
        { id: 'w3', label: 'Blog', x: 340, y: 320 },
        { id: 'w4', label: 'API', x: 540, y: 105 },
        { id: 'w5', label: 'Post', x: 540, y: 320 },
      ],
      edges: [
        { id: 'we1', source: 'w1', target: 'w2', weight: 1 },
        { id: 'we2', source: 'w1', target: 'w3', weight: 1 },
        { id: 'we3', source: 'w2', target: 'w4', weight: 1 },
        { id: 'we4', source: 'w4', target: 'w1', weight: 1 },
        { id: 'we5', source: 'w3', target: 'w5', weight: 1 },
      ],
    },
  },
  {
    id: 'maze-solving',
    title: 'Maze Solving & Procedural Generation',
    domain: 'AI Pathfinding & Robotics',
    problem: 'Navigate an autonomous robot from an entrance cell to a goal cell, or generate solvable mazes with no unreachable pockets.',
    graphRepresentation: 'Vertices = Open grid intersections; Edges = Passable corridors between adjacent cells.',
    howBFSHelps: 'Guarantees the shortest-step escape path through a maze with multiple loops.',
    howDFSHelps: 'Explores one corridor to completion and backtracks from dead ends using minimal memory along narrow corridors; randomized DFS generates spanning-tree mazes.',
    recommendedPrimary: 'Both',
    scenarioGraph: {
      name: 'Maze Junction Graph',
      directed: false,
      weighted: false,
      nodes: [
        { id: 'z1', label: 'In', x: 130, y: 120 },
        { id: 'z2', label: 'J1', x: 290, y: 120 },
        { id: 'z3', label: 'Dead', x: 470, y: 120 },
        { id: 'z4', label: 'J2', x: 290, y: 290 },
        { id: 'z5', label: 'J3', x: 470, y: 290 },
        { id: 'z6', label: 'Out', x: 615, y: 290 },
      ],
      edges: [
        { id: 'ze1', source: 'z1', target: 'z2', weight: 1 },
        { id: 'ze2', source: 'z2', target: 'z3', weight: 1 },
        { id: 'ze3', source: 'z2', target: 'z4', weight: 1 },
        { id: 'ze4', source: 'z4', target: 'z5', weight: 1 },
        { id: 'ze5', source: 'z5', target: 'z6', weight: 1 },
      ],
    },
  },
  {
    id: 'dependency-analysis',
    title: 'Package & Build Dependency Analysis',
    domain: 'Compilers & Software Engineering',
    problem: 'Determine valid compilation order for software modules and detect circular import dependencies (e.g., Module A imports B, B imports C, C imports A).',
    graphRepresentation: 'Vertices = Packages / Course prerequisites; Directed Edges = u → v meaning u must be built before v.',
    howBFSHelps: 'Kahn’s in-degree BFS groups independent modules into parallelizable build stages (Level 0, Level 1...).',
    howDFSHelps: '3-color DFS detects circular dependency cycles with exact cycle traces and produces topological build order via reverse finish times.',
    recommendedPrimary: 'DFS',
    scenarioGraph: {
      name: 'Build Dependency DAG',
      directed: true,
      weighted: false,
      nodes: [
        { id: 'd1', label: 'Core', x: 135, y: 215 },
        { id: 'd2', label: 'Auth', x: 320, y: 110 },
        { id: 'd3', label: 'Data', x: 320, y: 320 },
        { id: 'd4', label: 'UI', x: 505, y: 110 },
        { id: 'd5', label: 'App', x: 610, y: 215 },
      ],
      edges: [
        { id: 'de1', source: 'd1', target: 'd2', weight: 1 },
        { id: 'de2', source: 'd1', target: 'd3', weight: 1 },
        { id: 'de3', source: 'd2', target: 'd4', weight: 1 },
        { id: 'de4', source: 'd4', target: 'd5', weight: 1 },
        { id: 'de5', source: 'd3', target: 'd5', weight: 1 },
      ],
    },
  },
  {
    id: 'campus-navigation',
    title: 'University Campus Pedestrian Navigation',
    domain: 'Smart Campus GIS',
    problem: 'Verify wheelchair-accessible walkway connectivity across academic blocks, labs, library, and hostels, and find fewest-crossing walkways.',
    graphRepresentation: 'Vertices = Campus buildings; Edges = Accessible pedestrian walkways.',
    howBFSHelps: 'Finds the route crossing the fewest building lobbies between Lecture Hall and AI Lab.',
    howDFSHelps: 'Audits whether closing a walkway under construction leaves any hostel or block isolated from the rest of the campus.',
    recommendedPrimary: 'BFS',
    scenarioGraph: {
      name: 'Campus Walkway Graph',
      directed: false,
      weighted: false,
      nodes: [
        { id: 'c1', label: 'Gate', x: 120, y: 220 },
        { id: 'c2', label: 'Admin', x: 265, y: 120 },
        { id: 'c3', label: 'Lib', x: 265, y: 320 },
        { id: 'c4', label: 'CSLab', x: 455, y: 120 },
        { id: 'c5', label: 'Audit', x: 455, y: 320 },
        { id: 'c6', label: 'Hostel', x: 605, y: 220 },
      ],
      edges: [
        { id: 'ce1', source: 'c1', target: 'c2', weight: 1 },
        { id: 'ce2', source: 'c1', target: 'c3', weight: 1 },
        { id: 'ce3', source: 'c2', target: 'c3', weight: 1 },
        { id: 'ce4', source: 'c2', target: 'c4', weight: 1 },
        { id: 'ce5', source: 'c3', target: 'c5', weight: 1 },
        { id: 'ce6', source: 'c4', target: 'c6', weight: 1 },
        { id: 'ce7', source: 'c5', target: 'c6', weight: 1 },
      ],
    },
  },
  {
    id: 'emergency-evacuation',
    title: 'Emergency Evacuation Simulations',
    domain: 'Safety Engineering',
    problem: 'Verify that every room on a floor has an unobstructed path to at least one fire exit and compute minimum corridor hops to safety.',
    graphRepresentation: 'Vertices = Rooms, stairwells, and fire exits; Edges = Unblocked corridors and doors.',
    howBFSHelps: 'Models smoke propagation wavefronts per time step and computes shortest corridor escape routes to exits.',
    howDFSHelps: 'Checks structural reachability under blocked-door failure scenarios and detects isolated rooms trapped without exit paths.',
    recommendedPrimary: 'BFS',
    scenarioGraph: {
      name: 'Floor Evacuation Topology',
      directed: false,
      weighted: false,
      nodes: [
        { id: 'x1', label: 'R101', x: 135, y: 120 },
        { id: 'x2', label: 'R102', x: 135, y: 310 },
        { id: 'x3', label: 'HallA', x: 300, y: 215 },
        { id: 'x4', label: 'HallB', x: 465, y: 215 },
        { id: 'x5', label: 'Exit1', x: 610, y: 120 },
        { id: 'x6', label: 'Exit2', x: 610, y: 310 },
      ],
      edges: [
        { id: 'xe1', source: 'x1', target: 'x3', weight: 1 },
        { id: 'xe2', source: 'x2', target: 'x3', weight: 1 },
        { id: 'xe3', source: 'x3', target: 'x4', weight: 1 },
        { id: 'xe4', source: 'x4', target: 'x5', weight: 1 },
        { id: 'xe5', source: 'x4', target: 'x6', weight: 1 },
      ],
    },
  },
];
