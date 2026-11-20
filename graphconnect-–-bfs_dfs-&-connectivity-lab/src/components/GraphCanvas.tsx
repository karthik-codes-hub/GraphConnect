import React, { useId, useRef, useState } from 'react';
import { GraphData, GraphNode } from '../types/graph';

export type BuilderTool = 'select' | 'add-vertex' | 'add-edge' | 'delete';

export interface GraphCanvasProps {
  graph: GraphData;
  heightClass?: string;
  /** Interactive editing props (used in Graph Builder) */
  editable?: boolean;
  activeTool?: BuilderTool;
  selectedNodeId?: string | null;
  selectedEdgeId?: string | null;
  pendingEdgeSourceId?: string | null;
  onCanvasAddNode?: (x: number, y: number) => void;
  onNodeClick?: (nodeId: string) => void;
  onEdgeClick?: (edgeId: string) => void;
  onNodeMove?: (nodeId: string, x: number, y: number) => void;
  onNodeDragEnd?: () => void;

  /** Visualization & analysis highlight props */
  activeNodeId?: string | null;
  isBacktracking?: boolean;
  visitedIds?: string[];
  frontierIds?: string[];
  exploringEdgeId?: string | null;
  treeEdgeIds?: string[];
  highlightedPathNodeIds?: string[];
  highlightedPathEdgeIds?: string[];
  cycleEdgeIds?: string[];
  componentMap?: Record<string, { index: number; color: string }>;
  nodeAnnotations?: Record<string, string>;
  accentVariant?: 'cyan' | 'violet' | 'blue' | 'emerald';
  emptyMessage?: string;
}

