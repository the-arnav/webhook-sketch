import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BookOpen } from 'lucide-react';

export const SubjectNode = memo((props: NodeProps) => {
  const data = props.data as unknown as { subject: string; customColor?: string };
  const customColor = data.customColor;

  return (
    <div 
      className="canvas-node-subject rounded-xl p-8 min-w-[320px] max-w-[400px] animate-scale-in"
      style={customColor ? { 
        background: `linear-gradient(135deg, ${customColor} 0%, ${customColor}dd 100%)`,
        borderColor: customColor 
      } : undefined}
    >
      {/* Bottom handle for connecting to titles */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="bottom"
        className="!bg-purple-400 !border-purple-300 !w-4 !h-4 !shadow-lg"
      />
      
      <div className="text-center space-y-4 relative z-10">
        <div className="w-14 h-14 bg-purple-400/20 rounded-full flex items-center justify-center mx-auto shadow-lg">
          <BookOpen className="w-7 h-7 text-purple-200" />
        </div>
        
        <div className="space-y-3">
          <div className="px-4 py-2 bg-purple-400/20 rounded-full text-sm font-medium text-purple-200 inline-block backdrop-blur-sm border border-purple-400/30">
            ✨ Main Subject
          </div>
          <h1 className="text-3xl font-bold text-white leading-tight tracking-tight drop-shadow-lg">
            {data.subject}
          </h1>
          <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-purple-300 to-transparent mx-auto"></div>
        </div>
      </div>
    </div>
  );
});