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
  
  const handlePromptSubmit = async (prompt: string) => {
    setSubject(prompt);
    try {
      const response = await fetch('https://officially-probable-hamster.ngrok-free.app/webhook/b919abb2-222c-4793-958f-83fa6b3e729c', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      let items: any[] = [];
      if (result.output && result.output.items) {
        items = result.output.items;
      } else if (Array.isArray(result)) {
        items = result;
      } else if (result.items) {
        items = result.items;
      } else if (result.data) {
        items = result.data;
      } else if (result.output) {
        if (Array.isArray(result.output)) {
          items = result.output;
        } else if (typeof result.output === 'object') {
          const outputKeys = Object.keys(result.output).filter(key => key !== 'items');
          if (outputKeys.length > 0) {
            items = outputKeys.map(key => ({
              title: key,
              description: result.output[key]
            }));
          }
        }
      }

      const newFlowchartData: FlowchartData[] = items.map((item: any, index: number) => {
        if (typeof item === 'string') {
          return {
            itemNumber: index + 1,
            title: `Point ${index + 1}`,
            description: item
          };
        }
        return {
          itemNumber: index + 1,
          title: item.title || item.name || item.topic || item.key || `Point ${index + 1}`,
          description: item.description || item.detail || item.content || item.text || item.value || 'No description provided.',
        };
      });
      setFlowchartData(newFlowchartData);
    } catch (error) {
      console.error('Error sending prompt to webhook:', error);
      // Optionally, show an error message to the user
    }
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
