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
}

export const FlowchartCanvas = ({ data, subject }: FlowchartCanvasProps) => {
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());

  const { nodes: baseNodes, edges: baseEdges } = useMemo(() => {
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

  const [nodes, setNodes, onNodesChange] = useNodesState(baseNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(baseEdges);

  // Attach handlers and loading state to current nodes whenever either changes
  const attachHandlers = useCallback(() => {
    setNodes(prev => prev.map(n => {
      if (n.type === 'title') {
        return { ...n, data: { ...n.data, onElaborate: handleElaborate, isLoading: loadingNodes.has(n.id) } } as Node;
      }
      if (n.type === 'description') {
        return { ...n, data: { ...n.data, onElaborate: handleElaborate, isLoading: loadingNodes.has(n.id) } } as Node;
      }
      return n;
    }));
  }, [setNodes, loadingNodes]);

  // Ensure node buttons are wired and loading states reflected
  useEffect(() => {
    attachHandlers();
  }, [attachHandlers, baseNodes, loadingNodes]);

  const handleElaborateResponse = useCallback((parentNodeId: string, responseJson: any) => {
    // Prefer the specified shape: response[0].output.items
    const items = (Array.isArray(responseJson) && responseJson[0]?.output?.items)
      ? responseJson[0].output.items
      : (responseJson?.output?.items || responseJson?.items || (Array.isArray(responseJson) ? responseJson : []));

    if (!Array.isArray(items) || items.length === 0) return;

    setNodes(prevNodes => {
      const parent = prevNodes.find(n => n.id === parentNodeId);
      if (!parent) return prevNodes;

      const existingIds = new Set(prevNodes.map(n => n.id));

      // Determine how many children already exist for this parent to stagger rows
      const existingChildrenCount = prevNodes.filter(n => n.id.startsWith(`${parentNodeId}-`)).length;

      // Layout parameters
      const horizontalSpacing = 300; // distance between siblings
      const verticalSpacing = 500;   // distance from parent per row
      const rowIndex = Math.max(0, Math.floor(existingChildrenCount / Math.max(1, items.length)));
      const baseY = parent.position.y + verticalSpacing + rowIndex * verticalSpacing;

      const totalWidth = (items.length - 1) * horizontalSpacing;
      const startX = parent.position.x - totalWidth / 2;

      const newNodes: Node[] = items.map((item: any, idx: number) => {
        const itemNumber = item.itemNumber ?? idx + 1;
        const id = `${parentNodeId}-${itemNumber}`;
        const x = startX + idx * horizontalSpacing;
        const y = baseY + (idx % 2 === 0 ? 0 : 20); // slight stagger to avoid visual overlap
        return {
          id,
          type: 'description',
          position: { x, y },
          data: {
            description: item.description ?? 'No description',
            itemNumber,
            onElaborate: handleElaborate,
            isLoading: false,
            title: item.title ?? ''
          }
        } as Node;
      }).filter(n => !existingIds.has(n.id));

      if (newNodes.length === 0) return prevNodes;
      return [...prevNodes, ...newNodes];
    });

    setEdges(prevEdges => {
      const existingEdgeIds = new Set(prevEdges.map(e => e.id));
      const newEdges: Edge[] = items.map((item: any) => {
        const itemNumber = item.itemNumber ?? 0;
        const targetId = `${parentNodeId}-${itemNumber}`;
        const id = `${parentNodeId}->${targetId}`;
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
      }).filter(e => !existingEdgeIds.has(e.id));

      if (newEdges.length === 0) return prevEdges;
      return [...prevEdges, ...newEdges];
    });
  }, [setNodes, setEdges]);

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
  }, [loadingNodes, handleElaborateResponse]);

  // Removed duplicate nodes/edges calculation and state hooks that caused redeclaration

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