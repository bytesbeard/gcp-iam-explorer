
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { IAMNode, NodeType } from '../types';

interface CanvasProps {
  nodes: IAMNode[];
  isActionApplied: boolean;
  selectedNodeId: string | null;
  onNodeClick: (id: string) => void;
  scenarioId: string;
}

const Canvas: React.FC<CanvasProps> = ({ nodes, isActionApplied, selectedNodeId, onNodeClick, scenarioId }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const nodeData = nodes.map(d => ({ ...d }));

    // Define hierarchy links
    const links = nodeData
      .filter(n => n.parentId)
      .map(n => ({
        source: nodeData.find(p => p.id === n.parentId),
        target: n,
        type: 'hierarchy'
      }));

    // Add logic-based links for IAM bindings
    const iamLinks: any[] = [];
    if (isActionApplied) {
      if (scenarioId === 'deep-inheritance') {
        iamLinks.push({ source: nodeData.find(n => n.id === 'u-lead'), target: nodeData.find(n => n.id === 'f-prod'), type: 'iam-binding' });
      } else if (scenarioId === 'service-accounts') {
        iamLinks.push({ source: nodeData.find(n => n.id === 'u-dev'), target: nodeData.find(n => n.id === 'sa-loader'), type: 'iam-binding' });
      } else if (scenarioId === 'iam-deny') {
        iamLinks.push({ source: nodeData.find(n => n.id === 'org'), target: nodeData.find(n => n.id === 'u-contractor'), type: 'deny-binding' });
      } else if (scenarioId === 'iam-conditions') {
        iamLinks.push({ source: nodeData.find(n => n.id === 'u-intern'), target: nodeData.find(n => n.id === 'p-test'), type: 'conditional-binding' });
      }
    }

    const allLinks = [...links, ...iamLinks];

    // Force Simulation with Hierarchical Constraints
    const simulation = d3.forceSimulation(nodeData as any)
      .force("link", d3.forceLink(allLinks).distance(100))
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.1))
      // Strictly enforce Y based on depth
      .force("y", d3.forceY((d: any) => {
        const dpt = d.depth ?? 0;
        return 80 + (dpt * 120);
      }).strength(2))
      .force("collision", d3.forceCollide().radius(70));

    const link = svg.append("g")
      .selectAll("path")
      .data(allLinks)
      .enter().append("path")
      .attr("fill", "none")
      .attr("stroke", (d: any) => {
        if (d.type === 'deny-binding') return "#ef4444";
        if (d.type === 'conditional-binding') return "#f59e0b";
        return d.type === 'iam-binding' ? "#3b82f6" : "#cbd5e1";
      })
      .attr("stroke-width", (d: any) => d.type === 'hierarchy' ? 2 : 4)
      .attr("stroke-dasharray", (d: any) => d.type === 'hierarchy' ? "0" : "5,5")
      .attr("marker-end", (d: any) => d.type === 'hierarchy' ? "" : "url(#arrow)");

    // Arrow marker for IAM direction
    svg.append("defs").append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 32)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
      .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#64748b");

    const node = svg.append("g")
      .selectAll("g")
      .data(nodeData)
      .enter().append("g")
      .attr("class", "cursor-pointer group")
      .on("click", (event, d: any) => onNodeClick(d.id))
      .call(d3.drag<SVGGElement, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    node.append("rect")
      .attr("width", 100)
      .attr("height", 40)
      .attr("x", -50)
      .attr("y", -20)
      .attr("rx", 6)
      .attr("fill", (d: any) => {
        switch (d.type) {
          case NodeType.ORGANIZATION: return "#0f172a";
          case NodeType.FOLDER: return "#334155";
          case NodeType.PROJECT: return "#0284c7";
          case NodeType.SERVICE_ACCOUNT: return "#7c3aed";
          case NodeType.USER: return "#059669";
          default: return "#94a3b8";
        }
      })
      .attr("stroke", (d: any) => d.id === selectedNodeId ? "#ef4444" : "transparent")
      .attr("stroke-width", 3);

    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "5")
      .attr("fill", "white")
      .attr("font-size", "10px")
      .attr("font-weight", "600")
      .attr("class", "pointer-events-none select-none")
      .text((d: any) => d.name);

    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-25")
      .attr("fill", "#64748b")
      .attr("font-size", "9px")
      .attr("font-weight", "bold")
      .attr("class", "uppercase tracking-tighter")
      .text((d: any) => d.type.replace('_', ' '));

    simulation.on("tick", () => {
      link.attr("d", (d: any) => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const dr = Math.sqrt(dx * dx + dy * dy) * (d.type === 'hierarchy' ? 0 : 1);
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
      });

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => simulation.stop();
  }, [nodes, isActionApplied, selectedNodeId, scenarioId]);

  return (
    <div className="w-full h-full relative bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-inner">
      <svg ref={svgRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 p-3 bg-white/80 backdrop-blur rounded-lg border border-slate-200 text-[10px] space-y-1">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-900"></div> Organization</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-600"></div> Folder</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-sky-600"></div> Project</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-600"></div> User</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-violet-600"></div> Service Account</div>
      </div>
    </div>
  );
};

export default Canvas;
