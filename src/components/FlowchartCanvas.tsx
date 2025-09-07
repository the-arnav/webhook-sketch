
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
import { Button } from '@/components/ui/button';
import { RotateCcw, Sparkles } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

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

// Simple hierarchical layout for proper flowchart structure
const calculateTreeLayout = (nodes: Node[], edges: Edge[], customHorizontalSpacing?: number, customVerticalSpacing?: number) => {
  const children: Record<string, string[]> = {};
  const parents: Record<string, string> = {};
  
  edges.forEach(edge => {
    if (!children[edge.source]) children[edge.source] = [];
    children[edge.source].push(edge.target);
    parents[edge.target] = edge.source;
  });

  const positionedNodes: Record<string, { x: number; y: number }> = {};
  const config = {
    nodeWidth: 300,
    nodeHeight: 150,
    levelSpacing: customVerticalSpacing || 200,
    siblingSpacing: customHorizontalSpacing || 350
  };

  // Find root node (subject)
  const rootNode = nodes.find(node => node.type === 'subject');
  if (!rootNode) return nodes;

  // Position root at center
  positionedNodes[rootNode.id] = { x: 0, y: 0 };

  // Get direct children of root (title nodes)
  const titleChildren = children[rootNode.id] || [];
  
  // Position title nodes horizontally below subject
  titleChildren.forEach((titleId, index) => {
    const totalWidth = (titleChildren.length - 1) * config.siblingSpacing;
    const startX = -totalWidth / 2;
    const x = startX + (index * config.siblingSpacing);
    
    positionedNodes[titleId] = {
      x: x,
      y: config.levelSpacing
    };

    // Position description nodes directly below their title nodes
    const descChildren = children[titleId] || [];
    descChildren.forEach((descId, descIndex) => {
      positionedNodes[descId] = {
        x: x,
        y: config.levelSpacing * 2
      };

      // Position elaborated child nodes below description nodes
      const elaboratedChildren = children[descId] || [];
      elaboratedChildren.forEach((childId, childIndex) => {
        const childTotalWidth = (elaboratedChildren.length - 1) * 280;
        const childStartX = x - childTotalWidth / 2;
        positionedNodes[childId] = {
          x: childStartX + (childIndex * 280),
          y: config.levelSpacing * 3
        };
      });
    });
  });

  return nodes.map(node => ({
    ...node,
    position: {
      x: positionedNodes[node.id]?.x || node.position.x,
      y: positionedNodes[node.id]?.y || node.position.y
    }
  }));
};

