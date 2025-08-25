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
    <div className="canvas-node-description rounded-xl p-5 min-w-[260px] max-w-[300px] animate-fade-in shadow-md">
      {/* Top handle for receiving connections from titles */}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="top"
        className="!bg-purple-400 !border-purple-300 !w-3 !h-3 !shadow-sm !border-2"
        style={{ boxShadow: '0 0 6px hsl(270, 90%, 70%, 0.5)' }}
      />
      
      <div className="space-y-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-purple-400/20 rounded-full flex items-center justify-center text-xs text-purple-300">
            ●
          </div>
          <span className="text-xs text-purple-300 font-medium tracking-wide">📄 Description</span>
        </div>
        
        <p className="text-sm text-purple-100 leading-relaxed tracking-wide">
          {data.description}
        </p>

        <Button
          onClick={handleElaborate}
          size="sm"
          variant="ghost"
          disabled={data.isLoading}
          className="w-full text-xs text-purple-300 hover:text-white hover:bg-purple-500/20 border border-purple-400/30 disabled:opacity-50 transition-all duration-300"
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
        className="!bg-slate-400 !border-slate-300 !w-3 !h-3 !shadow-sm"
      />
    </div>
  );
});