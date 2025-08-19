import { useState } from 'react';
import { FlowchartCanvas } from '@/components/FlowchartCanvas';
import { JSONUploader } from '@/components/JSONUploader';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import heroImage from '@/assets/hero-bg.jpg';

interface FlowchartData {
  itemNumber: number;
  title: string;
  description: string;
}

const Index = () => {
  const [flowchartData, setFlowchartData] = useState<FlowchartData[]>([]);
  const [showUploader, setShowUploader] = useState(true);

  const handleDataLoad = (data: FlowchartData[]) => {
    setFlowchartData(data);
    setShowUploader(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass-panel border-b p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">WS</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Webhook Sketch</h1>
              <p className="text-xs text-muted-foreground">Interactive JSON Flowchart Generator</p>
            </div>
          </div>
          
          {flowchartData.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowUploader(!showUploader)}
              className="flex items-center gap-2"
            >
              {showUploader ? (
                <>
                  <ChevronRight className="w-4 h-4" />
                  View Canvas
                </>
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  Edit Data
                </>
              )}
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex">
        {/* JSON Uploader Sidebar */}
        {showUploader && (
          <div className="w-96 border-r glass-panel p-4 overflow-y-auto">
            <JSONUploader onDataLoad={handleDataLoad} />
          </div>
        )}
        
        {/* Canvas Area */}
        <div className="flex-1 relative">
          {flowchartData.length === 0 ? (
            <div 
              className="h-full flex items-center justify-center relative"
              style={{
                backgroundImage: `url(${heroImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="glass-panel p-8 rounded-xl text-center max-w-md mx-4">
                <div className="text-6xl mb-4">🚀</div>
                <h2 className="text-2xl font-bold mb-2">Transform JSON into Visual Stories</h2>
                <p className="text-muted-foreground mb-4">
                  Upload your webhook JSON data and watch it come to life as an interactive flowchart
                </p>
                <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
                  <span className="bg-primary/10 px-2 py-1 rounded">Draggable Nodes</span>
                  <span className="bg-primary/10 px-2 py-1 rounded">Zoomable Canvas</span>
                  <span className="bg-primary/10 px-2 py-1 rounded">Dynamic Connections</span>
                </div>
              </div>
              <div className="absolute inset-0 bg-background/20 backdrop-blur-sm" />
            </div>
          ) : (
            <FlowchartCanvas data={flowchartData} />
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
