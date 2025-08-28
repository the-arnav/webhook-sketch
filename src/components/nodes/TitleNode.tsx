import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface TitleNodeData {
  title: string;
  itemNumber: number;
  onElaborate?: (nodeId: string, content: string) => void;
  isLoading?: boolean;
}

export const TitleNode = memo((props: NodeProps) => {
  const data = props.data as unknown as TitleNodeData;

  const handleElaborate = () => {
    if (data.onElaborate) {
      data.onElaborate(props.id, data.title);
    }
  };

  return (
    <div className="canvas-node-title rounded-xl p-6 min-w-[300px] max-w-[340px] animate-fade-in hover-scale relative">
      {/* Top handle for receiving connections from subject */}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="top"
        style={{
          background: 'var(--edge-primary)',
          border: '2px solid hsl(var(--background))',
          width: '12px',
          height: '12px',
          boxShadow: 'var(--edge-glow)'
        }}
      />
      
      <div className="space-y-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold backdrop-blur-lg relative"
               style={{ 
                 background: 'var(--glass-bg)',
                 border: '1px solid var(--glass-border)',
                 color: 'hsl(var(--primary))'
               }}>
            {data.itemNumber}
          </div>
          <div className="px-4 py-2 rounded-full text-xs font-semibold backdrop-blur-lg"
               style={{ 
                 background: 'var(--glass-bg)',
                 border: '1px solid var(--glass-border)',
                 color: 'hsl(var(--accent-foreground))'
               }}>
            📝 Topic
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-foreground leading-tight tracking-wide drop-shadow-lg">
          {data.title}
        </h3>

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
      
      {/* Bottom handle for connecting to descriptions */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="bottom"
        style={{
          background: 'var(--edge-secondary)',
          border: '2px solid hsl(var(--background))',
          width: '12px',
          height: '12px',
          boxShadow: 'var(--edge-glow)'
        }}
      />
    </div>
  );
});