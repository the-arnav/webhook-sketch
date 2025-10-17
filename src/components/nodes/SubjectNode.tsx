import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BookOpen } from 'lucide-react';

export const SubjectNode = memo((props: NodeProps) => {
  const data = props.data as unknown as { subject: string; customColor?: string };
  const customColor = data.customColor;

  return (
    <div 
      className="bg-card border border-border rounded-lg p-6 min-w-[280px] max-w-[350px] shadow-sm"
      style={customColor ? { 
        backgroundColor: customColor,
        borderColor: customColor 
      } : undefined}
    >
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="bottom"
        className="!bg-muted-foreground !border-border !w-3 !h-3"
      />
      
      <div className="text-center space-y-3">
        <BookOpen className="w-6 h-6 text-muted-foreground mx-auto" />
        <h1 className="text-xl font-semibold text-foreground">
          {data.subject}
        </h1>
      </div>
    </div>
  );
});