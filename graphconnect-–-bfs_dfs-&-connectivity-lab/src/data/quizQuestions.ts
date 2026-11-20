export type QuizCategory =
  | 'Concept MCQ'
  | 'Predict BFS'
  | 'Predict DFS'
  | 'Connected Components'
  | 'Isolated Vertices'
  | 'Time & Space Complexity'
  | 'Algorithm Selection';

export interface QuizQuestion {
  id: number;
  category: QuizCategory;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  question: string;
  graphContext?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    category: 'Concept MCQ',
    difficulty: 'Beginner',
    question: 'Which auxiliary data structure is fundamentally used by Breadth-First Search (BFS) to manage the frontier of discovered vertices?',
    options: [
      'First-In, First-Out (FIFO) Queue',
      'Last-In, First-Out (LIFO) Stack',
      'Min-Priority Queue (Binary Heap)',
      'Disjoint-Set Union (Union-Find)',
    ],
    correctIndex: 0,
    explanation:
      'BFS explores vertices strictly in order of their distance (level) from the starting vertex. A FIFO Queue guarantees that vertices discovered earlier at level d are processed before vertices discovered later at level d + 1.',
  },
  {
    id: 2,
    category: 'Predict BFS',
    difficulty: 'Beginner',
    question: 'Predict the deterministic BFS traversal order starting from vertex A (assuming neighbors are inspected in alphabetical order).',
    graphContext: 'Undirected Edges: (A, B), (A, C), (B, D), (B, E), (C, F)',
    options: [
      'A → B → C → D → E → F',
      'A → B → D → E → C → F',
      'A → C → F → B → E → D',
      'A → B → C → F → E → D',
    ],
    correctIndex: 0,
    explanation:
      'Starting at A (Level 0), BFS enqueues B and C (Level 1). Dequeuing B enqueues D and E (Level 2). Dequeuing C enqueues F (Level 2). Thus the traversal order is A → B → C → D → E → F.',
  },
  {
    id: 3,
    category: 'Predict DFS',
    difficulty: 'Beginner',
    question: 'Using the same tree, predict the Recursive DFS traversal order starting from vertex A (neighbors inspected alphabetically).',
    graphContext: 'Undirected Edges: (A, B), (A, C), (B, D), (B, E), (C, F)',
    options: [
      'A → B → D → E → C → F',
      'A → B → C → D → E → F',
      'D → E → B → F → C → A',
      'A → C → F → B → D → E',
    ],
    correctIndex: 0,
    explanation:
      'Recursive DFS visits A, immediately recurses into first alphabetical neighbor B, then B’s first unvisited neighbor D. D is a leaf so DFS backtracks to B, visits E, backtracks to A, visits C, and finally visits F: A → B → D → E → C → F.',
  },
  {
    id: 4,
    category: 'Time & Space Complexity',
    difficulty: 'Beginner',
    question: 'What is the worst-case time complexity of running BFS or DFS across an entire graph G = (V, E) stored as an adjacency list?',
    options: [
      'O(V + E)',
      'O(V²)',
      'O(V log V + E)',
      'O(V · E)',
    ],
    correctIndex: 0,
    explanation:
      'With an adjacency list, each vertex is marked visited and enqueued/pushed at most once — O(V) work — and each adjacency entry is scanned once (directed: E entries; undirected: 2E entries) — O(E) work. Combined complexity is O(V + E).',
  },
  {
    id: 5,
    category: 'Time & Space Complexity',
    difficulty: 'Intermediate',
    question: 'If a graph G = (V, E) is represented using an V × V Adjacency Matrix instead of an Adjacency List, what does the time complexity of BFS become?',
    options: [
      'O(V²)',
      'O(V + E)',
      'O(E log V)',
      'O(V³)',
    ],
    correctIndex: 0,
    explanation:
      'In an adjacency matrix, finding the neighbors of a vertex u requires scanning all V columns of row u regardless of how few edges u actually has. Across V vertices, this requires V × V = O(V²) time even on sparse graphs.',
  },
  {
    id: 6,
    category: 'Connected Components',
    difficulty: 'Beginner',
    question: 'How many connected components exist in the following undirected graph?',
    graphContext: 'Vertices: {A, B, C, D, E, F, G} · Edges: (A, B), (B, C), (D, E), (E, F)',
    options: [
      '3 connected components',
      '2 connected components',
      '1 connected component',
      '4 connected components',
    ],
    correctIndex: 0,
    explanation:
      'Component 1 is {A, B, C}, Component 2 is {D, E, F}, and isolated vertex {G} forms Component 3 on its own. Total = 3 connected components.',
  },
  {
    id: 7,
    category: 'Isolated Vertices',
    difficulty: 'Beginner',
    question: 'Identify all isolated vertices in the directed graph below.',
    graphContext: 'Vertices: {P, Q, R, S, T} · Directed Edges: P → Q, Q → R, P → R',
    options: [
      'S and T',
      'Only R (because out-degree is 0)',
      'Only P (because in-degree is 0)',
      'P, R, S, and T',
    ],
    correctIndex: 0,
    explanation:
      'An isolated vertex has NO incident edges at all (in-degree = 0 AND out-degree = 0). P has out-degree 2, R has in-degree 2, while S and T have total degree 0.',
  },
  {
    id: 8,
    category: 'Algorithm Selection',
    difficulty: 'Beginner',
    question: 'You need to find the minimum number of router hops between two servers in an unweighted computer network. Which algorithm guarantees an optimal answer?',
    options: [
      'Breadth-First Search (BFS)',
      'Depth-First Search (DFS)',
      'Either BFS or DFS guarantees the shortest path',
      'Topological Sort',
    ],
    correctIndex: 0,
    explanation:
      'BFS explores vertices in non-decreasing order of hop distance (Level 0, Level 1, Level 2...). The first time BFS reaches the destination vertex, the path discovered is guaranteed to have the minimum number of edges. DFS can easily follow a long winding detour first.',
  },
  {
    id: 9,
    category: 'Predict BFS',
    difficulty: 'Intermediate',
    question: 'Predict the BFS traversal order starting from vertex S in this cyclic undirected graph (alphabetical tie-breaking).',
    graphContext: 'Vertices: {S, A, B, C, D} · Edges: (S, A), (S, B), (A, B), (A, C), (B, D), (C, D)',
    options: [
      'S → A → B → C → D',
      'S → A → B → D → C',
      'S → A → C → D → B',
      'S → B → A → D → C',
    ],
    correctIndex: 0,
    explanation:
      'From S: enqueue A, B. Dequeue A: neighbor B is already visited (skip!), neighbor C is unvisited (enqueue C). Dequeue B: neighbors S and A are visited, neighbor D is unvisited (enqueue D). Remaining queue yields C then D: S → A → B → C → D.',
  },
  {
    id: 10,
    category: 'Predict DFS',
    difficulty: 'Intermediate',
    question: 'Predict the Recursive DFS traversal order starting from vertex S on the exact same cyclic graph (alphabetical tie-breaking).',
    graphContext: 'Vertices: {S, A, B, C, D} · Edges: (S, A), (S, B), (A, B), (A, C), (B, D), (C, D)',
    options: [
      'S → A → B → D → C',
      'S → A → B → C → D',
      'S → A → C → B → D',
      'S → B → D → C → A',
    ],
    correctIndex: 0,
    explanation:
      'Start at S → recurse into first neighbor A. At A, neighbors are B, C, S; first unvisited is B → recurse into B. At B, neighbors are A, D, S; first unvisited is D → recurse into D. At D, neighbors are B, C; C is unvisited → recurse into C! All 5 vertices visited: S → A → B → D → C.',
  },
  {
    id: 11,
    category: 'Concept MCQ',
    difficulty: 'Intermediate',
    question: 'Consider the directed graph A → B → C. Which statement accurately describes its connectivity?',
    options: [
      'Weakly connected, but NOT strongly connected',
      'Strongly connected, but NOT weakly connected',
      'Both strongly connected and weakly connected',
      'Neither weakly connected nor strongly connected',
    ],
    correctIndex: 0,
    explanation:
      'Ignoring edge directions yields the undirected chain A — B — C, which is a single component (weakly connected). However, there is no directed path from C back to A or B, so it has 3 Strongly Connected Components ({A}, {B}, {C}) and is NOT strongly connected.',
  },
  {
    id: 12,
    category: 'Time & Space Complexity',
    difficulty: 'Intermediate',
    question: 'On a balanced binary tree of height h with V = 2^(h+1) - 1 vertices (and wide leaf frontier ≈ V/2), how does peak auxiliary memory compare between BFS and Recursive DFS starting at the root?',
    options: [
      'BFS queue peaks at Θ(V) vertices, whereas Recursive DFS call stack peaks at Θ(h) = Θ(log V)',
      'BFS queue peaks at Θ(log V), whereas Recursive DFS call stack peaks at Θ(V)',
      'Both peak at O(1) auxiliary space',
      'Both always peak at exactly V/2 elements simultaneously',
    ],
    correctIndex: 0,
    explanation:
      'At the bottom level of a complete binary tree, roughly V/2 leaves reside in the BFS queue at once — Θ(V) queue memory. By contrast, Recursive DFS only stores the active root-to-leaf path on the call stack, which has length h + 1 = Θ(log V) (though the visited set for general graphs still takes O(V)).',
  },
  {
    id: 13,
    category: 'Time & Space Complexity',
    difficulty: 'Intermediate',
    question: 'Conversely, on a long chordless linear path A — B — C — ... (V vertices in a single line) starting from A, what are the peak queue size of BFS and maximum recursion depth of DFS?',
    options: [
      'BFS peak queue size is 1; DFS maximum recursion depth is V',
      'BFS peak queue size is V; DFS maximum recursion depth is 1',
      'Both have peak structure size V',
      'Both have peak structure size log₂(V)',
    ],
    correctIndex: 0,
    explanation:
      'On a simple path starting at an endpoint, each dequeued vertex has only 1 unvisited neighbor, so the BFS queue never holds more than 1 vertex at a time! Recursive DFS, however, chains V nested calls before backtracking from the far end, reaching depth V.',
  },
  {
    id: 14,
    category: 'Algorithm Selection',
    difficulty: 'Intermediate',
    question: 'Which graph problem is naturally solved using DFS finish times / recursion-stack tracking rather than basic single-pass BFS?',
    options: [
      'Topological sorting of a Directed Acyclic Graph (DAG) and Strongly Connected Components (Kosaraju/Tarjan)',
      'Finding shortest unweighted hop distance in a LAN',
      'Computing degree of every vertex',
      'Counting total number of edges in an adjacency matrix',
    ],
    correctIndex: 0,
    explanation:
      'DFS entry/finish timestamps and active recursion-stack (gray-node) tracking form the backbone of topological sort, directed back-edge cycle detection, articulation point / bridge detection, and Tarjan/Kosaraju SCC algorithms.',
  },
  {
    id: 15,
    category: 'Concept MCQ',
    difficulty: 'Intermediate',
    question: 'In an undirected graph DFS, suppose we are currently at vertex u (reached from parent p) and inspect an adjacent vertex v that is ALREADY visited. When does edge (u, v) prove a cycle exists?',
    options: [
      'Whenever v ≠ p (i.e., v is a visited vertex other than u’s immediate DFS parent)',
      'Whenever v = p',
      'Never — visited vertices in undirected graphs never indicate cycles',
      'Only if the graph has an even number of vertices',
    ],
    correctIndex: 0,
    explanation:
      'Every undirected edge (p, u) appears in both u’s and p’s adjacency lists. Seeing p again from u just looks back along the tree edge we arrived on. Seeing ANY visited vertex v ≠ p means there is a second independent path between u and v, forming a cycle!',
  },
  {
    id: 16,
    category: 'Concept MCQ',
    difficulty: 'Advanced',
    question: 'Why does naive cycle detection ("if neighbor v is already visited, report cycle") FAIL on directed graphs such as the diamond A → B, A → C, B → D, C → D?',
    options: [
      'Because D is visited via A → B → D and later encountered again via A → C → D as a cross/forward edge, even though no directed cycle exists',
      'Because directed graphs cannot contain cycles of length 4',
      'Because BFS must be used instead of DFS on all directed graphs',
      'Because D has out-degree 0, which makes it an isolated vertex',
    ],
    correctIndex: 0,
    explanation:
      'In a directed graph, encountering a previously finished (BLACK) vertex via another branch is a cross or forward edge, not a cycle! A directed cycle exists if and only if DFS encounters a vertex currently on the ACTIVE recursion stack (GRAY).',
  },
  {
    id: 17,
    category: 'Connected Components',
    difficulty: 'Advanced',
    question: 'How many Strongly Connected Components (SCCs) exist in the directed graph below?',
    graphContext: 'Vertices: {A, B, C, D, E} · Directed Edges: A → B, B → C, C → A, C → D, D → E',
    options: [
      '3 SCCs: {A, B, C}, {D}, and {E}',
      '1 SCC: {A, B, C, D, E}',
      '2 SCCs: {A, B, C} and {D, E}',
      '5 SCCs (every vertex alone)',
    ],
    correctIndex: 0,
    explanation:
      'A → B → C → A forms a mutually reachable cycle, so {A, B, C} is 1 SCC. Edge C → D is one-way (cannot return from D to C), and D → E is one-way (cannot return from E to D). Hence {D} and {E} are singleton SCCs, totaling 3 SCCs.',
  },
  {
    id: 18,
    category: 'Predict DFS',
    difficulty: 'Advanced',
    question: 'In Iterative DFS using an explicit LIFO stack, if vertex A has unvisited neighbors [B, C, D] in alphabetical order, in what order should they be pushed onto the stack so B is popped and visited first?',
    options: [
      'Push D first, then C, then B (reverse order so B sits on top of the stack)',
      'Push B first, then C, then D',
      'Push C, then B, then D',
      'Order of pushing onto a LIFO stack does not affect pop order',
    ],
    correctIndex: 0,
    explanation:
      'Because a stack is Last-In, First-Out (LIFO), pushing D, then C, then B places B at the top of the stack. The very next pop() retrieves B, matching standard alphabetical recursive DFS order.',
  },
  {
    id: 19,
    category: 'Time & Space Complexity',
    difficulty: 'Intermediate',
    question: 'An undirected simple graph has V = 10 vertices and E = 9 edges, and is known to be connected. Which structural property MUST be true?',
    options: [
      'It is a tree (acyclic) and its graph density is 9 / 45 = 0.20',
      'It contains at least one cycle and has density 0.45',
      'It is a complete graph with density 1.00',
      'It has at least two isolated vertices',
    ],
    correctIndex: 0,
    explanation:
      'Any connected undirected graph with E = V - 1 (here 9 = 10 - 1) is minimally connected and therefore a tree (0 cycles, 1 component). Maximum undirected edges = 10 × 9 / 2 = 45, so density = 9 / 45 = 0.20.',
  },
  {
    id: 20,
    category: 'Isolated Vertices',
    difficulty: 'Intermediate',
    question: 'Suppose an undirected graph has V = 8 vertices, of which 3 vertices are isolated, and the remaining 5 vertices form a complete subgraph K₅. How many edges and connected components does the entire graph have?',
    options: [
      '10 edges and 4 connected components',
      '10 edges and 1 connected component',
      '20 edges and 4 connected components',
      '15 edges and 3 connected components',
    ],
    correctIndex: 0,
    explanation:
      'K₅ has 5 × 4 / 2 = 10 edges and forms 1 connected component. Each of the 3 isolated vertices contributes 0 edges and 1 singleton connected component. Total = 10 edges and 1 + 3 = 4 connected components.',
  },
  {
    id: 21,
    category: 'Algorithm Selection',
    difficulty: 'Intermediate',
    question: 'A road map has weighted edges representing highway distances in kilometers (e.g., 5 km, 42 km, 12 km). Does standard BFS guarantee the shortest-distance route in kilometers?',
    options: [
      'No — BFS minimizes the number of edges (hops), not the sum of arbitrary positive edge weights (Dijkstra’s algorithm is needed)',
      'Yes — BFS always minimizes weighted path cost for any positive weights',
      'No — Recursive DFS guarantees shortest weighted paths instead',
      'Yes, provided the graph is undirected',
    ],
    correctIndex: 0,
    explanation:
      'BFS treats every edge as 1 hop. A 1-edge highway of 100 km would be reached at Level 1 before a 2-edge route of 10 km + 10 km = 20 km at Level 2. For non-uniform non-negative weights, Dijkstra’s priority-queue algorithm is required.',
  },
  {
    id: 22,
    category: 'Algorithm Selection',
    difficulty: 'Advanced',
    question: 'In an emergency building evacuation planner where all corridor segments take equal traversal time (1 unit per corridor), how can BFS evaluate minimum evacuation steps to the NEAREST exit among k exits simultaneously?',
    options: [
      'Multi-source BFS: enqueue all k exit vertices at Level 0 initially and run a single O(V + E) BFS outward',
      'Run Recursive DFS k times from every room in O(k · V²)',
      'Sort vertices by degree and pick the highest-degree exit',
      'Check if the building graph has an Eulerian cycle',
    ],
    correctIndex: 0,
    explanation:
      'Multi-source BFS initializes the queue with all k exit nodes at distance 0 simultaneously. As the wave expands level-by-level, every room is reached for the first time from whichever exit is closest in hops, all in a single O(V + E) pass!',
  },
];