export const FlowchartCanvas = ({ data, subject, onSnapshot }: FlowchartCanvasProps) => {
  const { horizontalSpacing, verticalSpacing } = useSettings();
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const handleElaborate = useCallback(async (nodeId: string, content: string) => {
    if (loadingNodes.has(nodeId)) {
      return;
    }

    // Set loading state for the specific node
    setLoadingNodes(prev => new Set([...prev, nodeId]));
    
    // Update the node to show loading state
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId 
          ? { ...node, data: { ...node.data, isLoading: true } }
          : node
      )
    );

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
      // Remove loading state
      setLoadingNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(nodeId);
        return newSet;
      });
      
      // Update node to remove loading state
      setNodes(prevNodes => 
        prevNodes.map(node => 
          node.id === nodeId 
            ? { ...node, data: { ...node.data, isLoading: false } }
            : node
        )
      );
    }
  }, [loadingNodes]);

  const handleElaborateResponse = useCallback((parentNodeId: string, responseJson: any) => {
    const items = (Array.isArray(responseJson) && responseJson[0]?.output?.items)
      ? responseJson[0].output.items
      : (responseJson?.output?.items || responseJson?.items || (Array.isArray(responseJson) ? responseJson : []));

    if (!Array.isArray(items) || items.length === 0) {
      console.log('No items found in response:', responseJson);
      return;
    }

    console.log('Processing elaborate response with', items.length, 'items');

    // Create new child nodes
    const newNodes: Node[] = items.map((item: any, idx: number) => {
      const itemNumber = item.itemNumber ?? idx + 1;
      const id = `${parentNodeId}-child-${itemNumber}`;
      
      return {
        id,
        type: 'description',
        position: { x: 0, y: 0 }, // Will be positioned by layout
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
    });

    // Create new edges connecting parent to children
    const newEdges: Edge[] = items.map((item: any, idx: number) => {
      const itemNumber = item.itemNumber ?? idx + 1;
      const targetId = `${parentNodeId}-child-${itemNumber}`;
      const edgeId = `${parentNodeId}->${targetId}`;
      
      return {
        id: edgeId,
        source: parentNodeId,
        sourceHandle: 'bottom',
        target: targetId,
        targetHandle: 'top',
        type: 'straight',
        animated: false,
        style: { 
          stroke: 'hsl(var(--primary))', 
          strokeWidth: 2,
          opacity: 0.7,
          filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.3))'
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'hsl(var(--primary))',
          width: 6,
          height: 6,
        },
      } as Edge;
    });

    // Update nodes and edges
    setNodes(prevNodes => {
      const existingIds = new Set(prevNodes.map(n => n.id));
      const filteredNewNodes = newNodes.filter(node => !existingIds.has(node.id));
      return [...prevNodes, ...filteredNewNodes];
    });

    setEdges(prevEdges => {
      const existingEdgeIds = new Set(prevEdges.map(e => e.id));
      const filteredNewEdges = newEdges.filter(edge => !existingEdgeIds.has(edge.id));
      const allEdges = [...prevEdges, ...filteredNewEdges];
      
      // Recalculate layout after adding new nodes
      setTimeout(() => {
        setNodes(currentNodes => {
          const layoutNodes = calculateTreeLayout(currentNodes, allEdges, horizontalSpacing, verticalSpacing);
          return layoutNodes;
        });
      }, 100);
      
      return allEdges;
    });

    console.log('Added', newNodes.length, 'child nodes to parent:', parentNodeId);
  }, [handleElaborate, horizontalSpacing, verticalSpacing]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes(prevNodes => {
      const nodesToDelete = new Set<string>();
      
      const findDescendants = (id: string) => {
        nodesToDelete.add(id);
        edges.forEach(edge => {
          if (edge.source === id) {
            findDescendants(edge.target);
          }
        });
      };
      
      findDescendants(nodeId);
      
      return prevNodes.filter(node => !nodesToDelete.has(node.id));
    });
    
    setEdges(prevEdges => {
      return prevEdges.filter(edge => 
        !edge.source.includes(nodeId) && !edge.target.includes(nodeId)
      );
    });
  }, [edges]);

  const handleReorganize = useCallback(() => {
    if (nodes.length > 0 && edges.length > 0) {
      const layoutNodes = calculateTreeLayout(nodes, edges, horizontalSpacing, verticalSpacing);
      setNodes(layoutNodes);
    }
  }, [nodes, edges, setNodes, horizontalSpacing, verticalSpacing]);

  const handleTidyUp = useCallback(() => {
    if (nodes.length > 0 && edges.length > 0) {
      // Enhanced tidy up with better spacing and alignment
      const layoutNodes = calculateTreeLayout(nodes, edges, horizontalSpacing, verticalSpacing);
      
      // Add smooth animation by using fitView after layout
      setNodes(layoutNodes);
      
      // Trigger a small delay and then fit view for better visual effect
      setTimeout(() => {
        const reactFlowInstance = document.querySelector('.react-flow');
        if (reactFlowInstance) {
          const event = new CustomEvent('fitView', { 
            detail: { 
              padding: 0.3, 
              duration: 800,
              includeHiddenNodes: false 
            } 
          });
          reactFlowInstance.dispatchEvent(event);
        }
      }, 100);
    }
  }, [nodes, edges, setNodes, horizontalSpacing, verticalSpacing]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    console.log('Generating nodes from data:', data);
    
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    if (data.length === 0) {
      console.log('No data provided, returning empty nodes/edges');
      return { nodes, edges };
    }

    const subjectNodeId = 'subject-node';
    nodes.push({
      id: subjectNodeId,
      type: 'subject',
      position: { x: 0, y: 0 },
      data: { 
        subject: subject || 'Main Topic'
      },
      draggable: true,
      selectable: true,
    });

    data.forEach((item, index) => {
      const titleNodeId = `title-${item.itemNumber}`;
      const descNodeId = `desc-${item.itemNumber}`;
      
      nodes.push({
        id: titleNodeId,
        type: 'title',
        position: { x: 0, y: 0 },
        data: { 
          title: item.title,
          itemNumber: item.itemNumber,
          onElaborate: handleElaborate,
          isLoading: false
        },
        draggable: true,
        selectable: true,
      });

      nodes.push({
        id: descNodeId,
        type: 'description',
        position: { x: 0, y: 0 },
        data: { 
          description: item.description,
          itemNumber: item.itemNumber,
          onElaborate: handleElaborate,
          isLoading: loadingNodes.has(descNodeId)
        },
        draggable: true,
        selectable: true,
      });

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

    const layoutNodes = calculateTreeLayout(nodes, edges, horizontalSpacing, verticalSpacing);
    
    console.log('Generated nodes with layout:', layoutNodes);
    console.log('Generated edges:', edges);
    return { nodes: layoutNodes, edges };
  }, [data, subject, handleElaborate, horizontalSpacing, verticalSpacing]);

  useEffect(() => {
    console.log('Data changed, updating nodes and edges');
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

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

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    
    if (node.type === 'subject') return;
    
    const confirmDelete = window.confirm(`Delete "${node.data.title || node.data.description}" and all its children?`);
    if (confirmDelete) {
      handleDeleteNode(node.id);
    }
  }, [handleDeleteNode]);

  console.log('Rendering FlowchartCanvas with nodes:', nodes.length, 'edges:', edges.length);

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeContextMenu={onNodeContextMenu}
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
      
      {/* Control Buttons - Positioned to avoid chatbox overlap */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <Button
          onClick={handleReorganize}
          variant="outline"
          size="sm"
          className="glass-panel flex items-center gap-2 bg-slate-800/80 border-slate-600 text-white hover:bg-slate-700/80"
        >
          <RotateCcw className="w-4 h-4" />
          Reorganize
        </Button>
        <Button
          onClick={handleTidyUp}
          variant="outline"
          size="sm"
          className="glass-panel flex items-center gap-2 bg-slate-800/80 border-slate-600 text-white hover:bg-slate-700/80"
        >
          <Sparkles className="w-4 h-4" />
          Tidy Up
        </Button>
      </div>
    </div>
  );
};
