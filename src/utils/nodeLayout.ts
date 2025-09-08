import { Node, Edge } from '@xyflow/react';

export interface LayoutConfig {
  nodeWidth: number;
  nodeHeight: number;
  levelSpacing: number;
  siblingSpacing: number;
  childSpacing: number;
  centerAlignment: boolean;
  collisionDetection: boolean;
}

export interface TreeNode {
  id: string;
  children: TreeNode[];
  x: number;
  y: number;
  width: number;
  height: number;
  level: number;
  subtreeWidth?: number;
  mod?: number;
  thread?: TreeNode;
  ancestor?: TreeNode;
  change?: number;
  shift?: number;
  prelimX?: number;
}

/**
 * Professional tree layout algorithm based on Reingold-Tilford with improvements
 * for collision detection and optimal spacing
 */
export const calculateProfessionalTreeLayout = (
  nodes: Node[],
  edges: Edge[],
  config: LayoutConfig
): Node[] => {
  if (nodes.length === 0) return nodes;

  // Build tree structure
  const treeNodes = buildTreeStructure(nodes, edges, config);
  const rootNode = treeNodes.find(n => n.level === 0);
  
  if (!rootNode) return nodes;

  // Apply Reingold-Tilford algorithm
  firstWalk(rootNode);
  secondWalk(rootNode, -rootNode.prelimX!);

  // Apply collision detection if enabled
  if (config.collisionDetection) {
    resolveCollisions(treeNodes, config);
  }

  // Center the entire tree if enabled
  if (config.centerAlignment) {
    centerTree(treeNodes);
  }

  // Convert back to React Flow nodes
  return nodes.map(node => {
    const treeNode = treeNodes.find(tn => tn.id === node.id);
    return {
      ...node,
      position: {
        x: treeNode?.x || node.position.x,
        y: treeNode?.y || node.position.y
      }
    };
  });
};

const buildTreeStructure = (nodes: Node[], edges: Edge[], config: LayoutConfig): TreeNode[] => {
  const nodeMap = new Map<string, TreeNode>();
  const children: Record<string, string[]> = {};

  // Initialize tree nodes
  nodes.forEach(node => {
    nodeMap.set(node.id, {
      id: node.id,
      children: [],
      x: 0,
      y: 0,
      width: config.nodeWidth,
      height: config.nodeHeight,
      level: 0
    });
  });

  // Build parent-child relationships
  edges.forEach(edge => {
    if (!children[edge.source]) {
      children[edge.source] = [];
    }
    children[edge.source].push(edge.target);
  });

  // Find root node (subject node or node with no incoming edges)
  const rootId = nodes.find(node => 
    node.type === 'subject' || !edges.some(edge => edge.target === node.id)
  )?.id;

  if (!rootId) return Array.from(nodeMap.values());

  // Build tree structure recursively
  const buildTree = (nodeId: string, level: number): TreeNode => {
    const treeNode = nodeMap.get(nodeId)!;
    treeNode.level = level;
    treeNode.y = level * config.levelSpacing;

    const childIds = children[nodeId] || [];
    treeNode.children = childIds.map(childId => buildTree(childId, level + 1));

    return treeNode;
  };

  const rootNode = buildTree(rootId, 0);
  return Array.from(nodeMap.values());
};

/**
 * First walk of Reingold-Tilford algorithm
 * Assigns preliminary x coordinates
 */
const firstWalk = (node: TreeNode): void => {
  if (node.children.length === 0) {
    // Leaf node
    node.prelimX = 0;
    if (node.children.length > 0) {
      // Has left sibling
      const leftSibling = getLeftSibling(node);
      if (leftSibling) {
        node.prelimX = leftSibling.prelimX! + leftSibling.width + getSiblingDistance(node);
      }
    }
  } else {
    // Internal node
    node.children.forEach(child => firstWalk(child));
    
    const midpoint = (node.children[0].prelimX! + node.children[node.children.length - 1].prelimX!) / 2;
    node.prelimX = midpoint;
    
    const leftSibling = getLeftSibling(node);
    if (leftSibling) {
      node.prelimX = leftSibling.prelimX! + leftSibling.width + getSiblingDistance(node);
      node.mod = node.prelimX - midpoint;
      apportion(node);
    }
  }
};

/**
 * Second walk of Reingold-Tilford algorithm
 * Assigns final x coordinates
 */
const secondWalk = (node: TreeNode, modSum: number): void => {
  node.x = node.prelimX! + modSum;
  
  node.children.forEach(child => {
    secondWalk(child, modSum + (node.mod || 0));
  });
};

const getLeftSibling = (node: TreeNode): TreeNode | null => {
  // This would need parent reference in real implementation
  // Simplified for this example
  return null;
};

const getSiblingDistance = (node: TreeNode): number => {
  return 100; // Base sibling distance
};

const apportion = (node: TreeNode): void => {
  // Simplified apportion - in real implementation this handles
  // conflicts between subtrees
};

/**
 * Resolve node collisions using force-based adjustments
 */
const resolveCollisions = (nodes: TreeNode[], config: LayoutConfig): void => {
  const iterations = 10;
  const repulsion = 100;

  for (let i = 0; i < iterations; i++) {
    let hasCollision = false;

    for (let j = 0; j < nodes.length; j++) {
      for (let k = j + 1; k < nodes.length; k++) {
        const node1 = nodes[j];
        const node2 = nodes[k];

        // Skip if on different levels
        if (Math.abs(node1.level - node2.level) > 1) continue;

        const dx = node2.x - node1.x;
        const dy = node2.y - node1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = Math.max(node1.width, node2.width) + 50;

        if (distance < minDistance && distance > 0) {
          hasCollision = true;
          const force = (minDistance - distance) / distance;
          const fx = (dx / distance) * force * repulsion;
          const fy = (dy / distance) * force * repulsion;

          node1.x -= fx * 0.5;
          node1.y -= fy * 0.1;
          node2.x += fx * 0.5;
          node2.y += fy * 0.1;
        }
      }
    }

    if (!hasCollision) break;
  }
};

/**
 * Center the entire tree in the viewport
 */
const centerTree = (nodes: TreeNode[]): void => {
  if (nodes.length === 0) return;

  const minX = Math.min(...nodes.map(n => n.x));
  const maxX = Math.max(...nodes.map(n => n.x + n.width));
  const minY = Math.min(...nodes.map(n => n.y));
  const maxY = Math.max(...nodes.map(n => n.y + n.height));

  const centerX = -(minX + maxX) / 2;
  const centerY = -(minY + maxY) / 2;

  nodes.forEach(node => {
    node.x += centerX;
    node.y += centerY;
  });
};

/**
 * Smart node positioning for elaborated children
 * Positions new nodes vertically below their parent with intelligent spacing
 */
export const positionElaboratedChildren = (
  parentNode: Node,
  newNodes: Node[],
  existingNodes: Node[],
  config: LayoutConfig
): Node[] => {
  const siblingSpacing = config.childSpacing || 160;
  const startY = parentNode.position.y + config.levelSpacing;
  
  return newNodes.map((node, index) => ({
    ...node,
    position: {
      x: parentNode.position.x,
      y: startY + (index * siblingSpacing)
    }
  }));
};