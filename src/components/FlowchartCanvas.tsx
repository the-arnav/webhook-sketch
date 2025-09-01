
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

// Hierarchical tree layout algorithm
const calculateTreeLayout = (nodes: Node[], edges: Edge[]) => {
  // Build parent-child relationships
  const children: Record<string, string[]> = {};
  const parents: Record<string, string> = {};
  
  edges.forEach(edge => {
    if (!children[edge.source]) children[edge.source] = [];
    children[edge.source].push(edge.target);
    parents[edge.target] = edge.source;
  });

  // Find root nodes (nodes with no parents)
  const rootNodes = nodes.filter(node => !parents[node.id]);
  const positionedNodes: Record<string, { x: number; y: number }> = {};

  // Configuration for layout
  const config = {
    nodeWidth: 300,
    nodeHeight: 120,
    levelSpacing: 200,
    siblingSpacing: 80,
    minSpacing: 60
  };

  // Calculate positions using modified Reingold-Tilford algorithm
  const calculateSubtreePositions = (nodeId: string, level: number, parentXPos?: number): number => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return 0;

    const nodeChildren = children[nodeId] || [];
    
    if (nodeChildren.length === 0) {
      // Leaf node - position relative to parent or center
      const x = parentXPos !== undefined ? parentXPos : 0;
      positionedNodes[nodeId] = {
        x,
        y: level * config.levelSpacing
      };
      return config.nodeWidth;
    }

    // Calculate positions for children first
    let childrenWidth = 0;
    const childWidths: number[] = [];
    
    nodeChildren.forEach(childId => {
      const width = calculateSubtreePositions(childId, level + 1);
      childWidths.push(width);
      childrenWidth += width + config.siblingSpacing;
    });
    
    childrenWidth -= config.siblingSpacing; // Remove last spacing
    
    // Position children evenly
    let currentX = -(childrenWidth / 2);
    nodeChildren.forEach((childId, index) => {
      const childWidth = childWidths[index];
      const childCenterX = currentX + childWidth / 2;
      
      if (positionedNodes[childId]) {
        positionedNodes[childId].x = childCenterX;
      }
      
      currentX += childWidth + config.siblingSpacing;
    });

    // Position parent at center of children
    const parentX = parentXPos !== undefined ? parentXPos : 0;
    positionedNodes[nodeId] = {
      x: parentX,
      y: level * config.levelSpacing
    };

    return Math.max(childrenWidth, config.nodeWidth);
  };

  // Calculate positions for each root
  rootNodes.forEach((rootNode, index) => {
    const rootX = index * 400; // Space out multiple roots
    calculateSubtreePositions(rootNode.id, 0, rootX);
  });

  // Apply repelling forces to prevent overlaps
  const applyRepellingForces = () => {
    const iterations = 3;
    const repellingStrength = 50;
    
    for (let iter = 0; iter < iterations; iter++) {
      const forces: Record<string, { x: number; y: number }> = {};
      
      // Initialize forces
      Object.keys(positionedNodes).forEach(nodeId => {
        forces[nodeId] = { x: 0, y: 0 };
      });
      
      // Calculate repelling forces between all nodes
      const nodeIds = Object.keys(positionedNodes);
      for (let i = 0; i < nodeIds.length; i++) {
        for (let j = i + 1; j < nodeIds.length; j++) {
          const nodeA = nodeIds[i];
          const nodeB = nodeIds[j];
          const posA = positionedNodes[nodeA];
          const posB = positionedNodes[nodeB];
          
          const dx = posB.x - posA.x;
          const dy = posB.y - posA.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < config.minSpacing * 3) {
            const force = repellingStrength / (distance + 1);
            const forceX = (dx / distance) * force;
            const forceY = (dy / distance) * force * 0.3; // Reduce vertical repelling
            
            forces[nodeA].x -= forceX;
            forces[nodeA].y -= forceY;
            forces[nodeB].x += forceX;
            forces[nodeB].y += forceY;
          }
        }
      }
      
      // Apply forces with damping
      Object.keys(positionedNodes).forEach(nodeId => {
        positionedNodes[nodeId].x += forces[nodeId].x * 0.1;
        positionedNodes[nodeId].y += forces[nodeId].y * 0.1;
      });
    }
  };

  applyRepellingForces();

  // Update node positions
  return nodes.map(node => ({
    ...node,
    position: {
      x: positionedNodes[node.id]?.x || node.position.x,
      y: positionedNodes[node.id]?.y || node.position.y
    }
  }));
};

