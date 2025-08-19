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

    // Create the central Subject node
    const subjectNodeId = 'subject-node';
    nodes.push({
      id: subjectNodeId,
      type: 'subject',
      position: { x: 0, y: 0 },
      data: { 
        subject: subject || 'Main Topic'
      },
    });

    data.forEach((item, index) => {
      const titleNodeId = `title-${item.itemNumber}`;
      const descNodeId = `desc-${item.itemNumber}`;
      
      // Calculate positions in a radial layout around the subject
      const angleStep = (Math.PI * 2) / data.length;
      const angle = index * angleStep;
      const radius = 350;
      
      const titleX = Math.cos(angle) * radius;
      const titleY = Math.sin(angle) * radius;
      
      // Title node positioned around the subject
      nodes.push({
        id: titleNodeId,
        type: 'title',
        position: { x: titleX, y: titleY },
        data: { 
          title: item.title,
          itemNumber: item.itemNumber
        },
      });

      // Description node positioned further out from the title
      const descRadius = 200;
      const descX = titleX + Math.cos(angle) * descRadius;
      const descY = titleY + Math.sin(angle) * descRadius;
      
      nodes.push({
        id: descNodeId,
        type: 'description',
        position: { x: descX, y: descY },
        data: { 
          description: item.description,
          itemNumber: item.itemNumber
        },
      });

      // Edge from Subject to Title
      edges.push({
        id: `subject-title-${item.itemNumber}`,
        source: subjectNodeId,
        target: titleNodeId,
        type: 'smoothstep',
        animated: true,
        style: { 
          stroke: 'var(--edge-color)', 
          strokeWidth: 3,
          filter: 'drop-shadow(0 0 10px hsl(263 70% 50% / 0.3))'
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'var(--edge-color)',
        },
      });

      // Edge from Title to Description
      edges.push({
        id: `title-desc-${item.itemNumber}`,
        source: titleNodeId,
        target: descNodeId,
        type: 'smoothstep',
        animated: false,
        style: { 
          stroke: 'var(--edge-color)', 
          strokeWidth: 2,
          opacity: 0.7
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'var(--edge-color)',
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
    <div className="w-full h-full">
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
          type: 'smoothstep',
          animated: true,
        }}
      >
        <Controls className="glass-panel" />
        <MiniMap 
          className="glass-panel"
          nodeColor={(node) => {
            if (node.type === 'title') return '#8b5cf6';
            return '#6366f1';
          }}
        />
        <Background color="#8b5cf6" gap={20} size={1} />
      </ReactFlow>
    </div>
  );
};