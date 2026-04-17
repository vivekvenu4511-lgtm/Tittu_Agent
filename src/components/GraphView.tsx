import { useEffect, useRef, useState, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Download,
  Filter,
  Edit3,
  Info,
  RotateCcw,
  Share2,
} from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";

interface GraphNode {
  id: string;
  label: string;
  type?: string;
  [key: string]: unknown;
}

interface GraphEdge {
  from: string;
  to: string;
  label?: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface GraphViewProps {
  initialData?: GraphData;
  editable?: boolean;
}

export function GraphView({ initialData, editable = false }: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [graphData, setGraphData] = useState<GraphData>(
    initialData || { nodes: [], edges: [] },
  );
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [editNode, setEditNode] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [filters, setFilters] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });

  const nodeTypes = [
    ...new Set(graphData.nodes.map((n) => n.type).filter(Boolean)),
  ];

  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    const filteredNodes =
      filters.size > 0
        ? graphData.nodes.filter((n) => !n.type || filters.has(n.type))
        : graphData.nodes;

    const nodePositions = new Map<string, { x: number; y: number }>();
    const centerX = canvas.width / 2 / zoom;
    const centerY = canvas.height / 2 / zoom;
    const radius = Math.min(centerX, centerY) * 0.7;
    const angleStep = (2 * Math.PI) / filteredNodes.length;

    filteredNodes.forEach((node, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      nodePositions.set(node.id, { x, y });
    });

    graphData.edges.forEach((edge) => {
      const from = nodePositions.get(edge.from);
      const to = nodePositions.get(edge.to);
      if (!from || !to) return;

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 2;
      ctx.stroke();

      if (edge.label) {
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        ctx.fillStyle = "#6b7280";
        ctx.font = "10px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(edge.label, midX, midY);
      }
    });

    const nodeRadius = 30;
    filteredNodes.forEach((node) => {
      const pos = nodePositions.get(node.id);
      if (!pos) return;

      const isSelected = selectedNode?.id === node.id;
      const isEditing = editNode === node.id;

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = isSelected ? "#6366f1" : "#f3f4f6";
      ctx.fill();
      ctx.strokeStyle = isSelected ? "#6366f1" : "#d1d5db";
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      ctx.fillStyle = isSelected ? "#ffffff" : "#374151";
      ctx.font = "11px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const label = node.label.slice(0, 15);
      ctx.fillText(label, pos.x, pos.y);
    });

    ctx.restore();
  }, [graphData, selectedNode, editNode, filters, zoom, pan]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;

    const resize = () => {
      canvas.width = containerRef.current!.clientWidth;
      canvas.height = containerRef.current!.clientHeight;
      drawGraph();
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [drawGraph]);

  useEffect(() => {
    drawGraph();
  }, [drawGraph]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    const filteredNodes =
      filters.size > 0
        ? graphData.nodes.filter((n) => !n.type || filters.has(n.type))
        : graphData.nodes;
    const centerX = canvas.width / 2 / zoom;
    const centerY = canvas.height / 2 / zoom;
    const radius = Math.min(centerX, centerY) * 0.7;
    const angleStep = (2 * Math.PI) / filteredNodes.length;

    let clickedNode: GraphNode | null = null;
    filteredNodes.forEach((node, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const nodeX = centerX + radius * Math.cos(angle);
      const nodeY = centerY + radius * Math.sin(angle);
      const dist = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2);
      if (dist < 30) {
        clickedNode = node;
      }
    });

    setSelectedNode(clickedNode);
  };

  const handleNodeDoubleClick = (nodeId: string) => {
    if (!editable) return;
    const node = graphData.nodes.find((n) => n.id === nodeId);
    if (node) {
      setEditNode(nodeId);
      setEditLabel(node.label);
    }
  };

  const handleSaveEdit = () => {
    if (!editNode) return;
    setGraphData((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === editNode ? { ...n, label: editLabel } : n,
      ),
    }));
    setEditNode(null);
    setEditLabel("");
    toast.success("Node updated");
  };

  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = "graph.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Exported PNG");
  };

  const exportSVG = () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "800");
    svg.setAttribute("height", "600");
    svg.setAttribute("viewBox", "0 0 800 600");

    graphData.nodes.forEach((node, i) => {
      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle",
      );
      const cx =
        400 +
        200 *
          Math.cos((i * 2 * Math.PI) / graphData.nodes.length - Math.PI / 2);
      const cy =
        300 +
        200 *
          Math.sin((i * 2 * Math.PI) / graphData.nodes.length - Math.PI / 2);
      circle.setAttribute("cx", String(cx));
      circle.setAttribute("cy", String(cy));
      circle.setAttribute("r", "30");
      circle.setAttribute("fill", "#f3f4f6");
      circle.setAttribute("stroke", "#d1d5db");
      svg.appendChild(circle);

      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text",
      );
      text.setAttribute("x", String(cx));
      text.setAttribute("y", String(cy));
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
      text.setAttribute("font-size", "11");
      text.textContent = node.label.slice(0, 15);
      svg.appendChild(text);
    });

    const blob = new Blob([new XMLSerializer().serializeToString(svg)], {
      type: "image/svg+xml",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "graph.svg";
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Exported SVG");
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(graphData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "graph.json";
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Exported JSON");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.1, 3))}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.1, 0.3))}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            title="Reset View"
          >
            <Maximize size={16} />
          </button>
        </div>

        <div className="h-6 w-px bg-gray-200" />

        {nodeTypes.length > 0 && (
          <div className="flex items-center gap-1">
            <Filter size={14} className="text-gray-400" />
            <select
              onChange={(e) => {
                const value = e.target.value;
                if (value === "all") {
                  setFilters(new Set());
                } else {
                  setFilters(new Set([value]));
                }
              }}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1"
            >
              <option value="all">All types</option>
              {nodeTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <button
            onClick={exportPNG}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            title="Export PNG"
          >
            <Download size={16} />
          </button>
          <button
            onClick={exportSVG}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            title="Export SVG"
          >
            <Share2 size={16} />
          </button>
          <button
            onClick={exportJSON}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            title="Export JSON"
          >
            <Edit3 size={16} />
          </button>
        </div>
      </div>

      {/* Graph Canvas */}
      <div ref={containerRef} className="flex-1 relative bg-gray-50">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="absolute inset-0 w-full h-full cursor-pointer"
        />

        {graphData.nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Info size={32} className="mx-auto mb-2" />
              <p>No graph data to display</p>
              <p className="text-sm">
                Send a request to generate a knowledge graph
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Node Details Panel */}
      {selectedNode && (
        <div className="absolute bottom-4 right-4 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">Node Details</h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-xs text-gray-500">Label</span>
              <p className="text-sm text-gray-900">{selectedNode.label}</p>
            </div>
            {selectedNode.type && (
              <div>
                <span className="text-xs text-gray-500">Type</span>
                <p className="text-sm text-gray-900">{selectedNode.type}</p>
              </div>
            )}
            {editable && (
              <button
                onClick={() => handleNodeDoubleClick(selectedNode.id)}
                className="w-full mt-2 px-3 py-1.5 text-sm font-medium text-[var(--color-primary)] bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 rounded-lg"
              >
                Edit Label
              </button>
            )}
          </div>
        </div>
      )}

      {/* Edit Node Modal */}
      {editNode && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-lg shadow-xl p-4 w-80">
            <h3 className="font-medium text-gray-900 mb-3">Edit Node Label</h3>
            <input
              type="text"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-3"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditNode(null)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1.5 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
