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
import { CombinedNode } from './nodes/CombinedNode';
import { ContextMenu } from './ContextMenu';
import { Button } from '@/components/ui/button';
import { RefreshCw, Layers, Undo, Redo, Grid3X3 } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { calculateProfessionalTreeLayout } from '@/utils/nodeLayout';
import { toast } from 'sonner';

const nodeTypes = {
  subject: SubjectNode,
  title: TitleNode,
  description: DescriptionNode,
  combined: CombinedNode,
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
  const { horizontalSpacing, verticalSpacing, showGrid, autoLayout, canvasBackground } = useSettings();
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

  // History state for undo/redo
  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoAction = useRef(false);

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

  // Smart positioning that keeps nodes compact and avoids overlaps
  const smartPositionNodes = useCallback((
    parent: Node,
    children: Node[],
    existingNodes: Node[]
  ): Node[] => {
    const nodeWidth = 280;
    const nodeHeight = 200;
    const horizontalGap = 80;
    const verticalGap = 100;
    
    // Calculate positions for children in a horizontal row
    const totalWidth = (children.length - 1) * (nodeWidth + horizontalGap);
    const startX = parent.position.x - totalWidth / 2;
    const childY = parent.position.y + nodeHeight + verticalGap;
    
    // Position children
    const positionedChildren = children.map((child, idx) => ({
      ...child,
      position: {
        x: Math.round(startX + idx * (nodeWidth + horizontalGap)),
        y: Math.round(childY)
      }
    }));
    
    // Check for overlaps with existing nodes and adjust if needed
    const checkOverlap = (node1: Node, node2: Node): boolean => {
      const buffer = 40; // Minimum space between nodes
      const dx = Math.abs(node1.position.x - node2.position.x);
      const dy = Math.abs(node1.position.y - node2.position.y);
      return dx < nodeWidth + buffer && dy < nodeHeight + buffer;
    };
    
    // Adjust positions to avoid overlaps
    positionedChildren.forEach(child => {
      let hasOverlap = true;
      let attempts = 0;
      const maxAttempts = 20;
      
      while (hasOverlap && attempts < maxAttempts) {
        hasOverlap = false;
        
        for (const existing of existingNodes) {
          if (existing.id !== child.id && existing.id !== parent.id) {
            if (checkOverlap(child, existing)) {
              hasOverlap = true;
              // Move slightly to the right to avoid overlap
              child.position.x += nodeWidth / 2 + horizontalGap / 2;
              break;
            }
          }
        }
        attempts++;
      }
    });
    
    return positionedChildren;
  }, []);

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
        type: 'combined',
        position: { x: 0, y: 0 }, // Will be positioned by layout
        data: {
          title: item.title ?? 'No title',
          description: item.description ?? 'No description',
          itemNumber,
          onElaborate: handleElaborate,
          isLoading: false
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
        type: 'smoothstep',
        animated: false,
        style: { 
          stroke: 'hsl(var(--primary))', 
          strokeWidth: 2.5
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'hsl(var(--primary))'
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

      // Build full children list (existing + new) for this parent
      const combinedEdges = [...edges, ...newEdges];
      const childIds = combinedEdges
        .filter(e => e.source === parentNodeId)
        .map(e => e.target);

      // Map to actual node objects from current and new nodes
      const nodeMap = new Map<string, Node>();
      prevNodes.forEach(n => nodeMap.set(n.id, n));
      newNodes.forEach(n => nodeMap.set(n.id, n));
      const allChildren = childIds
        .map(id => nodeMap.get(id))
        .filter(Boolean) as Node[];

      // Stable ordering by itemNumber then id
      allChildren.sort((a, b) => {
        const aNum = Number((a.data as any)?.itemNumber) || 0;
        const bNum = Number((b.data as any)?.itemNumber) || 0;
        if (aNum !== bNum) return aNum - bNum;
        return a.id.localeCompare(b.id);
      });

      // Use smart positioning for compact layout
      const positionedChildren = smartPositionNodes(parent, allChildren, prevNodes);
      
      // Create updated nodes array
      let updatedNodes = [...prevNodes];
      
      // Update positions for positioned children
      positionedChildren.forEach(child => {
        const nodeIndex = updatedNodes.findIndex(n => n.id === child.id);
        if (nodeIndex !== -1) {
          updatedNodes[nodeIndex] = {
            ...updatedNodes[nodeIndex],
            position: child.position
          };
        } else {
          // Add new node
          updatedNodes.push(child);
        }
      });

      return updatedNodes;
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
  }, [nodes, edges, autoLayout, horizontalSpacing, verticalSpacing, handleElaborate, rf, smartPositionNodes]);

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
      // Build hierarchical structure
      const childrenMap: Record<string, string[]> = {};
      edges.forEach(edge => {
        if (!childrenMap[edge.source]) {
          childrenMap[edge.source] = [];
        }
        childrenMap[edge.source].push(edge.target);
      });

      // Find root (subject node)
      const rootNode = nodes.find(n => n.type === 'subject');
      if (!rootNode) {
        setIsReorganizing(false);
        return;
      }

      const positionedNodes: Record<string, { x: number; y: number }> = {};
      const levelGap = Math.max(300, verticalSpacing || 400);
      const siblingGap = Math.max(280, horizontalSpacing || 350);

      // Position nodes recursively
      const positionSubtree = (nodeId: string, level: number): number => {
        const children = childrenMap[nodeId] || [];
        
        if (children.length === 0) {
          // Leaf node
          return 1;
        }

        let totalWidth = 0;
        const childWidths: number[] = [];
        
        // Calculate widths for all children
        children.forEach(childId => {
          const width = positionSubtree(childId, level + 1);
          childWidths.push(width);
          totalWidth += width;
        });

        // Position children
        let currentX = 0;
        children.forEach((childId, idx) => {
          const childWidth = childWidths[idx];
          const childCenterOffset = (childWidth - 1) * siblingGap / 2;
          positionedNodes[childId] = {
            x: currentX + childCenterOffset,
            y: level * levelGap
          };
          currentX += childWidth * siblingGap;
        });

        // Center parent above children
        const firstChildX = positionedNodes[children[0]].x;
        const lastChildX = positionedNodes[children[children.length - 1]].x;
        positionedNodes[nodeId] = {
          x: (firstChildX + lastChildX) / 2,
          y: (level - 1) * levelGap
        };

        return totalWidth;
      };

      // Start positioning from root
      positionSubtree(rootNode.id, 1);
      positionedNodes[rootNode.id] = { x: 0, y: 0 };

      // Apply positions and center the tree
      const allX = Object.values(positionedNodes).map(p => p.x);
      const minX = Math.min(...allX);
      const maxX = Math.max(...allX);
      const centerOffset = -(minX + maxX) / 2;

      const layoutedNodes = nodes.map(node => ({
        ...node,
        position: {
          x: Math.round((positionedNodes[node.id]?.x || 0) + centerOffset),
          y: Math.round(positionedNodes[node.id]?.y || 0)
        }
      }));

      setNodes(layoutedNodes);
      setIsReorganizing(false);
      toast.success('Canvas reorganized in structured top-down layout');
      
      // Fit view after reorganization
      setTimeout(() => {
        try {
          rf.fitView({ padding: 0.2, duration: 500 });
        } catch {}
      }, 100);
    }, 100);
  }, [nodes, edges, horizontalSpacing, verticalSpacing, rf]);


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

    // Use combined nodes instead of separate title and description
    const combinedNodes: Node[] = data.map((item, index) => ({
      id: `combined-${item.itemNumber}`,
      type: 'combined',
      position: { x: 0, y: 0 }, // Will be positioned by layout
      data: { 
        title: item.title,
        description: item.description,
        itemNumber: item.itemNumber,
        onElaborate: handleElaborate,
        isLoading: false 
      },
      draggable: true,
      selectable: true,
    }));

    const allNodes = [subjectNode, ...combinedNodes];
    
    // Position nodes in top-down format
    const positionedNodes = allNodes.map((node, index) => {
      if (index === 0) {
        // Subject node at top center
        return { ...node, position: { x: 0, y: 0 } };
      } else {
        // Combined nodes arranged horizontally below subject
        const totalWidth = (combinedNodes.length - 1) * horizontalSpacing;
        const startX = -totalWidth / 2;
        const nodeIndex = index - 1;
        return {
          ...node,
          position: {
            x: startX + (nodeIndex * horizontalSpacing),
            y: verticalSpacing
          }
        };
      }
    });
    
    return positionedNodes;
  }, [data, subject, handleElaborate, horizontalSpacing, verticalSpacing]);

  const initialEdges = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Connect subject to combined nodes
    const subjectToCombinedEdges: Edge[] = data.map((item) => ({
      id: `subject->combined-${item.itemNumber}`,
      source: 'subject',
      sourceHandle: 'bottom',
      target: `combined-${item.itemNumber}`,
      targetHandle: 'top',
      type: 'smoothstep',
      style: { 
        stroke: 'hsl(var(--primary))', 
        strokeWidth: 2.5
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: 'hsl(var(--primary))'
      },
    }));

    return subjectToCombinedEdges;
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

  // Undo functionality
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setHistoryIndex(historyIndex - 1);
      toast.success('Undone');
      setTimeout(() => { isUndoRedoAction.current = false; }, 100);
    } else {
      toast.error('Nothing to undo');
    }
  }, [history, historyIndex, setNodes, setEdges]);

  // Redo functionality
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(historyIndex + 1);
      toast.success('Redone');
      setTimeout(() => { isUndoRedoAction.current = false; }, 100);
    } else {
      toast.error('Nothing to redo');
    }
  }, [history, historyIndex, setNodes, setEdges]);

  // Track history changes
  useEffect(() => {
    if (nodes.length > 0 && !isUndoRedoAction.current) {
      const newState = { nodes, edges };
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newState);
      
      // Limit history to last 50 states
      if (newHistory.length > 50) {
        newHistory.shift();
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      } else {
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    }
  }, [nodes, edges]);

  // Save canvas data whenever nodes/edges change
  const saveCanvasData = useCallback(() => {
    if (nodes.length > 0) {
      // Normalize positions by rounding to ensure exact positioning
      const normalizedNodes = nodes.map(node => ({
        ...node,
        position: {
          x: Math.round(node.position.x),
          y: Math.round(node.position.y)
        }
      }));
      
      if (onSnapshot) {
        onSnapshot({ nodes: normalizedNodes, edges });
      }
      toast.success('Canvas saved successfully');
    }
  }, [nodes, edges, onSnapshot]);

  useEffect(() => {
    if (onSnapshot) {
      // Auto-save with normalized positions
      const normalizedNodes = nodes.map(node => ({
        ...node,
        position: {
          x: Math.round(node.position.x),
          y: Math.round(node.position.y)
        }
      }));
      onSnapshot({ nodes: normalizedNodes, edges });
    }
  }, [nodes, edges, onSnapshot]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="relative w-full h-full" style={{ 
      background: 'var(--canvas-bg)',
      backgroundSize: 'var(--canvas-bg-size, 100%)'
    }}>
      {/* Canvas Overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'var(--canvas-overlay, transparent)',
        backgroundSize: 'var(--canvas-bg-size, 100%)'
      }} />
      
      {/* Canvas Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleUndo}
          disabled={historyIndex <= 0}
          className="glass-panel border-border hover:bg-accent/50"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRedo}
          disabled={historyIndex >= history.length - 1}
          className="glass-panel border-border hover:bg-accent/50"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={saveCanvasData}
          className="glass-panel border-border hover:bg-accent/50"
        >
          <Layers className="w-4 h-4" />
          Save Canvas
        </Button>
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
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeContextMenu={handleNodeContextMenu}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{ 
          type: 'smoothstep',
          style: { stroke: 'hsl(var(--primary))', strokeWidth: 2.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' }
        }}
        snapToGrid={false}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
          maxZoom: 3,
          minZoom: 0.05,
        }}
        minZoom={0.05}
        maxZoom={3}
        style={{ 
          background: 'transparent'
        }}
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
        {canvasBackground === 'dots' ? (
          <Background 
            variant={BackgroundVariant.Dots}
            gap={20}
            size={2}
            color="hsl(var(--primary) / 0.4)"
            style={{ opacity: 1 }}
          />
        ) : (
          <Background 
            variant={BackgroundVariant.Lines}
            gap={20}
            color="hsl(var(--border))"
            style={{ opacity: showGrid ? 0.3 : 0 }}
          />
        )}
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