
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
      className="bg-card border border-border rounded-lg p-4 min-w-[240px] max-w-[280px] shadow-sm"
      style={customColor ? { 
        backgroundColor: customColor,
        borderColor: customColor
      } : undefined}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        id="top"
        className="!bg-muted-foreground !border-border !w-3 !h-3"
      />
      
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs font-semibold text-muted-foreground">
            {data.itemNumber}
          </div>
          <span className="text-xs text-muted-foreground">Topic</span>
        </div>
        
        <h3 className="text-base font-semibold text-foreground leading-snug">
          {data.title}
        </h3>

        <Button
          onClick={handleElaborate}
          size="sm"
          variant="outline"
          disabled={data.isLoading}
          className="w-full text-xs"
        >
          <ChevronDown className="w-3 h-3 mr-1" />
          {data.isLoading ? 'Loading...' : 'Elaborate'}
        </Button>
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="bottom"
        className="!bg-muted-foreground !border-border !w-3 !h-3"
      />
    </div>
  );
});
