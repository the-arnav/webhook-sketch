import { Button } from '@/components/ui/button';
import { X, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NodeData {
  id: string;
  title: string;
  description: string;
}

interface RightPanelProps {
  isOpen: boolean;
  onClose: () => void;
  nodeData: NodeData | null;
  onElaborate: (nodeId: string) => void;
}

export function RightPanel({ isOpen, onClose, nodeData, onElaborate }: RightPanelProps) {
  if (!nodeData) return null;

  return (
    <div className={cn(
      'sidebar sidebar-right transition-all duration-300 ease-in-out',
      isOpen ? 'translate-x-0' : 'translate-x-full'
    )}>
      <div className="h-full w-80 glass-panel border-l flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border/20 flex items-center justify-between">
          <h2 className="text-lg font-semibold premium-text">Node Details</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full hover:bg-primary/10"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-md mb-3">
              <div className="text-2xl">✨</div>
            </div>
            <h3 className="text-xl font-semibold mb-2">{nodeData.title}</h3>
          </div>
          
          <div className="prose prose-sm prose-invert max-w-none">
            <p className="text-muted-foreground whitespace-pre-wrap">{nodeData.description}</p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-border/20">
          <Button 
            className="w-full bg-gradient-to-r from-purple-600 to-purple-400 hover:from-purple-700 hover:to-purple-500 text-white"
            onClick={() => onElaborate(nodeData.id)}
          >
            <Zap className="h-4 w-4 mr-2" />
            Elaborate More
          </Button>
        </div>
      </div>
    </div>
  );
}