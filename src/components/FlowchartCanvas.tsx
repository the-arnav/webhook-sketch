import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SubjectNode } from './nodes/SubjectNode';
import { TitleNode } from './nodes/TitleNode';
import { DescriptionNode } from './nodes/DescriptionNode';

const nodeTypes = {
  subject: SubjectNode,
  title: TitleNode,
  description: DescriptionNode,
};

interface FlowchartData {
  itemNumber: number;
  title: string;
  description: string;
}

interface FlowchartCanvasProps {
  data: FlowchartData[];
  subject?: string;
}

export const FlowchartCanvas = ({ data, subject }: FlowchartCanvasProps) => {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    if (data.length === 0) return { nodes, edges };

    // Create the main Subject node at the top center
    const subjectNodeId = 'subject-node';
    nodes.push({
      id: subjectNodeId,
      type: 'subject',
      position: { x: 0, y: 0 },
      data: { 
        subject: subject || 'Main Topic'
      },
    });

    // Calculate layout for hierarchical structure with proper spacing
    const titleRowY = 350; // Increased distance below subject
    const descRowY = 650;  // Increased distance below titles
    const nodeSpacing = 400; // Increased horizontal spacing between nodes
    
    // Center the nodes horizontally
    const startX = -(data.length - 1) * nodeSpacing / 2;

    data.forEach((item, index) => {
      const titleNodeId = `title-${item.itemNumber}`;
      const descNodeId = `desc-${item.itemNumber}`;
      
      // Position title nodes in a horizontal row
      const titleX = startX + index * nodeSpacing;
      
      // Title node in middle row
      nodes.push({
        id: titleNodeId,
        type: 'title',
        position: { x: titleX, y: titleRowY },
        data: { 
          title: item.title,
          itemNumber: item.itemNumber
        },
      });

      // Description node directly below its title
      nodes.push({
        id: descNodeId,
        type: 'description',
        position: { x: titleX, y: descRowY },
        data: { 
          description: item.description,
          itemNumber: item.itemNumber
        },
      });

      // Edge from Subject to Title (from bottom of subject to top of title)
      edges.push({
        id: `subject-title-${item.itemNumber}`,
        source: subjectNodeId,
        sourceHandle: 'bottom',
        target: titleNodeId,
        targetHandle: 'top',
        type: 'straight',
        animated: true,
        style: { 
          stroke: 'hsl(270, 80%, 60%)', 
          strokeWidth: 3,
          filter: 'drop-shadow(0 0 15px hsl(270 80% 60% / 0.4))'
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'hsl(270, 80%, 60%)',
          width: 8,
          height: 8,
        },
      });

      // Edge from Title to Description (from bottom of title to top of description)
      edges.push({
        id: `title-desc-${item.itemNumber}`,
        source: titleNodeId,
        sourceHandle: 'bottom',
        target: descNodeId,
        targetHandle: 'top',
        type: 'straight',
        animated: false,
        style: { 
          stroke: 'hsl(260, 70%, 50%)', 
          strokeWidth: 2,
          opacity: 0.8,
          filter: 'drop-shadow(0 0 10px hsl(260 70% 50% / 0.3))'
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'hsl(260, 70%, 50%)',
          width: 6,
          height: 6,
        },
      });
    });

    return { nodes, edges };
  }, [data, subject]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-lg">Upload JSON data to visualize your flowchart</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3, minZoom: 0.3, maxZoom: 1.5 }}
        minZoom={0.3}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: 'straight',
          animated: false,
        }}
      >
        <Controls className="glass-panel" />
        <MiniMap 
          className="glass-panel"
          nodeColor={(node) => {
            if (node.type === 'subject') return '#a855f7';
            if (node.type === 'title') return '#8b5cf6';
            return '#6366f1';
          }}
          maskColor="rgba(0, 0, 0, 0.8)"
        />
        <Background 
          color="#64748b" 
          gap={20} 
          size={2}
          className="opacity-40"
        />
      </ReactFlow>
    </div>
  );
};