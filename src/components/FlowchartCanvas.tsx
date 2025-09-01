
import { useCallback, useEffect, useMemo, useState } from 'react';
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
  onSnapshot?: (snapshot: { nodes: Node[]; edges: Edge[] }) => void;
}

export const FlowchartCanvas = ({ data, subject, onSnapshot }: FlowchartCanvasProps) => {
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());

  // Generate nodes and edges from data
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    console.log('Generating nodes from data:', data);
    
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    if (data.length === 0) {
      console.log('No data provided, returning empty nodes/edges');
      return { nodes, edges };
    }

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
    const titleRowY = 350; // Distance below subject
    const descRowY = 650;  // Distance below titles
    const nodeSpacing = 400; // Horizontal spacing between nodes
    
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
          itemNumber: item.itemNumber,
          onElaborate: () => {},
          isLoading: false
        },
      });

      // Description node directly below its title
      nodes.push({
        id: descNodeId,
        type: 'description',
        position: { x: titleX, y: descRowY },
        data: { 
          description: item.description,
          itemNumber: item.itemNumber,
          onElaborate: () => {},
          isLoading: false
        },
      });

      // Edge from Subject to Title
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

      // Edge from Title to Description
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

    console.log('Generated nodes:', nodes);
    console.log('Generated edges:', edges);
    return { nodes, edges };
  }, [data, subject]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when data changes
  useEffect(() => {
    console.log('Data changed, updating nodes and edges');
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Attach handlers to nodes
  useEffect(() => {
    setNodes(prevNodes => prevNodes.map(node => {
      if (node.type === 'title' || node.type === 'description') {
        return {
          ...node,
          data: {
            ...node.data,
            onElaborate: handleElaborate,
            isLoading: loadingNodes.has(node.id)
          }
        };
      }
      return node;
    }));
  }, [loadingNodes]);

  // Emit snapshots when nodes/edges change
  useEffect(() => {
    if (nodes.length > 0 && onSnapshot) {
      onSnapshot({ nodes, edges });
    }
  }, [nodes, edges, onSnapshot]);

  const handleElaborate = useCallback(async (nodeId: string, content: string) => {
    if (loadingNodes.has(nodeId)) {
      return;
    }

    setLoadingNodes(prev => new Set([...prev, nodeId]));

    try {
      const response = await fetch('https://officially-probable-hamster.ngrok-free.app/webhook/e7fac30b-bd9d-4a8c-a1b1-38ba4ec19c9a', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ prompt: content }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('Elaborate response:', result);
      handleElaborateResponse(nodeId, result);
    } catch (error) {
      console.error('Error elaborating node:', error);
      alert('Failed to elaborate. Please try again.');
    } finally {
      setLoadingNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(nodeId);
        return newSet;
      });
    }
  }, [loadingNodes]);

  const handleElaborateResponse = useCallback((parentNodeId: string, responseJson: any) => {
    // Extract items from response
    const items = (Array.isArray(responseJson) && responseJson[0]?.output?.items)
      ? responseJson[0].output.items
      : (responseJson?.output?.items || responseJson?.items || (Array.isArray(responseJson) ? responseJson : []));

    if (!Array.isArray(items) || items.length === 0) return;

    setNodes(prevNodes => {
      const parent = prevNodes.find(n => n.id === parentNodeId);
      if (!parent) return prevNodes;

      const existingIds = new Set(prevNodes.map(n => n.id));
      const verticalSpacing = 300;
      const horizontalSpacing = 320;
      const baseY = parent.position.y + verticalSpacing;

      const newNodes: Node[] = items.map((item: any, idx: number) => {
        const itemNumber = item.itemNumber ?? idx + 1;
        const id = `${parentNodeId}-${itemNumber}`;
        
        if (existingIds.has(id)) return null;

        const x = parent.position.x + (idx - (items.length - 1) / 2) * horizontalSpacing;
        
        return {
          id,
          type: 'description',
          position: { x, y: baseY },
          data: {
            description: item.description ?? 'No description',
            itemNumber,
            onElaborate: handleElaborate,
            isLoading: false,
            title: item.title ?? ''
          }
        } as Node;
      }).filter(Boolean) as Node[];

      return [...prevNodes, ...newNodes];
    });

    setEdges(prevEdges => {
      const existingEdgeIds = new Set(prevEdges.map(e => e.id));
      const newEdges: Edge[] = items.map((item: any, idx: number) => {
        const itemNumber = item.itemNumber ?? idx + 1;
        const targetId = `${parentNodeId}-${itemNumber}`;
        const id = `${parentNodeId}->${targetId}`;
        
        if (existingEdgeIds.has(id)) return null;
        
        return {
          id,
          source: parentNodeId,
          sourceHandle: 'bottom',
          target: targetId,
          targetHandle: 'top',
          type: 'straight',
          animated: false,
          style: { 
            stroke: 'hsl(280, 60%, 45%)', 
            strokeWidth: 2,
            opacity: 0.7,
            filter: 'drop-shadow(0 0 8px hsl(280 60% 45% / 0.3))'
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: 'hsl(280, 60%, 45%)',
            width: 6,
            height: 6,
          },
        } as Edge;
      }).filter(Boolean) as Edge[];

      return [...prevEdges, ...newEdges];
    });
  }, [handleElaborate]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  console.log('Rendering FlowchartCanvas with nodes:', nodes.length, 'edges:', edges.length);

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
        fitViewOptions={{ padding: 0.3, minZoom: 0.1, maxZoom: 1.5 }}
        minZoom={0.1}
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
