import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

interface DescriptionNodeData {
  description: string;
  itemNumber: number;
}

export const DescriptionNode = memo((props: NodeProps) => {
  const data = props.data as unknown as DescriptionNodeData;

  return (
    <div className="canvas-node-description rounded-xl p-5 min-w-[260px] max-w-[300px] animate-fade-in">
      {/* Enhanced handles */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!bg-slate-400 !border-slate-300 !w-3 !h-3 !shadow-sm"
      />
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!bg-slate-400 !border-slate-300 !w-3 !h-3 !shadow-sm"
      />
      <Handle 
        type="target" 
        position={Position.Right} 
        className="!bg-slate-400 !border-slate-300 !w-3 !h-3 !shadow-sm"
      />
      
      <div className="space-y-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-slate-400/20 rounded-full flex items-center justify-center text-xs text-slate-300">
            ●
          </div>
          <span className="text-xs text-slate-400 font-medium tracking-wide">📄 Description</span>
        </div>
        
        <p className="text-sm text-slate-200 leading-relaxed tracking-wide">
          {data.description}
        </p>
      </div>
    </div>
  );
});