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

        // Find the clicked node to position new nodes
        const clickedNode = nodes.find(n => n.id === nodeId);
        if (!clickedNode) {
          console.error('Clicked node not found:', nodeId);
          return;
        }

        const newNodes: Node[] = [];
        const newEdges: Edge[] = [];

        const parentNodePosition = clickedNode.position;
        const parentNodeWidth = clickedNode.width || 150; // Default width if not available
        const parentNodeHeight = clickedNode.height || 50; // Default height if not available

        const startX = parentNodePosition.x;
          const startY = parentNodePosition.y + parentNodeHeight + 100; // Position below parent

          normalizedItems.forEach((item, index) => {
            const newNodeId = `${nodeId}-elaborate-${item.itemNumber}`;
            const newNode: Node = {
              id: newNodeId,
              type: 'description',
              position: { x: startX, y: startY + index * 100 }, // Stack vertically
            data: {
              description: item.description,
              itemNumber: item.itemNumber,
              title: item.title,
              onElaborate: handleElaborate,
              isLoading: loadingNodes.has(newNodeId)
            },
          };
          newNodes.push(newNode);

          const newEdge: Edge = {
            id: `edge-${nodeId}-${newNodeId}`,
            source: nodeId,
            target: newNodeId,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed },
          };
          newEdges.push(newEdge);
        });

        setNodes((prevNodes) => [...prevNodes, ...newNodes]);
        setEdges((prevEdges) => [...prevEdges, ...newEdges]);

        console.log('Updated expandedNodes state:', nodeId, normalizedItems);
        console.log('Added new nodes:', newNodes);
        console.log('Added new edges:', newEdges);
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

      // Connect subject to title node
      edges.push({
        id: `edge-subject-${titleNodeId}`,
        source: subjectNodeId,
        target: titleNodeId,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
      });

      // Connect title node to description node
      edges.push({
        id: `edge-${titleNodeId}-${descNodeId}`,
        source: titleNodeId,
        target: descNodeId,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
      });

      // If there are multiple title nodes, connect them sequentially
      if (index > 0) {
        const prevTitleNodeId = `title-${data[index - 1].itemNumber}`;
        edges.push({
          id: `edge-${prevTitleNodeId}-${titleNodeId}`,
          source: prevTitleNodeId,
          target: titleNodeId,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed },
        });
      }
    });

    return { nodes, edges };
  }, [data, subject, loadingNodes, handleElaborate]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );





  const onNodeClickInternal = useCallback((event: React.MouseEvent, node: Node) => {
    if (onNodeClick) {
      onNodeClick(node.id, node.data.title || node.data.subject, node.data.description);
    }
  }, [onNodeClick]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClickInternal}
        fitView
        className="dark-flow"
        ref={reactFlowInstanceRef}
        fitViewOptions={{ 
          padding: 0.2,
          minZoom: 0.1, 
          maxZoom: 1.5,
          duration: 800 // Smooth animation when fitting view
        }}
        minZoom={0.1}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: 'straight',
          animated: false,
        }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
        proOptions={{ hideAttribution: true }}
        onInit={(instance) => {
          reactFlowInstance.current = instance;
          if (reactFlowInstanceRef) {
            reactFlowInstanceRef.current = instance;
          }
        }}
      >
        <Controls 
          position="top-right" 
          showInteractive={false}
        />
        <MiniMap 
          position="top-left"
          nodeStrokeWidth={3}
          zoomable
          pannable
          nodeBorderRadius={2}
          nodeColor={(node) => {
            if (node.type === 'subject') return 'hsl(260, 85%, 65%)';
            if (node.type === 'title') return 'hsl(270, 75%, 60%)';
            return 'hsl(280, 70%, 55%)';
          }}
        />
        <Background 
          color="#444" 
          gap={16} 
          variant="dots"
        />
      </ReactFlow>
    </div>
  );
};