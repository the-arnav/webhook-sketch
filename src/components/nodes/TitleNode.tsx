import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

interface TitleNodeData {
  title: string;
  itemNumber: number;
  isRoot?: boolean;
}

export const TitleNode = memo((props: NodeProps) => {
  const data = props.data as unknown as TitleNodeData;
  return (
    <div className={`canvas-node-title rounded-lg p-6 min-w-[280px] max-w-[320px] ${
      data.isRoot ? 'ring-2 ring-primary/50' : ''
    }`}>
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!bg-primary !border-primary !w-3 !h-3"
      />
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">
            {data.itemNumber}
          </div>
          {data.isRoot && (
            <div className="px-2 py-1 bg-primary/20 rounded-full text-xs font-medium text-primary">
              Root
            </div>
          )}
        </div>
        
        <h3 className="text-lg font-bold text-foreground leading-tight">
          {data.title}
        </h3>
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!bg-primary !border-primary !w-3 !h-3"
      />
      
      {!data.isRoot && (
        <Handle 
          type="target" 
          position={Position.Left} 
          id="left"
          className="!bg-primary !border-primary !w-3 !h-3"
        />
      )}
      
      {data.isRoot && (
        <Handle 
          type="source" 
          position={Position.Right} 
          id="right"
          className="!bg-primary !border-primary !w-3 !h-3"
        />
      )}
    </div>
  );
});