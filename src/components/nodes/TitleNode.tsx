
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
      className="bg-card/80 backdrop-blur-sm border border-accent/50 rounded-lg p-4 min-w-[220px] max-w-[280px] shadow-md transition-all hover:shadow-lg hover:border-accent"
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
        className="!bg-accent/80 !border-accent !w-2.5 !h-2.5 !rounded-full transition-all hover:!w-3.5 hover:!h-3.5"
      />
      
      <div className="space-y-2.5">
        <span className="text-xs font-semibold text-primary/90">
          #{data.itemNumber}
        </span>
        
        <h3 className="text-sm font-semibold text-foreground leading-relaxed">
          {data.title}
        </h3>

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
        className="!bg-accent/80 !border-accent !w-2.5 !h-2.5 !rounded-full transition-all hover:!w-3.5 hover:!h-3.5"
      />
    </div>
  );
});
