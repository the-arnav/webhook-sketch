import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  ReactFlow, 
  Node, 
  Edge, 
  Controls, 
  MiniMap, 
  Background, 
  useNodesState, 
  useEdgesState,
  Connection,
  addEdge,
  BackgroundVariant,
  MarkerType,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SubjectNode } from './nodes/SubjectNode';
import { TitleNode } from './nodes/TitleNode';
import { DescriptionNode } from './nodes/DescriptionNode';
import { ContextMenu } from './ContextMenu';
import { Button } from '@/components/ui/button';
import { RefreshCw, Layers, RotateCcw, Zap, Grid3X3 } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { calculateProfessionalTreeLayout, positionElaboratedChildren } from '@/utils/nodeLayout';
import { toast } from 'sonner';

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

const calculateTreeLayout = (
  nodes: Node[], 
  edges: Edge[], 
  customHorizontalSpacing?: number, 
  customVerticalSpacing?: number
): Node[] => {
  const children: Record<string, string[]> = {};
  const positionedNodes: Record<string, { x: number; y: number }> = {};

  // Build parent-child relationships
  edges.forEach(edge => {
    if (!children[edge.source]) {
      children[edge.source] = [];
    }
    children[edge.source].push(edge.target);
  });

  const config = {
    nodeWidth: 300,
    nodeHeight: 150,
    levelSpacing: customVerticalSpacing || 200,
    siblingSpacing: customHorizontalSpacing || 350,
    childSpacing: 160 // Spacing between child nodes vertically
  };

  // Find root node (subject)
  const rootNode = nodes.find(n => n.type === 'subject');
  if (!rootNode) return nodes;

  // Position root at center
  positionedNodes[rootNode.id] = { x: 0, y: 0 };

  // Recursive function to position nodes
  const positionNodeAndChildren = (nodeId: string, parentX: number, parentY: number, level: number) => {
    const nodeChildren = children[nodeId] || [];
    
    nodeChildren.forEach((childId, index) => {
      const childNode = nodes.find(n => n.id === childId);
      if (!childNode) return;

      let x = parentX;
      let y = parentY;

      // Different positioning logic based on node type and level
      if (level === 1) {
        // Title nodes - spread horizontally with equal spacing
        const totalWidth = Math.max((nodeChildren.length - 1) * config.siblingSpacing, 0);
        const startX = parentX - totalWidth / 2;
        x = startX + (index * config.siblingSpacing);
        y = parentY + config.levelSpacing;
      } else if (level === 2) {
        // Description nodes - directly below their parent title nodes
        x = parentX;
        y = parentY + config.levelSpacing;
      } else {
        // Elaborated child nodes - spread horizontally below parent
        if (nodeChildren.length > 1) {
          const childTotalWidth = (nodeChildren.length - 1) * (config.childSpacing + 50);
          const childStartX = parentX - childTotalWidth / 2;
          x = childStartX + (index * (config.childSpacing + 50));
        } else {
          x = parentX;
        }
        y = parentY + config.levelSpacing;
      }

      positionedNodes[childId] = { x, y };
      
      // Recursively position children of this node
      positionNodeAndChildren(childId, x, y, level + 1);
    });
  };

  // Start positioning from root
  positionNodeAndChildren(rootNode.id, 0, 0, 0);

  return nodes.map(node => ({
    ...node,
    position: {
      x: positionedNodes[node.id]?.x || node.position.x,
      y: positionedNodes[node.id]?.y || node.position.y
    }
  }));
};