export const FlowchartCanvas = ({ data, subject, onSnapshot }: FlowchartCanvasProps) => {
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Define handleElaborate function at the top level
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
    const items = (Array.isArray(responseJson) && responseJson[0]?.output?.items)
      ? responseJson[0].output.items
      : (responseJson?.output?.items || responseJson?.items || (Array.isArray(responseJson) ? responseJson : []));

    if (!Array.isArray(items) || items.length === 0) return;

    setNodes(prevNodes => {
      const parent = prevNodes.find(n => n.id === parentNodeId);
      if (!parent) return prevNodes;

      const existingIds = new Set(prevNodes.map(n => n.id));
      
      // Create new nodes without positioning (will be positioned by layout algorithm)
      const newNodes: Node[] = items.map((item: any, idx: number) => {
        const itemNumber = item.itemNumber ?? idx + 1;
        const id = `${parentNodeId}-${itemNumber}`;
        
        if (existingIds.has(id)) return null;
        
        return {
          id,
          type: 'description',
          position: { x: 0, y: 0 }, // Temporary position
          data: {
            description: item.description ?? 'No description',
            itemNumber,
            onElaborate: handleElaborate,
            isLoading: false,
            title: item.title ?? ''
          },
          draggable: true,
          selectable: true,
        } as Node;
      }).filter(Boolean) as Node[];

      const updatedNodes = [...prevNodes, ...newNodes];
      
      // Create new edges
      const newEdges: Edge[] = items.map((item: any, idx: number) => {
        const itemNumber = item.itemNumber ?? idx + 1;
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
      }).filter(Boolean) as Edge[];

      setEdges(prevEdges => {
        const allEdges = [...prevEdges, ...newEdges];
        
        // Apply tree layout to all nodes
        const layoutNodes = calculateTreeLayout(updatedNodes, allEdges);
        setNodes(layoutNodes);
        
        return allEdges;
      });

      return updatedNodes;
    });
  }, [handleElaborate]);

  // Generate nodes and edges from data - now handleElaborate is defined
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    console.log('Generating nodes from data:', data);
    
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    if (data.length === 0) {
      console.log('No data provided, returning empty nodes/edges');
      return { nodes, edges };
    }

    // Create the main Subject node at the root
    const subjectNodeId = 'subject-node';
    nodes.push({
      id: subjectNodeId,
      type: 'subject',
      position: { x: 0, y: 0 }, // Will be positioned by layout algorithm
      data: { 
        subject: subject || 'Main Topic'
      },
      draggable: true,
      selectable: true,
    });

    data.forEach((item, index) => {
      const titleNodeId = `title-${item.itemNumber}`;
      const descNodeId = `desc-${item.itemNumber}`;
      
      // Title node
      nodes.push({
        id: titleNodeId,
        type: 'title',
        position: { x: 0, y: 0 }, // Temporary position
        data: { 
          title: item.title,
          itemNumber: item.itemNumber,
          onElaborate: handleElaborate,
          isLoading: false
        },
        draggable: true,
        selectable: true,
      });

      // Description node
      nodes.push({
        id: descNodeId,
        type: 'description',
        position: { x: 0, y: 0 }, // Temporary position
        data: { 
          description: item.description,
          itemNumber: item.itemNumber,
          onElaborate: handleElaborate,
          isLoading: false
        },
        draggable: true,
        selectable: true,
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

    // Apply tree layout algorithm to position nodes properly
    const layoutNodes = calculateTreeLayout(nodes, edges);
    
    console.log('Generated nodes with layout:', layoutNodes);
    console.log('Generated edges:', edges);
    return { nodes: layoutNodes, edges };
  }, [data, subject, handleElaborate]);

  // Update nodes and edges when data changes
  useEffect(() => {
    console.log('Data changed, updating nodes and edges');
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Apply layout whenever nodes or edges change (for dynamic updates)
  useEffect(() => {
    if (nodes.length > 0 && edges.length > 0) {
      const layoutNodes = calculateTreeLayout(nodes, edges);
      // Only update if positions actually changed to avoid infinite loops
      const hasPositionChanges = layoutNodes.some((node, index) => {
        const currentNode = nodes[index];
        return !currentNode || 
               Math.abs(node.position.x - currentNode.position.x) > 1 ||
               Math.abs(node.position.y - currentNode.position.y) > 1;
      });
      
      if (hasPositionChanges) {
        setNodes(layoutNodes);
      }
    }
  }, [edges.length]); // Only re-layout when edge count changes

  // Emit snapshots whenever nodes or edges change
  useEffect(() => {
    if (nodes.length > 0 && onSnapshot) {
      console.log('Emitting snapshot with nodes:', nodes.length, 'edges:', edges.length);
      const completeSnapshot = {
        nodes: nodes.map(node => ({
          ...node,
          position: node.position,
          data: {
            ...node.data,
            ...(node.data.subject && { subject: node.data.subject }),
            ...(node.data.title && { title: node.data.title }),
            ...(node.data.description && { description: node.data.description }),
            ...(node.data.itemNumber && { itemNumber: node.data.itemNumber }),
          }
        })),
        edges: edges.map(edge => ({
          ...edge,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          style: edge.style,
          animated: edge.animated,
          type: edge.type,
          markerEnd: edge.markerEnd
        }))
      };
      onSnapshot(completeSnapshot);
    }
  }, [nodes, edges, onSnapshot]);

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
        fitViewOptions={{ 
          padding: 0.3, 
          minZoom: 0.2, 
          maxZoom: 1.2,
          includeHiddenNodes: false 
        }}
        minZoom={0.2}
        maxZoom={1.2}
        defaultEdgeOptions={{
          type: 'straight',
          animated: false,
        }}
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode={'Shift'}
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
