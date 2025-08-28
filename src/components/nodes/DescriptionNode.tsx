import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface DescriptionNodeData {
  description: string;
  itemNumber: number;
  onElaborate?: (nodeId: string, content: string) => void;
  isLoading?: boolean;
}

export const DescriptionNode = memo((props: NodeProps) => {
  const data = props.data as unknown as DescriptionNodeData;

  const handleElaborate = () => {
    if (data.onElaborate) {
      data.onElaborate(props.id, data.description);
    }
  };

  return (
    <div className="canvas-node-description rounded-xl p-5 min-w-[280px] max-w-[320px] animate-fade-in relative">
      {/* Top handle for receiving connections from titles */}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="top"
        style={{
          background: 'var(--edge-secondary)',
          border: '2px solid hsl(var(--background))',
          width: '10px',
          height: '10px',
          boxShadow: '0 0 10px hsl(260 70% 50% / 0.4)'
        }}
      />
      
      <div className="space-y-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs backdrop-blur-lg"
               style={{ 
                 background: 'var(--glass-bg)',
                 border: '1px solid var(--glass-border)',
                 color: 'hsl(var(--muted-foreground))'
               }}>
            ●
          </div>
          <span className="text-xs font-medium tracking-wide px-3 py-1 rounded-full backdrop-blur-lg"
                style={{ 
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  color: 'hsl(var(--muted-foreground))'
                }}>
            📄 Description
          </span>
        </div>
        
        <p className="text-sm text-foreground leading-relaxed tracking-wide opacity-90">
          {data.description}
        </p>

        <Button
          onClick={handleElaborate}
          size="sm"
          variant="ghost"
          disabled={data.isLoading}
          className="w-full text-xs backdrop-blur-lg border transition-all duration-300 hover:scale-105"
          style={{ 
            borderColor: 'var(--glass-border)',
            color: 'hsl(var(--muted-foreground))',
            background: 'var(--glass-bg)'
          }}
        >
          <ChevronDown className="w-3 h-3 mr-1" />
          {data.isLoading ? 'Loading...' : 'Elaborate More'}
        </Button>
      </div>

      {/* Bottom handle for connecting to elaborated nodes */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="bottom"
        style={{
          background: 'hsl(280 60% 45%)',
          border: '2px solid hsl(var(--background))',
          width: '10px',
          height: '10px',
          boxShadow: '0 0 8px hsl(280 60% 45% / 0.4)'
        }}
      />
    </div>
  );
});