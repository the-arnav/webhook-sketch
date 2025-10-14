import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SubjectNode } from './nodes/SubjectNode';
import { TitleNode } from './nodes/TitleNode';
import { DescriptionNode } from './nodes/DescriptionNode';
import { ContextMenu } from './ContextMenu';
import { Button } from '@/components/ui/button';
import { RefreshCw, Layers, RotateCcw, Zap, Grid3X3 } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { calculateProfessionalTreeLayout } from '@/utils/nodeLayout';
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
  initialSnapshot?: { nodes: Node[]; edges: Edge[] } | null;
}

const createMindMapLayout = (
  nodes: Node[], 
  edges: Edge[], 
  customHorizontalSpacing?: number, 
  customVerticalSpacing?: number
): Node[] => {
  if (nodes.length === 0) return nodes;

  const positionedNodes: Record<string, { x: number; y: number }> = {};
  const config = {
    levelSpacing: customVerticalSpacing || 320,
    siblingSpacing: customHorizontalSpacing || 500,
    childSpacing: 280 // Spacing between elaborated child nodes
  };

  // Build parent-child relationships from edges
  const children: Record<string, string[]> = {};
  edges.forEach(edge => {
    if (!children[edge.source]) {
      children[edge.source] = [];
    }
    children[edge.source].push(edge.target);
  });

  // Categorize nodes by type
  const subjectNode = nodes.find(n => n.type === 'subject');
  const titleNodes = nodes.filter(n => n.type === 'title').sort((a, b) => {
    const aNum = Number(a.data?.itemNumber) || 0;
    const bNum = Number(b.data?.itemNumber) || 0;
    return aNum - bNum;
  });
  
  if (!subjectNode) return nodes;

  // 1. Position subject node at center top
  positionedNodes[subjectNode.id] = { x: 0, y: 0 };

  // 2. Position title nodes horizontally in a row below subject
  if (titleNodes.length > 0) {
    const totalWidth = (titleNodes.length - 1) * config.siblingSpacing;
    const startX = -totalWidth / 2;
    
    titleNodes.forEach((titleNode, index) => {
      const x = startX + (index * config.siblingSpacing);
      const y = config.levelSpacing;
      positionedNodes[titleNode.id] = { x, y };
    });
  }

  // 3. Position description nodes directly below their corresponding title nodes
  titleNodes.forEach((titleNode) => {
    const titleItemNumber = titleNode.data?.itemNumber;
    const correspondingDesc = nodes.find(n => 
      n.type === 'description' && n.data?.itemNumber === titleItemNumber
    );
    
    if (correspondingDesc && positionedNodes[titleNode.id]) {
      const titlePos = positionedNodes[titleNode.id];
      positionedNodes[correspondingDesc.id] = {
        x: titlePos.x,
        y: titlePos.y + config.levelSpacing
      };
    }
  });

  // 4. Position elaborated children in structured branches below descriptions
  const positionElaboratedChildren = (parentId: string, level: number = 3) => {
    const parentPos = positionedNodes[parentId];
    if (!parentPos) return;

    const childIds = children[parentId] || [];
    const elaboratedChildren = childIds.filter(childId => {
      const childNode = nodes.find(n => n.id === childId);
      // Include all non-title children (allow description-type children)
      return childNode && childNode.type !== 'title' && childNode.type !== 'subject';
    });

    if (elaboratedChildren.length === 0) return;

    // Position elaborated children horizontally below parent
    const totalChildWidth = (elaboratedChildren.length - 1) * config.childSpacing;
    const startX = parentPos.x - totalChildWidth / 2;
    const childY = parentPos.y + config.levelSpacing;

    elaboratedChildren.forEach((childId, index) => {
      const x = startX + (index * config.childSpacing);
      positionedNodes[childId] = { x, y: childY };
      
      // Recursively position deeper levels
      positionElaboratedChildren(childId, level + 1);
    });
  };

  // Apply elaborated children positioning to title and description nodes
  const parentsForElaboration = nodes.filter(n => n.type === 'description' || n.type === 'title');
  parentsForElaboration.forEach(parentNode => {
    positionElaboratedChildren(parentNode.id);
  });

  // Apply positions to all nodes
  return nodes.map(node => ({
    ...node,
    position: {
      x: positionedNodes[node.id]?.x || node.position.x,
      y: positionedNodes[node.id]?.y || node.position.y
    }
  }));
};

