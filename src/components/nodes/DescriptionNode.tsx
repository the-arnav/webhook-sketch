import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface DescriptionNodeData {
  description: string;
  itemNumber: number;
  onElaborate?: (nodeId: string, content: string) => void;
  isLoading?: boolean;
  customColor?: string;
}

export const DescriptionNode = memo((props: NodeProps) => {
  const data = props.data as unknown as DescriptionNodeData;
  const customColor = data.customColor;
  const isSelected = props.selected;

  const handleElaborate = () => {
    if (data.onElaborate) {
      data.onElaborate(props.id, data.description);
    }
  };

  return (
    <div 
      className={`bg-card/70 backdrop-blur-sm border-2 rounded-md p-3 min-w-[200px] max-w-[240px] shadow transition-all hover:shadow-md ${
        isSelected 
          ? 'border-primary/50 ring-2 ring-primary/15 shadow-[0_0_12px_rgba(168,85,247,0.15)]' 
          : 'border-muted-foreground/25 hover:border-muted-foreground/40'
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
        className="!bg-muted-foreground/80 !border-muted-foreground !w-2 !h-2 !rounded-full transition-all hover:!w-3 hover:!h-3"
      />
      
      <div className="space-y-2.5">
        <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wide">Description</span>
        
        <p className="text-xs text-foreground/90 leading-relaxed">
          {data.description}
        </p>

        <Button
          onClick={handleElaborate}
          size="sm"
          variant="outline"
          disabled={data.isLoading}
          className="w-full text-[11px] h-7 hover:bg-primary/20"
        >
          <ChevronDown className="w-3 h-3 mr-1" />
          {data.isLoading ? 'Loading...' : 'Elaborate'}
        </Button>
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="bottom"
        className="!bg-muted-foreground/80 !border-muted-foreground !w-2 !h-2 !rounded-full transition-all hover:!w-3 hover:!h-3"
      />
    </div>
  );
});
