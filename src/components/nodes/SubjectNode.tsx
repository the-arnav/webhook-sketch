import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BookOpen } from 'lucide-react';

export const SubjectNode = memo((props: NodeProps) => {
  const data = props.data as unknown as { subject: string };

  return (
    <div className="canvas-node-subject rounded-2xl p-8 min-w-[360px] max-w-[440px] animate-scale-in relative">
      {/* Bottom handle for connecting to titles */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="bottom"
        style={{
          background: 'var(--edge-primary)',
          border: '2px solid hsl(var(--background))',
          width: '16px',
          height: '16px',
          boxShadow: 'var(--premium-glow)'
        }}
      />
      
      <div className="text-center space-y-6 relative z-10">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto relative"
             style={{ 
               background: 'var(--glass-bg)',
               border: '1px solid var(--glass-border)',
               boxShadow: 'var(--premium-glow)'
             }}>
          <BookOpen className="w-8 h-8 text-primary" />
          <div className="absolute inset-0 rounded-full"
               style={{ background: 'var(--premium-border)' }}></div>
        </div>
        
        <div className="space-y-4">
          <div className="px-5 py-2.5 rounded-full text-sm font-semibold text-primary-foreground inline-block backdrop-blur-lg relative"
               style={{ 
                 background: 'var(--glass-bg)',
                 border: '1px solid var(--glass-border)',
                 boxShadow: 'var(--glass-shadow)'
               }}>
            ✨ Main Subject
          </div>
          <h1 className="text-3xl font-bold text-foreground leading-tight tracking-tight drop-shadow-2xl">
            {data.subject}
          </h1>
          <div className="w-20 h-1 rounded-full mx-auto"
               style={{ background: 'var(--premium-border)' }}></div>
        </div>
      </div>
    </div>
  );
});