const FlowchartCanvasInner = ({ data, subject, onSnapshot, initialSnapshot }: FlowchartCanvasProps) => {
  const { horizontalSpacing, verticalSpacing, showGrid, autoLayout } = useSettings();
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
  } | null>(null);
  const [editingNode, setEditingNode] = useState<{ id: string; field: 'title' | 'description' | 'subject' } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isReorganizing, setIsReorganizing] = useState(false);
  const rf = useReactFlow();

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
      const { fetchWithRetry } = await import('@/utils/http');
      const response = await fetchWithRetry(
        'https://officially-probable-hamster.ngrok-free.app/webhook/e7fac30b-bd9d-4a8c-a1b1-38ba4ec19c9a',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ prompt: content }),
        },
        { retries: 2, backoffMs: 800, timeoutMs: 15000 }
      );

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

  const handleEditNode = useCallback((nodeId: string, field: 'title' | 'description' | 'subject', currentValue: string) => {
    setEditingNode({ id: nodeId, field });
    setEditValue(currentValue);
    setContextMenu(null);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingNode) return;
    
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === editingNode.id 
          ? { ...node, data: { ...node.data, [editingNode.field]: editValue } }
          : node
      )
    );
    
    setEditingNode(null);
    setEditValue('');
    toast.success('Node updated');
  }, [editingNode, editValue, setNodes]);

  const handleChangeNodeColor = useCallback((nodeId: string, color: string) => {
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId 
          ? { ...node, data: { ...node.data, customColor: color } }
          : node
      )
    );
    setContextMenu(null);
    toast.success('Color changed');
  }, [setNodes]);

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

    // Find parent node robustly (use reactflow store first to avoid stale closures)
    const parentNode = rf.getNode(parentNodeId) || nodes.find(n => n.id === parentNodeId);
    // Do not early-return if missing; auto-layout path doesn't require parent; manual path will fallback.

    // Create new child nodes (skip duplicates)
    const existingIds = new Set(nodes.map(n => n.id));
    const newNodes: Node[] = items.map((item: any, idx: number) => {
      const itemNumber = item.itemNumber ?? idx + 1;
      const id = `${parentNodeId}-child-${itemNumber}`;
      
      if (existingIds.has(id)) return null as any;
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
    }).filter(Boolean as any);

    // Create new edges connecting parent to children (skip duplicates) 
    const existingEdgeIds = new Set(edges.map(e => e.id));
    const newEdges: Edge[] = items.map((item: any, idx: number) => {
      const itemNumber = item.itemNumber ?? idx + 1;
      const targetId = `${parentNodeId}-child-${itemNumber}`;
      const edgeId = `${parentNodeId}->${targetId}`;
      
      if (existingEdgeIds.has(edgeId)) return null as any;
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
    }).filter(Boolean as any);

    // Add new nodes and edges to the graph
    setNodes(prevNodes => {
      // Find parent node using reactflow first (most current state)
      const parent = rf.getNode(parentNodeId) || prevNodes.find(n => n.id === parentNodeId);
      if (!parent) {
        // Fallback: position at origin if parent not found
        return [...prevNodes, ...newNodes];
      }
      
      const parentPos = parent.position;
      const childSpacing = 300; // Increased spacing
      const levelSpacing = 350; // Increased vertical spacing
      
      // Position children centered horizontally under parent
      const totalWidth = (newNodes.length - 1) * childSpacing;
      const startX = parentPos.x - totalWidth / 2;
      
      const positionedNewNodes = newNodes.map((newNode, index) => ({
        ...newNode,
        position: {
          x: startX + (index * childSpacing),
          y: parentPos.y + levelSpacing
        },
        className: 'animate-slide-in-up'
      }));
      
      return [...prevNodes, ...positionedNewNodes];
    });

    setEdges(prevEdges => {
      const existing = new Set(prevEdges.map(e => e.id));
      const merged = [...prevEdges, ...newEdges.filter(e => !existing.has(e.id))];
      return merged;
    });

    // bring new nodes into view
    setTimeout(() => {
      try {
        rf.fitView({ padding: 0.2, includeHiddenNodes: false, duration: 500 });
      } catch {}
    }, 0);
    
    toast.success(`Added ${items.length} new nodes`);
  }, [nodes, edges, autoLayout, horizontalSpacing, verticalSpacing, handleElaborate, rf]);

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
      const layoutedNodes = createMindMapLayout(nodes, edges, horizontalSpacing, verticalSpacing);
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
    return createMindMapLayout(allNodes, [], horizontalSpacing, verticalSpacing);
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

  const initializedDataRef = useRef<string>('');

  useEffect(() => {
    // Create a unique identifier for the current data
    const dataId = initialSnapshot 
      ? `snapshot-${initialSnapshot.nodes.length}-${JSON.stringify(initialSnapshot.nodes[0]?.id || '')}` 
      : `data-${initialNodes.length}-${JSON.stringify(initialNodes[0]?.id || '')}`;
    
    // Only initialize if we have new data or it's the first load
    const isNewData = dataId !== initializedDataRef.current;
    const shouldInitialize = (nodes.length === 0 || isNewData) && (initialNodes.length > 0 || initialSnapshot?.nodes?.length);
    
    if (shouldInitialize) {
      initializedDataRef.current = dataId;
      
      if (initialSnapshot && initialSnapshot.nodes?.length) {
        // Restore exact snapshot with all properties preserved
        const restoredNodes = initialSnapshot.nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            onElaborate: handleElaborate, // Re-attach callbacks
          }
        }));
        setNodes(restoredNodes);
        setEdges(initialSnapshot.edges || []);
      } else if (initialNodes.length > 0) {
        setNodes(initialNodes);
        setEdges(initialEdges);
      }
    }
  }, [initialNodes, initialEdges, nodes.length, initialSnapshot]);

  // Add effect to trigger fitView when nodes are loaded
  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => {
        try {
          rf.fitView({ padding: 0.2, includeHiddenNodes: false, duration: 500 });
        } catch (error) {
          console.warn('fitView failed:', error);
        }
      }, 100);
    }
  }, [nodes.length, rf]);

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
          maxZoom: 3,
          minZoom: 0.05,
        }}
        minZoom={0.05}
        maxZoom={3}
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
          variant={BackgroundVariant.Dots}
          gap={24}
          size={3}
          color="hsl(var(--primary))"
          style={{ opacity: showGrid ? 0.6 : 0.3 }}
        />
      </ReactFlow>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.nodeId}
          nodes={nodes}
          onClose={() => setContextMenu(null)}
          onDelete={() => handleDeleteNode(contextMenu.nodeId)}
          onEdit={handleEditNode}
          onDuplicate={() => handleNodeDuplicate(contextMenu.nodeId)}
          onMove={() => {
            setContextMenu(null);
            toast.info('Move functionality coming soon');
          }}
          onToggleLock={() => {
            setContextMenu(null);
            toast.info('Lock functionality coming soon');
          }}
          onChangeColor={handleChangeNodeColor}
        />
      )}

      {/* Edit Dialog */}
      {editingNode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setEditingNode(null)}>
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4 glass-panel" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Edit {editingNode.field}</h3>
            <textarea
              className="w-full min-h-[100px] p-3 bg-background border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <Button onClick={handleSaveEdit} className="flex-1">Save</Button>
              <Button variant="outline" onClick={() => setEditingNode(null)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const FlowchartCanvas = (props: FlowchartCanvasProps) => {
  return (
    <ReactFlowProvider>
      <FlowchartCanvasInner {...props} />
    </ReactFlowProvider>
  );
};