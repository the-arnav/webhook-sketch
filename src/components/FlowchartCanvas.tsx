import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  onNodeClick?: (nodeId: string, title: string, description: string) => void;
  reactFlowInstanceRef?: React.MutableRefObject<ReactFlowInstance | null>;
}

export const FlowchartCanvas = ({ data, subject, onNodeClick, reactFlowInstanceRef }: FlowchartCanvasProps) => {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, any[]>>({});
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());
  
  const handleElaborate = useCallback(async (nodeId: string, content: string) => {
    // Prevent multiple requests for the same node
    if (loadingNodes.has(nodeId) || expandedNodes[nodeId]) {
      return;
    }

    setLoadingNodes(prev => new Set([...prev, nodeId]));

    try {
      console.log('Sending to webhook:', { nodeId, content });
      
      const response = await fetch('https://officially-probable-hamster.ngrok-free.app/webhook/e7fac30b-bd9d-4a8c-a1b1-38ba4ec19c9a', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ prompt: content }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('Webhook response:', result);
      
      // Extract items from response with more robust handling
      let items: any[] = [];
      if (result.output && result.output.items) {
        items = result.output.items;
      } else if (Array.isArray(result)) {
        items = result;
      } else if (result.items) {
        items = result.items;
      } else if (result.data) {
        items = result.data;
      } else if (result.output) {
        // Try to extract from output if it's an object
        if (Array.isArray(result.output)) {
          items = result.output;
        } else if (typeof result.output === 'object') {
          // Convert object to array if needed
          const outputKeys = Object.keys(result.output).filter(key => key !== 'items');
          if (outputKeys.length > 0) {
            items = outputKeys.map(key => ({
              title: key,
              description: result.output[key]
            }));
          }
        }
      }

      console.log('Extracted items:', items);

      // Normalize items with more robust handling
      const normalizedItems = items.map((item, index) => {
        // Handle if item is a string
        if (typeof item === 'string') {
          return {
            itemNumber: index + 1,
            title: `Point ${index + 1}`,
            description: item
          };
        }
        
        // Handle if item is an object
        return {
          itemNumber: index + 1,
          title: item.title || item.name || item.topic || item.key || `Point ${index + 1}`,
          description: item.description || item.detail || item.content || item.text || item.value || 'No description available'
        };
      });

      console.log('Normalized items:', normalizedItems);

      if (normalizedItems.length > 0) {
        // Update the expanded nodes state
        setExpandedNodes(prev => {
          const newState = { ...prev };
          newState[nodeId] = normalizedItems;
          return newState;
        });
        console.log('Updated expandedNodes state:', nodeId, normalizedItems);
      } else {
        console.warn('No items found in response');
      }
    } catch (error) {
      console.error('Error elaborating node:', error);
      // Show user-friendly error
      alert('Failed to elaborate. Please try again.');
    } finally {
      setLoadingNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(nodeId);
        return newSet;
      });
    }
  }, [loadingNodes, expandedNodes]);

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
          itemNumber: item.itemNumber,
          onElaborate: handleElaborate,
          isLoading: loadingNodes.has(titleNodeId)
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
          onElaborate: handleElaborate,
          isLoading: loadingNodes.has(descNodeId)
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

    // Add expanded nodes
    Object.entries(expandedNodes).forEach(([parentNodeId, expandedItems]) => {
      const parentNode = nodes.find(n => n.id === parentNodeId);
      if (!parentNode) return;
      
      // Calculate starting position for expanded nodes
      const startY = parentNode.position.y + 200;
      const startX = parentNode.position.x;
      
      // Create a title node for each expanded item
      expandedItems.forEach((expandedItem, index) => {
        // Calculate positions with proper spacing
        const expandedY = startY + (index * 200);
        
        // Create expanded title node
        const expandedTitleId = `${parentNodeId}-expanded-title-${index}`;
        nodes.push({
          id: expandedTitleId,
          type: 'title',
          position: { x: startX, y: expandedY },
          data: {
            title: expandedItem.title,
            itemNumber: expandedItem.itemNumber,
            onElaborate: handleElaborate,
            isLoading: loadingNodes.has(expandedTitleId)
          },
        });
        
        // Create expanded description node
        const expandedDescId = `${parentNodeId}-expanded-desc-${index}`;
        nodes.push({
          id: expandedDescId,
          type: 'description',
          position: { x: startX, y: expandedY + 100 },
          data: {
            description: expandedItem.description,
            itemNumber: expandedItem.itemNumber,
            onElaborate: handleElaborate,
            isLoading: loadingNodes.has(expandedDescId)
          },
        });
        
        // Connect parent to expanded title
        edges.push({
          id: `${parentNodeId}-to-${expandedTitleId}`,
          source: parentNodeId,
          sourceHandle: 'bottom',
          target: expandedTitleId,
          targetHandle: 'top',
          type: 'straight',
          animated: true,
          style: { 
            stroke: 'hsl(290, 70%, 50%)', 
            strokeWidth: 2.5,
            opacity: 0.8,
            filter: 'drop-shadow(0 0 12px hsl(290 70% 50% / 0.4))'
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: 'hsl(290, 70%, 50%)',
            width: 6,
            height: 6,
          },
        });
        
        // Connect expanded title to expanded description
        edges.push({
          id: `${expandedTitleId}-to-${expandedDescId}`,
          source: expandedTitleId,
          sourceHandle: 'bottom',
          target: expandedDescId,
          targetHandle: 'top',
          type: 'straight',
          animated: false,
          style: { 
            stroke: 'hsl(300, 60%, 45%)', 
            strokeWidth: 2,
            opacity: 0.7,
            filter: 'drop-shadow(0 0 8px hsl(300 60% 45% / 0.3))'
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: 'hsl(300, 60%, 45%)',
            width: 5,
            height: 5,
          },
        });
      });
    });

    return { nodes, edges };
  }, [data, subject, expandedNodes, handleElaborate, loadingNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  
  // If external ref is provided, sync it with our internal ref
  useEffect(() => {
    if (reactFlowInstanceRef) {
      reactFlowInstanceRef.current = reactFlowInstance.current;
    }
  }, [reactFlowInstance.current, reactFlowInstanceRef]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );
  
  // Fit view when expanded nodes are added
  useEffect(() => {
    // Short delay to ensure nodes are rendered before fitting view
    const timer = setTimeout(() => {
      if (reactFlowInstance.current) {
        // @ts-ignore - reactFlowInstance.current.fitView exists but TypeScript doesn't recognize it
        reactFlowInstance.current.fitView({
          padding: 0.4,
          minZoom: 0.2,
          maxZoom: 1.5,
          duration: 800
        });
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [expandedNodes]);

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
    <div className="w-full h-full" style={{ backgroundColor: 'var(--canvas-bg)' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ 
          padding: 0.4, 
          minZoom: 0.2, 
          maxZoom: 1.5,
          duration: 800 // Smooth animation when fitting view
        }}
        minZoom={0.2}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: 'straight',
          animated: false,
        }}
        className="canvas-flow"
        onInit={(instance) => {
          reactFlowInstance.current = instance;
          if (reactFlowInstanceRef) {
            reactFlowInstanceRef.current = instance;
          }
        }}
        onNodeClick={(_, node) => {
          if (onNodeClick) {
            const nodeData = node.data;
            const title = nodeData.title || '';
            const description = nodeData.description || '';
            onNodeClick(node.id, title, description);
          }
        }}
      >
        <div 
          className="absolute inset-0 pointer-events-none z-0" 
          style={{ backgroundImage: 'var(--canvas-overlay)' }}
        />
        <Controls 
          className="glass-panel absolute bottom-4 left-4" 
          showZoom={true}
          showFitView={true}
          showInteractive={false}
        />
        <MiniMap 
          className="glass-panel absolute bottom-4 right-4"
          style={{ width: 150, height: 100 }} /* Smaller size */
          zoomable={true}
          nodeColor={(node) => {
            if (node.type === 'subject') return 'hsl(260, 85%, 65%)';
            if (node.type === 'title') return 'hsl(270, 75%, 60%)';
            return 'hsl(280, 70%, 55%)';
          }}
          maskColor="rgba(0, 0, 0, 0.8)"
        />
        <Background 
          color="hsl(260, 30%, 50%)" 
          gap={24} 
          size={1.5}
          className="opacity-20"
          variant="dots"
        />
      </ReactFlow>
    </div>
  );
};