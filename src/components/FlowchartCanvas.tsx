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

  // Keep internal state in sync when incoming data/subject changes
  useEffect(() => {
    setNodes(baseNodes);
    setEdges(baseEdges);
  }, [baseNodes, baseEdges, setNodes, setEdges]);

  // --- Layout helpers ---
  type NodeMap = Map<string, Node>;
  type ChildrenMap = Map<string, string[]>;

  const layoutGraph = useCallback((inputNodes: Node[], inputEdges: Edge[]): Node[] => {
    const horizontalSpacing = 320;
    const verticalSpacing = 300;
    const minGapX = 220;

    const idToNode: NodeMap = new Map(inputNodes.map(n => [n.id, { ...n }]));
    const children: ChildrenMap = new Map();
    const indeg: Record<string, number> = {};
    for (const n of inputNodes) indeg[n.id] = 0;
    for (const e of inputEdges) {
      if (!children.has(e.source)) children.set(e.source, []);
      children.get(e.source)!.push(e.target);
      indeg[e.target] = (indeg[e.target] ?? 0) + 1;
    }

    // Pick root: prefer subject node, else any node with indegree 0
    const subjectNode = inputNodes.find(n => n.type === 'subject') || inputNodes.find(n => (indeg[n.id] ?? 0) === 0) || inputNodes[0];
    if (!subjectNode) return inputNodes;

    // Assign depths via BFS
    const depth: Record<string, number> = {};
    const queue: string[] = [subjectNode.id];
    depth[subjectNode.id] = 0;
    const visited = new Set<string>([subjectNode.id]);
    while (queue.length) {
      const u = queue.shift() as string;
      const kids = children.get(u) || [];
      for (const v of kids) {
        if (!visited.has(v)) {
          visited.add(v);
          depth[v] = (depth[u] ?? 0) + 1;
          queue.push(v);
        }
      }
    }

    // Ensure root is near top center
    const root = idToNode.get(subjectNode.id)!;
    root.position = { x: root.position.x ?? 0, y: 0 } as any;

    // Order children and place them under parents
    const placeChildren = (parentId: string) => {
      const parent = idToNode.get(parentId);
      if (!parent) return;
      const kids = (children.get(parentId) || []).filter(id => idToNode.has(id));
      if (kids.length === 0) return;
      const startX = parent.position.x - (horizontalSpacing * (kids.length - 1)) / 2;
      kids.forEach((kidId, index) => {
        const kid = idToNode.get(kidId)!;
        kid.position = {
          x: startX + index * horizontalSpacing,
          y: parent.position.y + verticalSpacing,
        } as any;
      });
      // recurse
      kids.forEach(kidId => placeChildren(kidId));
    };
    placeChildren(subjectNode.id);

    // Repel horizontally per depth level to maintain minGapX
    const levels: Record<number, string[]> = {};
    for (const [id, d] of Object.entries(depth)) {
      if (!levels[d]) levels[d] = [];
      levels[d].push(id);
    }
    for (const d of Object.keys(levels).map(Number).sort((a, b) => a - b)) {
      const ids = levels[d].filter(id => idToNode.has(id));
      ids.sort((a, b) => idToNode.get(a)!.position.x - idToNode.get(b)!.position.x);
      for (let i = 1; i < ids.length; i++) {
        const prev = idToNode.get(ids[i - 1])!;
        const curr = idToNode.get(ids[i])!;
        const dx = (prev.position.x + minGapX) - curr.position.x;
        if (dx > 0) {
          // shift subtree of curr to the right by dx
          const shiftQueue = [ids[i]];
          while (shiftQueue.length) {
            const nid = shiftQueue.shift() as string;
            const n = idToNode.get(nid)!;
            n.position = { x: n.position.x + dx, y: n.position.y } as any;
            for (const ch of (children.get(nid) || [])) shiftQueue.push(ch);
          }
        }
      }
    }

    return Array.from(idToNode.values());
  }, []);

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

  // Emit snapshots and apply layout when graph changes
  useEffect(() => {
    const laidOut = layoutGraph(nodes, edges);
    setNodes(laidOut);
    onSnapshot?.({ nodes: laidOut, edges });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edges]);

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

      // Layout parameters (deterministic lanes per parent)
      const horizontalSpacing = 320; // even spacing between siblings
      const verticalSpacing = 500;   // distance from parent to children row
      const nodeWidth = 260;         // approximate node width for interval collision
      const rowSnap = 80;            // y tolerance to treat nodes as same row
      const baseY = parent.position.y + verticalSpacing;

      // Build occupied intervals on this children row to avoid cross-parent overlap
      // children row we are targeting
      const childrenRowY = baseY;
      const occupiedIntervals: Array<{ left: number; right: number }> = prevNodes
        .filter(n => Math.abs(n.position.y - childrenRowY) < rowSnap)
        .map(n => ({ left: n.position.x - nodeWidth / 2, right: n.position.x + nodeWidth / 2 }))
        .sort((a, b) => a.left - b.left);

      const intersects = (left: number, right: number) => {
        return occupiedIntervals.some(iv => !(right <= iv.left || left >= iv.right));
      };

      const reserveSlot = (centerX: number) => {
        // Shift by multiples of horizontalSpacing until a free slot is found
        let x = centerX;
        let guard = 0;
        while (guard++ < 200) {
          const left = x - nodeWidth / 2;
          const right = x + nodeWidth / 2;
          if (!intersects(left, right)) {
            occupiedIntervals.push({ left, right });
            return x;
          }
          // Try shifting alternately right and left
          const step = Math.ceil(guard / 2) * horizontalSpacing;
          x = guard % 2 === 0 ? centerX - step : centerX + step;
        }
        return centerX; // fallback
      };

      const placedNodes: Node[] = [];
      const totalChildren = existingChildrenCount + items.length;
      const firstIndex = existingChildrenCount; // new indices start after existing
      const startX = parent.position.x - (horizontalSpacing * (totalChildren - 1)) / 2;

      const newNodes: Node[] = items.map((item: any, idx: number) => {
        const itemNumber = item.itemNumber ?? idx + 1;
        const id = `${parentNodeId}-${itemNumber}`;
        const desiredX = startX + (firstIndex + idx) * horizontalSpacing;
        const desiredY = baseY;

        // Reserve a non-overlapping slot on this row
        const chosenX = reserveSlot(desiredX);
        const chosenY = desiredY;

        const node: Node = {
          id,
          type: 'description',
          position: { x: chosenX, y: chosenY },
          data: {
            description: item.description ?? 'No description',
            itemNumber,
            onElaborate: handleElaborate,
            isLoading: false,
            title: item.title ?? ''
          }
        } as Node;

        placedNodes.push(node);
        return node;
      }).filter(n => !existingIds.has(n.id));

      if (newNodes.length === 0) return prevNodes;

      // Merge first so we can compute row groups
      let merged = [...prevNodes, ...newNodes];

      // Enforce minimum spacing between sibling branches by shifting whole subtrees
      const minBranchGap = 100; // minimum gap between children blocks on the same row

      // Build groups for this row: bounds per parent based on its children on childrenRowY
      type Group = { parentId: string; left: number; right: number };
      const groupsMap = new Map<string, Group>();
      for (const n of merged) {
        if (!n.id.startsWith(`${parentNodeId.split('-')[0]}`)) {
          // not necessarily related; we'll derive group by parent prefixes next
        }
      }

      // Identify all parents that have children on this row
      const parentIdsOnRow = new Set<string>();
      for (const n of merged) {
        // child ids are in format `${parentId}-X`
        const dashIdx = n.id.lastIndexOf('-');
        if (dashIdx > 0) {
          const maybeParent = n.id.substring(0, dashIdx);
          // verify this is a child of a real parent node existing
          const p = merged.find(x => x.id === maybeParent);
          if (p && Math.abs(n.position.y - childrenRowY) < rowSnap) parentIdsOnRow.add(maybeParent);
        }
      }

      const groups: Group[] = [];
      for (const pid of parentIdsOnRow) {
        const kids = merged.filter(n => n.id.startsWith(`${pid}-`) && Math.abs(n.position.y - childrenRowY) < rowSnap);
        if (kids.length === 0) continue;
        const xs = kids.map(k => k.position.x);
        const left = Math.min(...xs) - nodeWidth / 2;
        const right = Math.max(...xs) + nodeWidth / 2;
        groups.push({ parentId: pid, left, right });
      }

      groups.sort((a, b) => a.left - b.left);

      const shiftSubtree = (rootId: string, dx: number) => {
        merged = merged.map(n => {
          if (n.id === rootId || n.id.startsWith(`${rootId}-`)) {
            return { ...n, position: { x: n.position.x + dx, y: n.position.y } } as Node;
          }
          return n;
        });
      };

      for (let i = 1; i < groups.length; i++) {
        const prev = groups[i - 1];
        const curr = groups[i];
        if (curr.left < prev.right + minBranchGap) {
          const needed = prev.right + minBranchGap - curr.left;
          shiftSubtree(curr.parentId, needed);
          curr.left += needed;
          curr.right += needed;
          // propagate shift to subsequent groups
          for (let j = i + 1; j < groups.length; j++) {
            groups[j].left += needed;
            groups[j].right += needed;
          }
        }
      }

      return merged;
    });

    setEdges(prevEdges => {
      const existingEdgeIds = new Set(prevEdges.map(e => e.id));
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

  return (
    <div className="w-full h-full relative overflow-hidden" style={{ background: 'var(--canvas-bg)' }}>
      {/* Premium animated background for empty state */}
      {nodes.length === 0 && (
        <div className="absolute inset-0">
          <div className="bg-animated" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-md p-8 glass-panel rounded-2xl animate-scale-in">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 relative"
                   style={{ 
                     background: 'var(--glass-bg)',
                     border: '1px solid var(--glass-border)',
                     boxShadow: 'var(--premium-glow)'
                   }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center animate-pulse"
                     style={{ background: 'linear-gradient(135deg, hsl(270 80% 60% / 0.3), hsl(280 70% 50% / 0.3))' }}>
                  <div className="w-6 h-6 rounded-full" 
                       style={{ background: 'var(--edge-primary)' }}></div>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3 tracking-tight">Ready to Create</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">Enter a topic above to generate your premium flowchart</p>
            </div>
          </div>
        </div>
      )}
      
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
        className="bg-transparent"
      >
        <Controls className="glass-panel" />
        <MiniMap 
          className="glass-panel"
          nodeColor={(node) => {
            switch (node.type) {
              case 'subject': return 'hsl(270, 80%, 65%)';
              case 'title': return 'hsl(270, 70%, 60%)'; 
              case 'description': return 'hsl(260, 70%, 55%)';
              default: return 'hsl(270, 60%, 50%)';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.85)"
        />
        <Background 
          gap={40} 
          size={1.5}
          color="hsl(270 80% 60% / 0.15)"
          className="opacity-60"
        />
      </ReactFlow>
    </div>
  );
};