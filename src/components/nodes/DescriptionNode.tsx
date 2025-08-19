import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

interface DescriptionNodeData {
  description: string;
  itemNumber: number;
}

export const DescriptionNode = memo((props: NodeProps) => {
  const data = props.data as unknown as DescriptionNodeData;
  return (
    <div className="canvas-node-description rounded-lg p-4 min-w-[260px] max-w-[300px]">
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!bg-primary !border-primary !w-3 !h-3"
      />
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-muted/30 rounded-full flex items-center justify-center text-xs text-muted-foreground">
            •
          </div>
          <span className="text-xs text-muted-foreground font-medium">Description</span>
        </div>
        
        <p className="text-sm text-foreground/90 leading-relaxed">
          {data.description}
        </p>
      </div>
    </div>
  );
});