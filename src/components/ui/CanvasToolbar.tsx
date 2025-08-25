import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Download, RefreshCw, Maximize } from 'lucide-react';
import { ReactFlowInstance } from 'reactflow';
import { cn } from '@/lib/utils';

interface CanvasToolbarProps {
  reactFlowInstance: ReactFlowInstance | null;
  onResetView: () => void;
}

export function CanvasToolbar({ reactFlowInstance, onResetView }: CanvasToolbarProps) {
  const handleZoomIn = () => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomOut();
    }
  };

  const handleExportPNG = () => {
    if (reactFlowInstance) {
      // Get the flow elements DOM node
      const flowElement = document.querySelector('.react-flow') as HTMLElement;
      if (!flowElement) return;
      
      // Use html-to-image library (would need to be installed)
      // This is a placeholder - in a real implementation you'd use the actual library
      alert('Export as PNG functionality would be implemented here');
      // Example with html-to-image:
      // htmlToImage.toPng(flowElement).then((dataUrl) => {
      //   const link = document.createElement('a');
      //   link.download = 'flowchart.png';
      //   link.href = dataUrl;
      //   link.click();
      // });
    }
  };

  const handleExportJSON = () => {
    if (reactFlowInstance) {
      const flowData = reactFlowInstance.toObject();
      const dataStr = JSON.stringify(flowData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportName = 'flowchart.json';
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportName);
      linkElement.click();
    }
  };

  return (
    <div className="fixed right-4 top-20 z-10 flex flex-col gap-2 slide-in-right">
      <div className="glass-panel rounded-lg p-2 flex flex-col gap-2 shadow-lg">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md hover:bg-primary/20"
          onClick={handleZoomIn}
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md hover:bg-primary/20"
          onClick={handleZoomOut}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <div className="w-full h-px bg-border/20 my-1" />
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md hover:bg-primary/20"
          onClick={handleExportPNG}
          title="Export as PNG"
        >
          <Download className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md hover:bg-primary/20"
          onClick={handleExportJSON}
          title="Export as JSON"
        >
          <Download className="h-4 w-4" />
        </Button>
        
        <div className="w-full h-px bg-border/20 my-1" />
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md hover:bg-primary/20"
          onClick={onResetView}
          title="Reset View"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-md hover:bg-primary/20"
          onClick={() => reactFlowInstance?.fitView({ padding: 0.2, includeHiddenNodes: true })}
          title="Fit View"
        >
          <Maximize className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}