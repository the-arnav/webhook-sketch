import { FlowchartCanvas } from '@/components/FlowchartCanvas';
import { PromptInput } from '@/components/PromptInput';
import { Button } from '@/components/ui/button';
import { useMindMapStore } from '@/stores/mindMapStore';
import heroImage from '@/assets/hero-bg.jpg';

const Index = () => {
  const { nodes, subject, clearAll } = useMindMapStore();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass-panel border-b p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">MM</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Mind Mapper</h1>
              <p className="text-xs text-muted-foreground">AI-Powered Interactive Mind Maps</p>
            </div>
          </div>
          
          {nodes.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={clearAll}
                className="flex items-center gap-2"
              >
                Clear Mind Map
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative">
        {nodes.length === 0 ? (
          <div 
            className="h-full flex items-center justify-center relative"
            style={{
              backgroundImage: `url(${heroImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" />
            <div className="relative z-10 w-full max-w-4xl mx-auto px-4">
              <PromptInput />
            </div>
          </div>
        ) : (
          <FlowchartCanvas />
        )}
      </main>
    </div>
  );
};

export default Index;
