import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BookOpen } from 'lucide-react';

export const SubjectNode = memo((props: NodeProps) => {
  const data = props.data as unknown as { subject: string };

  return (
    <div className="canvas-node-subject rounded-xl p-8 min-w-[320px] max-w-[400px] animate-scale-in">
      <Handle 
        type="source" 
        position={Position.Top} 
        className="!bg-primary !border-primary !w-4 !h-4"
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!bg-primary !border-primary !w-4 !h-4"
      />
      <Handle 
        type="source" 
        position={Position.Left} 
        className="!bg-primary !border-primary !w-4 !h-4"
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!bg-primary !border-primary !w-4 !h-4"
      />
      
      <div className="text-center space-y-4">
        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
          <BookOpen className="w-6 h-6 text-primary" />
        </div>
        
        <div className="space-y-2">
          <div className="px-3 py-1 bg-primary/10 rounded-full text-xs font-medium text-primary inline-block">
            Main Subject
          </div>
          <h1 className="text-2xl font-bold text-white leading-tight">
            {data.subject}
          </h1>
        </div>
      </div>
    </div>
  );
});