import { useState, useRef } from 'react';
import { FlowchartCanvas } from '@/components/FlowchartCanvas';
import { JSONUploader } from '@/components/JSONUploader';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LeftSidebar } from '@/components/ui/LeftSidebar';
import { TopNavbar } from '@/components/ui/TopNavbar';
import { RightPanel } from '@/components/ui/RightPanel';
import { CanvasToolbar } from '@/components/ui/CanvasToolbar';
import { PromptCard } from '@/components/ui/PromptCard';
import { ReactFlowInstance } from '@xyflow/react';
import heroImage from '@/assets/hero-bg.jpg';

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
  const [showUploader, setShowUploader] = useState(true);
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
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
    setShowRightPanel(true);
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
    setShowRightPanel(false);
  };

  const handleClearCanvas = () => {
    setFlowchartData([]);
    setSubject('');
    setShowUploader(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNavbar 
        onClearCanvas={handleClearCanvas} 
        showUploader={showUploader} 
        setShowUploader={setShowUploader} 
        hasData={flowchartData.length > 0}
        onToggleSidebar={() => setShowLeftSidebar(!showLeftSidebar)}
      />

      {/* Left Sidebar */}
      <LeftSidebar 
        isOpen={showLeftSidebar} 
        onToggle={() => setShowLeftSidebar(!showLeftSidebar)} 
        onSelectPrompt={handlePromptSubmit}
        onSelectMap={(mapId) => console.log('Selected map:', mapId)}
      />
      
      {/* Right Panel */}
      <RightPanel 
        isOpen={showRightPanel} 
        onClose={() => setShowRightPanel(false)} 
        nodeData={selectedNode}
        onElaborate={handleElaborateFromPanel}
      />
      
      {/* Main Content */}
      <main className="flex-1 pt-16">
        <div className="container h-full flex">
          {/* Conditional Sidebar */}
          {showUploader && (
            <div className="w-96 glass-panel rounded-lg p-6 mr-6 h-[calc(100vh-7rem)] overflow-auto">
              <h2 className="text-xl font-semibold mb-4 premium-text">JSON Configuration</h2>
              <JSONUploader onDataLoad={handleDataLoad} />
            </div>
          )}
          
          {/* Main Canvas Area */}
          <div className="flex-1 glass-panel rounded-lg overflow-hidden h-[calc(100vh-7rem)]">
            {flowchartData.length === 0 ? (
              <div className="h-full flex items-center justify-center relative">
                <PromptCard onSubmit={handlePromptSubmit} />
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
        </div>
      </main>
    </div>
  );
};

export default Index;
