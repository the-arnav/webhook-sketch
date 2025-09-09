import { useEffect, useRef, useState } from 'react';
import { FlowchartCanvas } from '@/components/FlowchartCanvas';
import { JSONUploader } from '@/components/JSONUploader';
import { Button } from '@/components/ui/button';
import { Save, Share2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { generateId, saveCanvas, listCanvases } from '@/utils/storage';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface FlowchartData {
  itemNumber: number;
  title: string;
  description: string;
}

const Index = () => {
  const [flowchartData, setFlowchartData] = useState<FlowchartData[]>([]);
  const [subject, setSubject] = useState<string>('');
  // Removed left prompt assistant; uploader is available via bottom bar only
  const latestSnapshotRef = useRef<{ nodes: unknown[]; edges: unknown[] } | null>(null);
  // Removed loading delay and progress; render updates immediately
  const [navOpen, setNavOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  // Force full-site dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  // Loading/progress removed

  // Any time the canvas changes (nodes/edges snapshot or subject), mark as unsaved
  useEffect(() => {
    if (flowchartData.length) setIsSaved(false);
  }, [flowchartData, subject]);

  const handleDataLoad = (data: FlowchartData[], subjectText?: string) => {
    setFlowchartData(data);
    setSubject(subjectText || 'Main Topic');
  };

  const handleSave = () => {
    if (!flowchartData.length || !latestSnapshotRef.current) return;
    const id = generateId('canvas');
    const title = subject || 'Mindmap';
    saveCanvas({
      id,
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      data: {
        nodes: latestSnapshotRef.current.nodes,
        edges: latestSnapshotRef.current.edges,
        subject,
      },
    });
    setIsSaved(true);
  };

  const handleCopyJSON = async () => {
    if (!flowchartData.length) return;
    const payload = flowchartData;
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast.success('Copied!');
    } catch {
      // no-op
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: subject || 'MindMap Ai',
      text: 'Check out this canvas from MindMap Ai',
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
      }
    } catch {
      // user cancelled or unsupported
    }
  };

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
              <h1 className="text-xl font-bold">MindMap Ai</h1>
              <p className="text-xs text-muted-foreground">Interactive JSON Flowchart Generator</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Sheet open={navOpen} onOpenChange={setNavOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">Menu</Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 glass-panel">
                <SheetHeader>
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-2">
                  <Button variant="ghost" className="w-full justify-start" onClick={() => { setFlowchartData([]); setSubject(''); setNavOpen(false); }}>Home</Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => { window.location.reload(); }}>New Canvas</Button>
                  <div className="pt-2">
                    <div className="text-xs text-muted-foreground mb-1">Saved Canvases</div>
                    <div className="max-h-60 overflow-auto space-y-1">
                      {listCanvases().map(c => (
                        <button key={c.id} className="w-full text-left text-sm px-2 py-1 rounded hover:bg-accent">
                          {c.title}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4">
                    <div className="text-xs text-muted-foreground mb-1">Settings</div>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <button className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-left">Toggle Minimap</button>
                      <button className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-left">Toggle Edge Animation</button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            {flowchartData.length > 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFlowchartData([]);
                    setSubject('');
                  }}
                  className="flex items-center gap-2"
                >
                  Clear Canvas
                </Button>
                <Button onClick={handleSave} className="flex items-center gap-2" variant={isSaved ? 'secondary' : 'default'}>
                  <Save className="w-4 h-4" /> {isSaved ? 'Saved' : 'Save'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopyJSON}
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" /> Copy JSON
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" /> Share
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex">
        {/* Canvas Area - always mounted with animated background */}
        <div className="flex-1 relative">
          <div className="bg-animated" />
          <div className="h-full relative z-10">
            <FlowchartCanvas 
              data={flowchartData} 
              subject={subject}
              // @ts-ignore expose snapshot
              onSnapshot={(snap: { nodes: unknown[]; edges: unknown[] }) => { latestSnapshotRef.current = snap }}
            />
          </div>

          {/* Bottom-centered prompt bar overlay (always available) */}
          <div className="absolute inset-x-0 bottom-0 flex justify-center pb-8 z-20">
            <div className="w-full max-w-3xl px-4">
              <JSONUploader onDataLoad={handleDataLoad} />
            </div>
          </div>

        </div>
      </main>
      {/* Footer */}
      <footer className="glass-panel border-t p-4">
        <div className="max-w-7xl mx-auto text-xs text-muted-foreground flex items-center justify-between">
          <span>MindMap Ai</span>
          <span>Dark purple theme</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
