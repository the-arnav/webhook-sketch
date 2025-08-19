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
import { TitleNode } from './nodes/TitleNode';
import { DescriptionNode } from './nodes/DescriptionNode';

const nodeTypes = {
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
}

export const FlowchartCanvas = ({ data }: FlowchartCanvasProps) => {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    data.forEach((item, index) => {
      const titleNodeId = `title-${item.itemNumber}`;
      const descNodeId = `desc-${item.itemNumber}`;
      
      // Calculate positions for a nice layout
      const isRoot = item.itemNumber === 1;
      const angle = isRoot ? 0 : (index - 1) * (Math.PI * 2) / (data.length - 1);
      const radius = isRoot ? 0 : 400;
      
      const titleX = isRoot ? 0 : Math.cos(angle) * radius;
      const titleY = isRoot ? 0 : Math.sin(angle) * radius + 200;
      
      // Title node
      nodes.push({
        id: titleNodeId,
        type: 'title',
        position: { x: titleX, y: titleY },
        data: { 
          title: item.title,
          itemNumber: item.itemNumber,
          isRoot
        },
      });

      // Description node positioned below title
      nodes.push({
        id: descNodeId,
        type: 'description',
        position: { x: titleX, y: titleY + 120 },
        data: { 
          description: item.description,
          itemNumber: item.itemNumber
        },
      });

      // Edge from title to description
      edges.push({
        id: `title-desc-${item.itemNumber}`,
        source: titleNodeId,
        target: descNodeId,
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'var(--edge-color)', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'var(--edge-color)',
        },
      });

      // Connect non-root items to root
      if (!isRoot && data.length > 0) {
        edges.push({
          id: `root-${item.itemNumber}`,
          source: 'title-1',
          target: titleNodeId,
          type: 'smoothstep',
          animated: false,
          style: { stroke: 'var(--edge-color)', strokeWidth: 2, opacity: 0.6 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: 'var(--edge-color)',
          },
        });
      }
    });

    return { nodes, edges };
  }, [data]);

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
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
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