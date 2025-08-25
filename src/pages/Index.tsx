import { useState, useRef } from 'react';
import { FlowchartCanvas } from '@/components/FlowchartCanvas';
import { JSONUploader } from '@/components/JSONUploader';
import { Button } from '@/components/ui/button';
import { CanvasToolbar } from '@/components/ui/CanvasToolbar';
import { PromptCard } from '@/components/ui/PromptCard';
import { ReactFlowInstance } from '@xyflow/react';

interface FlowchartData {
  itemNumber: number;
  title: string;
  description: string;
}

interface NodeData {
  id: string;
  title: string;
  description: string;
}

const Index = () => {
  const [flowchartData, setFlowchartData] = useState<FlowchartData[]>([]);
  const [subject, setSubject] = useState<string>('');
  const [showUploader, setShowUploader] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  const handleDataLoad = (data: FlowchartData[], subjectText?: string) => {
    setFlowchartData(data);
    setSubject(subjectText || 'Main Topic');
    setShowUploader(false);
  };
  
  const handleNodeClick = (nodeId: string, title: string, description: string) => {
    setSelectedNode({
      id: nodeId,
      title,
      description
    });
  };
  
  const handlePromptSubmit = (prompt: string) => {
    // In a real app, this would send the prompt to an API
    setSubject(prompt);
    // Mock data generation
    const mockData = [
      { itemNumber: 1, title: 'Introduction', description: 'This is a mock response for: ' + prompt },
      { itemNumber: 2, title: 'Key Concepts', description: 'These would be the key concepts related to: ' + prompt },
      { itemNumber: 3, title: 'Applications', description: 'Here are some applications of: ' + prompt },
    ];
    setFlowchartData(mockData);
  };
  
  const handleElaborateFromPanel = (nodeId: string) => {
    // This would trigger the elaborate function in FlowchartCanvas
  };

  const handleClearCanvas = () => {
    setFlowchartData([]);
    setSubject('');
    setShowUploader(true);
  };

  return (
    <div className="min-h-screen bg-background dark">
      {/* App Header - Minimal */}
      <div className="fixed top-0 left-0 right-0 z-20 h-14 flex items-center justify-between px-4 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">Webhook Sketch</h1>
        </div>
        <div>
          <Button variant="ghost" size="sm" onClick={handleClearCanvas} className="text-muted-foreground hover:text-foreground">
            Clear Canvas
          </Button>
        </div>
      </div>
      
      {/* Main Content - Full Screen Canvas */}
      <main className="pt-14 h-[calc(100vh-4rem)]">
        <div className="h-full relative">
          {/* Canvas Area */}
          <div className="w-full h-full">
            {flowchartData.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                {/* Empty state - just show the canvas */}
              </div>
            ) : (
              <>
                <FlowchartCanvas 
                  data={flowchartData} 
                  subject={subject} 
                  onNodeClick={handleNodeClick}
                  reactFlowInstanceRef={reactFlowInstance}
                />
                <CanvasToolbar 
                  reactFlowInstance={reactFlowInstance.current}
                  onResetView={() => reactFlowInstance.current?.fitView({ padding: 0.2 })}
                />
              </>
            )}
          </div>
          
          {/* Bottom Chat Box */}
          <div className="bottom-chatbox">
            <PromptCard onSubmit={handlePromptSubmit} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
