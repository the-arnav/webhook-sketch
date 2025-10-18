import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

export const SubjectNode = memo((props: NodeProps) => {
  const data = props.data as unknown as { subject: string; customColor?: string };
  const customColor = data.customColor;
  const isSelected = props.selected;

  return (
    <div 
      className={`bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-md border-3 rounded-2xl p-6 min-w-[280px] max-w-[360px] shadow-2xl transition-all hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] ${
        isSelected 
          ? 'border-primary ring-4 ring-primary/40 shadow-[0_0_50px_rgba(168,85,247,0.5)]' 
          : 'border-primary/50 hover:border-primary/80'
      }`}
      style={{
        fontFamily: "'Comic Neue', 'Comic Sans MS', cursive",
        ...(customColor ? { 
          background: `linear-gradient(135deg, ${customColor}40, ${customColor}20)`,
          borderColor: customColor 
        } : {})
      }}
    >
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="bottom"
        className="!bg-primary !border-2 !border-primary-foreground !w-4 !h-4 !rounded-full transition-all hover:!w-5 hover:!h-5 hover:shadow-[0_0_15px_rgba(168,85,247,0.6)]"
      />
      
      <div className="text-center space-y-2">
        <div className="text-xs font-medium text-primary uppercase tracking-widest">Main Topic</div>
        <h1 className="text-xl font-black text-foreground tracking-wide bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {data.subject}
        </h1>
      </div>
    </div>
  );
});