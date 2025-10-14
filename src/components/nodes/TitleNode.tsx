
import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface TitleNodeData {
  title: string;
  itemNumber: number;
  onElaborate?: (nodeId: string, content: string) => void;
  isLoading?: boolean;
  customColor?: string;
}

export const TitleNode = memo((props: NodeProps) => {
  const data = props.data as unknown as TitleNodeData;
  const customColor = data.customColor;

  const handleElaborate = () => {
    if (data.onElaborate) {
      data.onElaborate(props.id, data.title);
    }
  };

  return (
    <div 
      className="canvas-node-title rounded-xl p-6 min-w-[280px] max-w-[320px] animate-fade-in hover-scale"
      style={customColor ? { 
        background: `linear-gradient(135deg, ${customColor}30 0%, ${customColor}20 100%)`,
        borderColor: `${customColor}80`
      } : undefined}
    >
      {/* Top handle for receiving connections from subject */}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="top"
        className="!bg-purple-400 !border-purple-300 !w-3 !h-3 !shadow-md"
      />
      
      <div className="space-y-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-400/20 rounded-full flex items-center justify-center text-sm font-bold text-purple-300 shadow-sm">
            {data.itemNumber}
          </div>
          <div className="px-3 py-1.5 bg-blue-400/20 rounded-full text-xs font-medium text-blue-300 backdrop-blur-sm border border-blue-400/30">
            📝 Topic
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-white leading-tight tracking-wide drop-shadow-md">
          {data.title}
        </h3>

        <Button
          onClick={handleElaborate}
          size="sm"
          variant="ghost"
          disabled={data.isLoading}
          className="w-full text-xs text-purple-300 hover:text-white hover:bg-purple-500/20 border border-purple-400/30 disabled:opacity-50"
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
        className="!bg-purple-400 !border-purple-300 !w-3 !h-3 !shadow-md"
      />
    </div>
  );
});
