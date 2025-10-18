import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

export const SubjectNode = memo((props: NodeProps) => {
  const data = props.data as unknown as { subject: string; customColor?: string };
  const customColor = data.customColor;

  return (
    <div 
      className="bg-card/90 backdrop-blur-sm border-2 border-primary/40 rounded-xl p-5 min-w-[240px] max-w-[320px] shadow-lg transition-all hover:shadow-xl hover:border-primary/60"
      style={{
        fontFamily: "'Comic Neue', 'Comic Sans MS', cursive",
        ...(customColor ? { 
          backgroundColor: customColor,
          borderColor: customColor 
        } : {})
      }}
    >
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="bottom"
        className="!bg-primary/80 !border-primary !w-3 !h-3 !rounded-full transition-all hover:!w-4 hover:!h-4"
      />
      
      <div className="text-center">
        <h1 className="text-lg font-bold text-foreground tracking-wide">
          {data.subject}
        </h1>
      </div>
    </div>
  );
});