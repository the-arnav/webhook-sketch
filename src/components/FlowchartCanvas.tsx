import { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Controls,
  MiniMap,
  Background,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { SubjectNode } from './nodes/SubjectNode';
import { TitleNode } from './nodes/TitleNode';
import { DescriptionNode } from './nodes/DescriptionNode';
import { useMindMapStore, FlowchartNode } from '@/stores/mindMapStore';
import { toast } from 'sonner';

// Define node types
const nodeTypes = {
  'subject-node': SubjectNode,
  'title-node': TitleNode,
  'description-node': DescriptionNode,
};

const ELABORATE_WEBHOOK_URL = 'https://officially-probable-hamster.ngrok-free.app/webhook/e7fac30b-bd9d-4a8c-a1b1-38ba4ec19c9a';

export const FlowchartCanvas = () => {
  const { nodes: storeNodes, subject, addChildNodes, expandedNodes, setNodeExpanded } = useMindMapStore();
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());

  // Handle elaborate functionality
  const handleElaborate = useCallback(async (nodeId: string, content: string) => {
    console.log('🚀 Starting elaboration for node:', nodeId, 'with content:', content);
    
    setLoadingNodes(prev => new Set([...prev, nodeId]));
    setNodeExpanded(nodeId, true);
    
    try {
      const payload = {
        prompt: `Elaborate on this topic: ${content}`,
        nodeId: nodeId,
        content: content
      };
      
      console.log('📤 Sending payload to webhook:', payload);
      
      const response = await fetch(ELABORATE_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      console.log('📥 Webhook response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Webhook error response:', errorText);
        throw new Error(`Webhook request failed with status ${response.status}: ${errorText}`);
      }
      
      const responseData = await response.json();
      console.log('✅ Webhook response data:', responseData);
      
      // Process the response and extract items
      let extractedItems: any[] = [];
      
      if (Array.isArray(responseData)) {
        extractedItems = responseData;
      } else if (responseData.items && Array.isArray(responseData.items)) {
        extractedItems = responseData.items;
      } else if (responseData.output && responseData.output.items && Array.isArray(responseData.output.items)) {
        extractedItems = responseData.output.items;
      } else if (responseData.data && Array.isArray(responseData.data)) {
        extractedItems = responseData.data;
      }
      
      console.log('📋 Extracted items:', extractedItems);
      
      if (extractedItems.length > 0) {
        // Normalize the items to match our FlowchartNode interface
        const normalizedItems: FlowchartNode[] = extractedItems.map((item, index) => ({
          id: '', // Will be set by the store
          itemNumber: index + 1,
          title: item.title || item.name || item.label || `Sub-item ${index + 1}`,
          description: item.description || item.content || item.text || String(item),
          parentId: nodeId
        }));
        
        console.log('🔄 Normalized items:', normalizedItems);
        
        // Add the child nodes to the store
        addChildNodes(nodeId, normalizedItems);
        
        toast.success(`Added ${normalizedItems.length} sub-topics to "${content.substring(0, 30)}..."`);
        console.log('🎉 Successfully elaborated node:', nodeId);
      } else {
        console.warn('⚠️ No items found in response for elaboration');
        throw new Error('No elaboration data received from the webhook');
      }
      
    } catch (error) {
      console.error('💥 Error during elaboration:', error);
      toast.error(`Failed to elaborate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoadingNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(nodeId);
        return newSet;
      });
      console.log('🔚 Elaboration process completed for node:', nodeId);
    }
  }, [addChildNodes, setNodeExpanded]);
  
  // Generate React Flow nodes and edges
  const { initialNodes, initialEdges } = useMemo(() => {
    console.log('🔨 Generating nodes and edges for store nodes:', storeNodes);
    
    if (!storeNodes || storeNodes.length === 0) {
      console.log('📭 No data provided, returning empty nodes/edges');
      return { initialNodes: [], initialEdges: [] };
    }
    
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let yOffset = 0;
    
    // Create subject node
    const subjectNodeId = 'subject-main';
    nodes.push({
      id: subjectNodeId,
      type: 'subject-node',
      position: { x: 400, y: yOffset },
      data: { subject: subject || 'Main Topic' },
      draggable: true,
    });
    
    yOffset += 200;
    
    // Create nodes for main items (those without parentId)
    const mainNodes = storeNodes.filter(node => !node.parentId);
    
    mainNodes.forEach((item, index) => {
      const titleNodeId = `title-${item.itemNumber}`;
      const descNodeId = `desc-${item.itemNumber}`;
      
      // Title node
      nodes.push({
        id: titleNodeId,
        type: 'title-node',
        position: { x: 100 + (index % 3) * 300, y: yOffset },
        data: { 
          title: item.title, 
          itemNumber: item.itemNumber,
          onElaborate: handleElaborate,
          isLoading: loadingNodes.has(titleNodeId)
        },
        draggable: true,
      });
      
      // Description node
      nodes.push({
        id: descNodeId,
        type: 'description-node',
        position: { x: 100 + (index % 3) * 300, y: yOffset + 120 },
        data: { 
          description: item.description, 
          itemNumber: item.itemNumber,
          onElaborate: handleElaborate,
          isLoading: loadingNodes.has(descNodeId)
        },
        draggable: true,
      });
      
      // Edges from subject to titles
      edges.push({
        id: `edge-subject-${titleNodeId}`,
        source: subjectNodeId,
        target: titleNodeId,
        sourceHandle: 'bottom',
        targetHandle: 'top',
        type: 'smoothstep',
        style: { 
          stroke: 'hsl(270, 80%, 60%)', 
          strokeWidth: 3,
          filter: 'drop-shadow(0 0 10px hsl(270 80% 60% / 0.4))'
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'hsl(270, 80%, 60%)',
        },
        animated: true,
      });
      
      // Edges from titles to descriptions
      edges.push({
        id: `edge-${titleNodeId}-${descNodeId}`,
        source: titleNodeId,
        target: descNodeId,
        sourceHandle: 'bottom',
        targetHandle: 'top',
        type: 'smoothstep',
        style: { 
          stroke: 'hsl(260, 70%, 50%)', 
          strokeWidth: 2,
          filter: 'drop-shadow(0 0 8px hsl(260 70% 50% / 0.3))'
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'hsl(260, 70%, 50%)',
        },
      });
      
      // Add child nodes if they exist
      const childNodes = storeNodes.filter(child => 
        child.parentId === titleNodeId || child.parentId === descNodeId
      );
      
      if (childNodes.length > 0) {
        console.log(`🌟 Adding child nodes for ${titleNodeId}/${descNodeId}:`, childNodes);
        
        childNodes.forEach((childNode, childIndex) => {
          const childNodeId = childNode.id;
          
          nodes.push({
            id: childNodeId,
            type: 'description-node',
            position: { 
              x: 100 + (index % 3) * 300 + (childIndex * 150), 
              y: yOffset + 280 + (Math.floor(childIndex / 2) * 100)
            },
            data: { 
              description: childNode.description, 
              itemNumber: childNode.itemNumber,
              onElaborate: handleElaborate,
              isLoading: loadingNodes.has(childNodeId)
            },
            draggable: true,
          });
          
          // Edge from description to child node
          edges.push({
            id: `edge-${descNodeId}-${childNodeId}`,
            source: descNodeId,
            target: childNodeId,
            sourceHandle: 'bottom',
            targetHandle: 'top',
            type: 'smoothstep',
            style: { 
              stroke: 'hsl(240, 60%, 40%)', 
              strokeWidth: 2,
              filter: 'drop-shadow(0 0 6px hsl(240 60% 40% / 0.3))'
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: 'hsl(240, 60%, 40%)',
            },
          });
        });
      }
      
      // Move to next row after every 3 items
      if ((index + 1) % 3 === 0) {
        yOffset += 400;
      }
    });
    
    console.log('✅ Generated nodes:', nodes.length, 'edges:', edges.length);
    return { initialNodes: nodes, initialEdges: edges };
  }, [storeNodes, subject, loadingNodes, handleElaborate]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  if (!storeNodes || storeNodes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">No mind map to display</p>
          <p className="text-sm">Generate a mind map to see the visualization</p>
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
        fitViewOptions={{ padding: 0.2, minZoom: 0.3, maxZoom: 1.5 }}
        minZoom={0.3}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
        }}
      >
        <Controls className="glass-panel" />
        <MiniMap 
          className="glass-panel"
          nodeColor={(node) => {
            if (node.type === 'subject-node') return '#a855f7';
            if (node.type === 'title-node') return '#8b5cf6';
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