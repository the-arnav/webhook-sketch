import { create } from 'zustand';

export interface FlowchartNode {
  id: string;
  itemNumber: number;
  title: string;
  description: string;
  parentId?: string;
  children?: string[];
}

interface MindMapState {
  nodes: FlowchartNode[];
  subject: string;
  isLoading: boolean;
  expandedNodes: Set<string>;
  
  // Actions
  setInitialData: (data: FlowchartNode[], subject: string) => void;
  addChildNodes: (parentId: string, childNodes: FlowchartNode[]) => void;
  clearAll: () => void;
  setLoading: (loading: boolean) => void;
  setNodeExpanded: (nodeId: string, expanded: boolean) => void;
}

export const useMindMapStore = create<MindMapState>((set, get) => ({
  nodes: [],
  subject: '',
  isLoading: false,
  expandedNodes: new Set(),

  setInitialData: (data, subject) => {
    const nodes = data.map(item => ({
      ...item,
      id: `node-${item.itemNumber}`,
      children: []
    }));
    
    set({ 
      nodes, 
      subject,
      expandedNodes: new Set()
    });
  },

  addChildNodes: (parentId, childNodes) => {
    const { nodes } = get();
    
    // Create new child nodes with proper IDs and parent references
    const newChildNodes = childNodes.map((child, index) => ({
      ...child,
      id: `${parentId}-child-${index + 1}`,
      parentId,
      children: []
    }));
    
    // Update parent node to include child IDs
    const updatedNodes = nodes.map(node => {
      if (node.id === parentId) {
        return {
          ...node,
          children: newChildNodes.map(child => child.id)
        };
      }
      return node;
    });
    
    // Add the new child nodes
    const allNodes = [...updatedNodes, ...newChildNodes];
    
    set({ nodes: allNodes });
  },

  clearAll: () => {
    set({ 
      nodes: [], 
      subject: '', 
      expandedNodes: new Set() 
    });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setNodeExpanded: (nodeId, expanded) => {
    const { expandedNodes } = get();
    const newExpandedNodes = new Set(expandedNodes);
    
    if (expanded) {
      newExpandedNodes.add(nodeId);
    } else {
      newExpandedNodes.delete(nodeId);
    }
    
    set({ expandedNodes: newExpandedNodes });
  }
}));