export const FlowchartCanvas = ({ data, subject, onSnapshot }: FlowchartCanvasProps) => {
  const { horizontalSpacing, verticalSpacing, showGrid, autoLayout } = useSettings();
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
  } | null>(null);
  const [isReorganizing, setIsReorganizing] = useState(false);

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
      toast.error('Failed to elaborate. Please try again.');
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
      toast.error('No content received from elaboration');
      return;
    }

    console.log('Processing elaborate response with', items.length, 'items');

    // Find parent node for positioning
    const parentNode = nodes.find(n => n.id === parentNodeId);
    if (!parentNode) return;

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

    // Add new nodes and edges to the graph
    setNodes(prevNodes => {
      const updatedNodes = [...prevNodes, ...newNodes];
      
      // Apply auto-layout if enabled
      if (autoLayout) {
        return calculateTreeLayout(updatedNodes, [...edges, ...newEdges], horizontalSpacing, verticalSpacing);
      }
      
      // Manual positioning for new nodes
      return positionElaboratedChildren(
        parentNode,
        newNodes,
        prevNodes,
        {
          nodeWidth: 300,
          nodeHeight: 150,
          levelSpacing: verticalSpacing,
          siblingSpacing: horizontalSpacing,
          childSpacing: 160,
          centerAlignment: true,
          collisionDetection: true
        }
      );
    });

    setEdges(prevEdges => [...prevEdges, ...newEdges]);
    
    toast.success(`Added ${items.length} new nodes`);
  }, [nodes, edges, autoLayout, horizontalSpacing, verticalSpacing, handleElaborate]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes(prevNodes => {
      // Find all descendant nodes to delete
      const nodesToDelete = new Set([nodeId]);
      const findDescendants = (id: string) => {
        edges.forEach(edge => {
          if (edge.source === id && !nodesToDelete.has(edge.target)) {
            nodesToDelete.add(edge.target);
            findDescendants(edge.target);
          }
        });
      };
      findDescendants(nodeId);
      
      return prevNodes.filter(node => !nodesToDelete.has(node.id));
    });
    
    setEdges(prevEdges => 
      prevEdges.filter(edge => 
        edge.source !== nodeId && edge.target !== nodeId
      )
    );
    
    setContextMenu(null);
    toast.success('Node deleted successfully');
  }, [edges]);

  const handleReorganize = useCallback(() => {
    setIsReorganizing(true);
    
    setTimeout(() => {
      const layoutedNodes = calculateTreeLayout(nodes, edges, horizontalSpacing, verticalSpacing);
      setNodes(layoutedNodes);
      setIsReorganizing(false);
      toast.success('Canvas reorganized');
    }, 100);
  }, [nodes, edges, horizontalSpacing, verticalSpacing]);

  const handleTidyUp = useCallback(() => {
    setIsReorganizing(true);
    
    setTimeout(() => {
      const layoutedNodes = calculateProfessionalTreeLayout(
        nodes,
        edges,
        {
          nodeWidth: 300,
          nodeHeight: 150,
          levelSpacing: verticalSpacing,
          siblingSpacing: horizontalSpacing,
          childSpacing: 160,
          centerAlignment: true,
          collisionDetection: true
        }
      );
      setNodes(layoutedNodes);
      setIsReorganizing(false);
      toast.success('Canvas tidied up');
    }, 100);
  }, [nodes, edges, horizontalSpacing, verticalSpacing]);

  const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id
    });
  }, []);

  const handleNodeDuplicate = useCallback((nodeId: string) => {
    const originalNode = nodes.find(n => n.id === nodeId);
    if (!originalNode) return;

    const newNode: Node = {
      ...originalNode,
      id: `${nodeId}-copy-${Date.now()}`,
      position: {
        x: originalNode.position.x + 50,
        y: originalNode.position.y + 50
      },
      data: {
        ...originalNode.data,
        onElaborate: handleElaborate
      }
    };

    setNodes(prevNodes => [...prevNodes, newNode]);
    setContextMenu(null);
    toast.success('Node duplicated');
  }, [nodes, handleElaborate]);

  const initialNodes = useMemo(() => {
    if (!data || data.length === 0) return [];

    const subjectNode: Node = {
      id: 'subject',
      type: 'subject',
      position: { x: 0, y: 0 },
      data: { subject: subject || 'Main Topic' },
      draggable: true,
      selectable: true,
    };

    const titleNodes: Node[] = data.map((item, index) => ({
      id: `title-${item.itemNumber}`,
      type: 'title',
      position: { x: 0, y: 0 }, // Will be positioned by layout
      data: { 
        title: item.title, 
        itemNumber: item.itemNumber,
        onElaborate: handleElaborate,
        isLoading: false 
      },
      draggable: true,
      selectable: true,
    }));

    const descriptionNodes: Node[] = data.map((item, index) => ({
      id: `desc-${item.itemNumber}`,
      type: 'description',
      position: { x: 0, y: 0 }, // Will be positioned by layout
      data: { 
        description: item.description, 
        itemNumber: item.itemNumber,
        onElaborate: handleElaborate,
        isLoading: false 
      },
      draggable: true,
      selectable: true,
    }));

    const allNodes = [subjectNode, ...titleNodes, ...descriptionNodes];
    return calculateTreeLayout(allNodes, [], horizontalSpacing, verticalSpacing);
  }, [data, subject, handleElaborate, horizontalSpacing, verticalSpacing]);

  const initialEdges = useMemo(() => {
    if (!data || data.length === 0) return [];

    const subjectToTitleEdges: Edge[] = data.map((item) => ({
      id: `subject->title-${item.itemNumber}`,
      source: 'subject',
      sourceHandle: 'bottom',
      target: `title-${item.itemNumber}`,
      targetHandle: 'top',
      type: 'straight',
      animated: true,
      style: { 
        stroke: 'var(--edge-primary)', 
        strokeWidth: 3,
        filter: 'var(--edge-glow)'
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: 'var(--edge-primary)',
        width: 8,
        height: 8,
      },
    }));

    const titleToDescEdges: Edge[] = data.map((item) => ({
      id: `title-${item.itemNumber}->desc-${item.itemNumber}`,
      source: `title-${item.itemNumber}`,
      sourceHandle: 'bottom',
      target: `desc-${item.itemNumber}`,
      targetHandle: 'top',
      type: 'straight',
      animated: true,
      style: { 
        stroke: 'var(--edge-secondary)', 
        strokeWidth: 2,
        opacity: 0.8,
        filter: 'var(--edge-glow)'
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: 'var(--edge-secondary)',
        width: 6,
        height: 6,
      },
    }));

    return [...subjectToTitleEdges, ...titleToDescEdges];
  }, [data]);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges]);

  useEffect(() => {
    if (onSnapshot) {
      onSnapshot({ nodes, edges });
    }
  }, [nodes, edges, onSnapshot]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="relative w-full h-full bg-canvas-bg">
      {/* Canvas Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReorganize}
          disabled={isReorganizing}
          className="glass-panel border-border hover:bg-accent/50"
        >
          <RefreshCw className={`w-4 h-4 ${isReorganizing ? 'animate-spin' : ''}`} />
          {isReorganizing ? 'Organizing...' : 'Reorganize'}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleTidyUp}
          disabled={isReorganizing}
          className="glass-panel border-border hover:bg-accent/50"
        >
          <Zap className={`w-4 h-4 ${isReorganizing ? 'animate-pulse' : ''}`} />
          Tidy Up
        </Button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeContextMenu={handleNodeContextMenu}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
          maxZoom: 1.2,
          minZoom: 0.1,
        }}
        className="bg-canvas-bg"
      >
        <Controls 
          className="react-flow__controls premium-controls"
          style={{
            background: 'hsl(0 0% 5%)',
            border: '1px solid hsl(var(--border))',
            borderRadius: '12px',
            boxShadow: '0 10px 30px -10px hsl(0 0% 0% / 0.8)',
          }}
        />
        <MiniMap 
          nodeColor={(node) => {
            switch (node.type) {
              case 'subject': return 'hsl(var(--primary))';
              case 'title': return 'hsl(var(--accent))';
              case 'description': return 'hsl(var(--muted))';
              default: return 'hsl(var(--foreground))';
            }
          }}
          maskColor="hsl(0 0% 0% / 0.9)"
          style={{
            background: 'hsl(0 0% 5%)',
            border: '1px solid hsl(var(--border))',
            borderRadius: '12px',
            boxShadow: '0 10px 30px -10px hsl(0 0% 0% / 0.8)',
          }}
        />
        <Background 
          variant={showGrid ? BackgroundVariant.Dots : BackgroundVariant.Lines}
          gap={24}
          size={1.5}
          color="hsl(var(--border))"
          style={{ opacity: showGrid ? 0.6 : 0.3 }}
        />
      </ReactFlow>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onDelete={() => handleDeleteNode(contextMenu.nodeId)}
          onEdit={() => {
            // TODO: Implement edit functionality
            setContextMenu(null);
            toast.info('Edit functionality coming soon');
          }}
          onDuplicate={() => handleNodeDuplicate(contextMenu.nodeId)}
          onMove={() => {
            // TODO: Implement move functionality
            setContextMenu(null);
            toast.info('Move functionality coming soon');
          }}
          onToggleLock={() => {
            // TODO: Implement lock functionality
            setContextMenu(null);
            toast.info('Lock functionality coming soon');
          }}
          onChangeColor={() => {
            // TODO: Implement color change functionality
            setContextMenu(null);
            toast.info('Color change functionality coming soon');
          }}
        />
      )}
    </div>
  );
};