const VIEW_W = 720;
const VIEW_H = 460;
const NODE_RADIUS = 22;

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  graph,
  heightClass = 'h-[430px]',
  editable = false,
  activeTool = 'select',
  selectedNodeId = null,
  selectedEdgeId = null,
  pendingEdgeSourceId = null,
  onCanvasAddNode,
  onNodeClick,
  onEdgeClick,
  onNodeMove,
  onNodeDragEnd,
  activeNodeId = null,
  isBacktracking = false,
  visitedIds = [],
  frontierIds = [],
  exploringEdgeId = null,
  treeEdgeIds = [],
  highlightedPathNodeIds = [],
  highlightedPathEdgeIds = [],
  cycleEdgeIds = [],
  componentMap,
  nodeAnnotations,
  accentVariant = 'blue',
  emptyMessage = 'No vertices in graph. Click on the canvas or load a sample preset to begin.',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const markerUid = useId().replace(/:/g, '');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragMovedRef = useRef(false);

  const nodeMap = new Map<string, GraphNode>(graph.nodes.map((n) => [n.id, n]));
  const visitedOrderMap = new Map<string, number>();
  visitedIds.forEach((id, idx) => visitedOrderMap.set(id, idx + 1));

  const frontierSet = new Set(frontierIds);
  const treeEdgeSet = new Set(treeEdgeIds);
  const pathNodeSet = new Set(highlightedPathNodeIds);
  const pathEdgeSet = new Set(highlightedPathEdgeIds);
  const cycleEdgeSet = new Set(cycleEdgeIds);

  // Detect antiparallel directed edges (u->v and v->u) so we curve them cleanly
  const directedPairSet = new Set(
    graph.directed ? graph.edges.map((e) => `${e.source}->${e.target}`) : []
  );

  const clientToSvgCoords = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: VIEW_W / 2, y: VIEW_H / 2 };
    const rect = svg.getBoundingClientRect();
    const scaleX = VIEW_W / Math.max(1, rect.width);
    const scaleY = VIEW_H / Math.max(1, rect.height);
    const x = Math.min(
      VIEW_W - 32,
      Math.max(32, Math.round((clientX - rect.left) * scaleX))
    );
    const y = Math.min(
      VIEW_H - 32,
      Math.max(32, Math.round((clientY - rect.top) * scaleY))
    );
    return { x, y };
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!editable) return;
    if (e.target !== svgRef.current && !(e.target as Element).hasAttribute('data-bg')) {
      return;
    }
    if (activeTool === 'add-vertex' && onCanvasAddNode) {
      const { x, y } = clientToSvgCoords(e.clientX, e.clientY);
      onCanvasAddNode(x, y);
    }
  };

  const handleSvgDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!editable || !onCanvasAddNode) return;
    if (e.target !== svgRef.current && !(e.target as Element).hasAttribute('data-bg')) {
      return;
    }
    const { x, y } = clientToSvgCoords(e.clientX, e.clientY);
    onCanvasAddNode(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!editable || !draggingId || !onNodeMove) return;
    dragMovedRef.current = true;
    const { x, y } = clientToSvgCoords(e.clientX, e.clientY);
    onNodeMove(draggingId, x, y);
  };

  const handlePointerUp = () => {
    if (draggingId) {
      if (dragMovedRef.current && onNodeDragEnd) {
        onNodeDragEnd();
      }
      setDraggingId(null);
      dragMovedRef.current = false;
    }
  };

  const primaryVisitedFill =
    accentVariant === 'cyan'
      ? '#0891B2'
      : accentVariant === 'violet'
      ? '#7C3AED'
      : accentVariant === 'emerald'
      ? '#059669'
      : '#2563EB';

  const treeStrokeColor =
    accentVariant === 'cyan'
      ? '#06B6D4'
      : accentVariant === 'violet'
      ? '#8B5CF6'
      : '#3B82F6';

  return (
    <div
      data-testid="graph-canvas"
      data-vertex-count={graph.nodes.length}
      data-edge-count={graph.edges.length}
      className={`relative w-full ${heightClass} rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1526] overflow-hidden select-none`}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label={`Interactive visualization of ${graph.name} with ${graph.nodes.length} vertices and ${graph.edges.length} edges`}
        onClick={handleSvgClick}
        onDoubleClick={handleSvgDoubleClick}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`w-full h-full ${
          editable && activeTool === 'add-vertex'
            ? 'cursor-crosshair'
            : draggingId
            ? 'cursor-grabbing'
            : 'cursor-default'
        }`}
      >
        <defs>
          <pattern
            id={`grid-${markerUid}`}
            width="36"
            height="36"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 36 0 L 0 0 0 36"
              fill="none"
              className="stroke-slate-200/70 dark:stroke-slate-800/60"
              strokeWidth="1"
            />
          </pattern>

          <marker
            id={`arrow-default-${markerUid}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6.5"
            markerHeight="6.5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#64748B" />
          </marker>

          <marker
            id={`arrow-active-${markerUid}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#F59E0B" />
          </marker>

          <marker
            id={`arrow-tree-${markerUid}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={treeStrokeColor} />
          </marker>

          <marker
            id={`arrow-path-${markerUid}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#10B981" />
          </marker>

          <marker
            id={`arrow-cycle-${markerUid}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#EF4444" />
          </marker>
        </defs>

        {/* Subtle coordinate grid backdrop */}
        <rect
          data-bg="true"
          x="0"
          y="0"
          width={VIEW_W}
          height={VIEW_H}
          fill={`url(#grid-${markerUid})`}
        />

        {/* Edges Layer */}
        <g>
          {graph.edges.map((edge) => {
            const u = nodeMap.get(edge.source);
            const v = nodeMap.get(edge.target);
            if (!u || !v) return null;

            const dx = v.x - u.x;
            const dy = v.y - u.y;
            const dist = Math.max(1, Math.hypot(dx, dy));
            const ux = dx / dist;
            const uy = dy / dist;

            const hasReverse =
              graph.directed && directedPairSet.has(`${edge.target}->${edge.source}`);
            const curveOffset = hasReverse ? 22 : 0;
            const nx = -uy * curveOffset;
            const ny = ux * curveOffset;

            const startPad = NODE_RADIUS + 2;
            const endPad = graph.directed ? NODE_RADIUS + 6 : NODE_RADIUS + 2;

            const x1 = u.x + ux * startPad + nx * 0.35;
            const y1 = u.y + uy * startPad + ny * 0.35;
            const x2 = v.x - ux * endPad + nx * 0.35;
            const y2 = v.y - uy * endPad + ny * 0.35;
            const cx = (u.x + v.x) / 2 + nx;
            const cy = (u.y + v.y) / 2 + ny;

            const isExploring = exploringEdgeId === edge.id;
            const isSelected = selectedEdgeId === edge.id;
            const isPath = pathEdgeSet.has(edge.id);
            const isCycle = cycleEdgeSet.has(edge.id);
            const isTree = treeEdgeSet.has(edge.id);

            let stroke = '#64748B';
            let strokeWidth = 2;
            let strokeDasharray: string | undefined;
            let markerEnd: string | undefined = graph.directed
              ? `url(#arrow-default-${markerUid})`
              : undefined;

            if (isExploring) {
              stroke = '#F59E0B';
              strokeWidth = 3.6;
              markerEnd = graph.directed ? `url(#arrow-active-${markerUid})` : undefined;
            } else if (isCycle) {
              stroke = '#EF4444';
              strokeWidth = 3.2;
              markerEnd = graph.directed ? `url(#arrow-cycle-${markerUid})` : undefined;
            } else if (isPath) {
              stroke = '#10B981';
              strokeWidth = 3.4;
              markerEnd = graph.directed ? `url(#arrow-path-${markerUid})` : undefined;
            } else if (isTree) {
              stroke = treeStrokeColor;
              strokeWidth = 3;
              markerEnd = graph.directed ? `url(#arrow-tree-${markerUid})` : undefined;
            } else if (isSelected) {
              stroke = '#3B82F6';
              strokeWidth = 3.2;
              strokeDasharray = '5 3';
            }

            const pathD = hasReverse
              ? `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`
              : `M ${x1} ${y1} L ${x2} ${y2}`;

            const labelX = hasReverse ? (x1 + 2 * cx + x2) / 4 : (x1 + x2) / 2;
            const labelY = hasReverse ? (y1 + 2 * cy + y2) / 4 : (y1 + y2) / 2;

            return (
              <g
                key={edge.id}
                onClick={(ev) => {
                  ev.stopPropagation();
                  if (onEdgeClick) onEdgeClick(edge.id);
                }}
                className={editable || onEdgeClick ? 'cursor-pointer' : undefined}
              >
                {/* Invisible wider hit target for easy clicking */}
                <path
                  d={pathD}
                  stroke="transparent"
                  strokeWidth={14}
                  fill="none"
                />
                <path
                  d={pathD}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeLinecap="round"
                  fill="none"
                  markerEnd={markerEnd}
                />
                {graph.weighted && (
                  <g transform={`translate(${labelX}, ${labelY})`}>
                    <rect
                      x={-13}
                      y={-10}
                      width={26}
                      height={20}
                      rx={4}
                      className="fill-slate-100 dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700"
                      strokeWidth={1}
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="text-[11px] font-mono font-semibold fill-slate-700 dark:fill-slate-200"
                    >
                      {edge.weight}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* Vertices Layer */}
        <g>
          {graph.nodes.map((node) => {
            const visitOrder = visitedOrderMap.get(node.id);
            const isVisited = visitOrder !== undefined;
            const isActive = activeNodeId === node.id;
            const isFrontier = frontierSet.has(node.label) || frontierSet.has(node.id);
            const isSelected = selectedNodeId === node.id;
            const isPendingSource = pendingEdgeSourceId === node.id;
            const isPathNode = pathNodeSet.has(node.id);
            const compInfo = componentMap?.[node.id];
            const annotation = nodeAnnotations?.[node.id];

            let fill = '#1E293B';
            let stroke = '#475569';
            let textFill = '#F8FAFC';

            if (compInfo) {
              fill = compInfo.color;
              stroke = '#F8FAFC';
              textFill = '#FFFFFF';
            } else if (isActive) {
              fill = isBacktracking ? '#D97706' : '#2563EB';
              stroke = '#FDE68A';
              textFill = '#FFFFFF';
            } else if (isPathNode) {
              fill = '#059669';
              stroke = '#A7F3D0';
              textFill = '#FFFFFF';
            } else if (isVisited) {
              fill = primaryVisitedFill;
              stroke = '#E0F2FE';
              textFill = '#FFFFFF';
            }

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onPointerDown={(ev) => {
                  if (!editable || activeTool !== 'select') return;
                  ev.stopPropagation();
                  dragMovedRef.current = false;
                  setDraggingId(node.id);
                }}
                onClick={(ev) => {
                  ev.stopPropagation();
                  if (onNodeClick) onNodeClick(node.id);
                }}
                className={
                  editable
                    ? activeTool === 'select'
                      ? 'cursor-grab'
                      : 'cursor-pointer'
                    : onNodeClick
                    ? 'cursor-pointer'
                    : undefined
                }
              >
                {/* Outer halo for active, selected, pending edge source, or frontier */}
                {(isActive || isSelected || isPendingSource || isFrontier) && (
                  <circle
                    r={NODE_RADIUS + 7}
                    fill="none"
                    stroke={
                      isPendingSource
                        ? '#06B6D4'
                        : isActive
                        ? isBacktracking
                          ? '#F59E0B'
                          : '#38BDF8'
                        : isSelected
                        ? '#3B82F6'
                        : '#8B5CF6'
                    }
                    strokeWidth={2.5}
                    strokeDasharray={isFrontier && !isActive ? '4 3' : undefined}
                  />
                )}

                {/* Main vertex circle */}
                <circle
                  r={NODE_RADIUS}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={2.2}
                />

                {/* Vertex Label */}
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={textFill}
                  className="text-[13px] font-display font-bold pointer-events-none"
                >
                  {node.label}
                </text>

                {/* Visit Order Badge (#1, #2...) for non-hue-only state signaling */}
                {visitOrder !== undefined && (
                  <g transform={`translate(${NODE_RADIUS - 4}, ${-NODE_RADIUS + 4})`}>
                    <circle
                      r={9.5}
                      className="fill-slate-900 dark:fill-slate-950 stroke-slate-200 dark:stroke-slate-600"
                      strokeWidth={1.2}
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="text-[9.5px] font-mono font-semibold fill-amber-300 pointer-events-none"
                    >
                      {visitOrder}
                    </text>
                  </g>
                )}

                {/* Component ID tag (C1, C2...) when viewing connected components */}
                {compInfo && visitOrder === undefined && (
                  <g transform={`translate(${NODE_RADIUS - 3}, ${-NODE_RADIUS + 3})`}>
                    <rect
                      x={-11}
                      y={-8}
                      width={22}
                      height={16}
                      rx={4}
                      className="fill-slate-900 stroke-white/60"
                      strokeWidth={1}
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="text-[9px] font-mono font-semibold fill-white pointer-events-none"
                    >
                      C{compInfo.index}
                    </text>
                  </g>
                )}

                {/* Optional Level / Depth / Degree annotation below vertex */}
                {annotation && (
                  <text
                    y={NODE_RADIUS + 20}
                    textAnchor="middle"
                    className="text-[10.5px] font-mono font-medium fill-slate-600 dark:fill-slate-300 pointer-events-none"
                  >
                    {annotation}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Empty graph instructional state */}
      {graph.nodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 max-w-md">
            {emptyMessage}
          </p>
        </div>
      )}
    </div>
  );
};
