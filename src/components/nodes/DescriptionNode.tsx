
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

  const handleElaborate = () => {
    if (data.onElaborate) {
      data.onElaborate(props.id, data.description);
    }
  };

  return (
    <div 
      className="bg-card border border-border rounded-lg p-4 min-w-[220px] max-w-[260px] shadow-sm"
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
        <span className="text-xs text-muted-foreground">Description</span>
        
        <p className="text-sm text-foreground leading-relaxed">
          {data.description}
        </p>

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
