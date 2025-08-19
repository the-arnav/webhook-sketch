import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

interface TitleNodeData {
  title: string;
  itemNumber: number;
}

export const TitleNode = memo((props: NodeProps) => {
  const data = props.data as unknown as TitleNodeData;

  return (
    <div className="canvas-node-title rounded-xl p-6 min-w-[280px] max-w-[320px] animate-fade-in hover-scale">
      {/* Enhanced handles with better styling */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!bg-purple-400 !border-purple-300 !w-3 !h-3 !shadow-md"
      />
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!bg-purple-400 !border-purple-300 !w-3 !h-3 !shadow-md"
      />
      <Handle 
        type="target" 
        position={Position.Right} 
        className="!bg-purple-400 !border-purple-300 !w-3 !h-3 !shadow-md"
      />
      <Handle 
        type="target" 
        position={Position.Bottom} 
        className="!bg-purple-400 !border-purple-300 !w-3 !h-3 !shadow-md"
      />
      
      <div className="space-y-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-400/20 rounded-full flex items-center justify-center text-sm font-bold text-purple-300 shadow-sm">
            {data.itemNumber}
          </div>
          <div className="px-3 py-1.5 bg-blue-400/20 rounded-full text-xs font-medium text-blue-300 backdrop-blur-sm border border-blue-400/30">
            📝 Topic
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-white leading-tight tracking-wide drop-shadow-md">
          {data.title}
        </h3>
      </div>
      
      {/* Enhanced source handles */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!bg-purple-400 !border-purple-300 !w-3 !h-3 !shadow-md"
      />
      <Handle 
        type="source" 
        position={Position.Left} 
        id="left-source"
        className="!bg-purple-400 !border-purple-300 !w-3 !h-3 !shadow-md"
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="right-source"
        className="!bg-purple-400 !border-purple-300 !w-3 !h-3 !shadow-md"
      />
    </div>
  );
});