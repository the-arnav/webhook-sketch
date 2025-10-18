import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface CombinedNodeData {
  title: string;
  description: string;
  itemNumber: number;
  onElaborate?: (nodeId: string, content: string) => void;
  isLoading?: boolean;
  customColor?: string;
}

export const CombinedNode = memo((props: NodeProps) => {
  const data = props.data as unknown as CombinedNodeData;
  const customColor = data.customColor;
  const isSelected = props.selected;

  const handleElaborate = () => {
    if (data.onElaborate) {
      data.onElaborate(props.id, `${data.title}: ${data.description}`);
    }
  };

  return (
    <div 
      className={`bg-card/85 backdrop-blur-sm border-2 rounded-lg p-4 min-w-[260px] max-w-[300px] shadow-lg transition-all hover:shadow-xl ${
        isSelected 
          ? 'border-primary/70 ring-2 ring-primary/30 shadow-[0_0_20px_rgba(168,85,247,0.25)]' 
          : 'border-accent/40 hover:border-accent/60'
      }`}
      style={{
        fontFamily: "'Comic Neue', 'Comic Sans MS', cursive",
        ...(customColor ? { 
          backgroundColor: customColor,
          borderColor: customColor
        } : {})
      }}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        id="top"
        className="!bg-accent/90 !border-accent !w-2.5 !h-2.5 !rounded-full transition-all hover:!w-3.5 hover:!h-3.5"
      />
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">
            #{data.itemNumber}
          </span>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-base font-bold text-foreground leading-snug">
            {data.title}
          </h3>
          
          <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border/40">
            {data.description}
          </p>
        </div>

        <Button
          onClick={handleElaborate}
          size="sm"
          variant="outline"
          disabled={data.isLoading}
          className="w-full text-[11px] h-7 hover:bg-primary/20 transition-all"
        >
          <ChevronDown className="w-3 h-3 mr-1" />
          {data.isLoading ? 'Loading...' : 'Elaborate'}
        </Button>
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="bottom"
        className="!bg-accent/90 !border-accent !w-2.5 !h-2.5 !rounded-full transition-all hover:!w-3.5 hover:!h-3.5"
      />
    </div>
  );
});
