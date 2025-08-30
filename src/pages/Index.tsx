import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FlowchartCanvas } from '@/components/FlowchartCanvas';
import { JSONUploader } from '@/components/JSONUploader';
import { AuthModal } from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import { Save, Share2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { saveCanvas as saveCanvasSupabase, updateCanvas } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import type { Node, Edge } from '@xyflow/react';

interface FlowchartData {
  itemNumber: number;
  title: string;
  description: string;
}

const Index = () => {
  const [flowchartData, setFlowchartData] = useState<FlowchartData[]>([]);
  const [subject, setSubject] = useState<string>('');
  const [currentCanvasId, setCurrentCanvasId] = useState<string | null>(null);
  // Removed left prompt assistant; uploader is available via bottom bar only
  const latestSnapshotRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null);
  // Removed loading delay and progress; render updates immediately
  const [navOpen, setNavOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // Force full-site dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  // Load canvas data from navigation state (when opening saved canvas)
  useEffect(() => {
    if (location.state) {
      const { canvasData, subject: loadedSubject, title, canvasId } = location.state as any;
      if (canvasData && canvasData.nodes && canvasData.edges) {
        // Convert the saved canvas data back to flowchart format
        const convertedData = canvasData.nodes
          .filter((node: Node) => node.type === 'title' || node.type === 'description')
          .map((node: Node, index: number) => ({
            itemNumber: node.data.itemNumber || index + 1,
            title: node.data.title || `Item ${index + 1}`,
            description: node.data.description || node.data.title || 'No description'
          }));
        
        setFlowchartData(convertedData);
        setSubject(loadedSubject || title || 'Loaded Canvas');
        setCurrentCanvasId(canvasId || null);
        setIsSaved(true); // Mark as saved since we just loaded it
        
        // Set the snapshot to the loaded data
        latestSnapshotRef.current = {
          nodes: canvasData.nodes,
          edges: canvasData.edges
        };
      }
    }
  }, [location.state]);

  // Loading/progress removed

  // Any time the canvas changes (nodes/edges snapshot or subject), mark as unsaved
  useEffect(() => {
    if (flowchartData.length && !location.state) setIsSaved(false);
  }, [flowchartData, subject, location.state]);

  const handleDataLoad = (data: FlowchartData[], subjectText?: string) => {
    setFlowchartData(data);
    setSubject(subjectText || 'Main Topic');
    setCurrentCanvasId(null); // Reset canvas ID when loading new data
    setIsSaved(false);
  };

  const handleSave = () => {
    if (!flowchartData.length || !latestSnapshotRef.current) {
      toast.error('No canvas data to save');
      return;
    }

    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    handleSaveToSupabase();
  };

  const handleSaveToSupabase = async () => {
    if (!flowchartData.length || !latestSnapshotRef.current) return;
    
    setSaving(true);
    const title = subject || 'Untitled Mindmap';
    
    try {
      if (currentCanvasId) {
        // Update existing canvas
        const updatedCanvas = await updateCanvas(currentCanvasId, {
          title,
          subject,
          data: {
            nodes: latestSnapshotRef.current.nodes,
            edges: latestSnapshotRef.current.edges,
          },
        });
        
        if (updatedCanvas) {
          setIsSaved(true);
          toast.success(`Canvas "${title}" updated successfully!`);
        } else {
          throw new Error('Failed to update canvas');
        }
      } else {
        // Create new canvas
        const savedCanvas = await saveCanvasSupabase({
          title,
          subject,
          data: {
            nodes: latestSnapshotRef.current.nodes,
            edges: latestSnapshotRef.current.edges,
          },
        });

        if (savedCanvas) {
          setCurrentCanvasId(savedCanvas.id);
          setIsSaved(true);
          toast.success(`Canvas "${title}" saved successfully!`);
        } else {
          throw new Error('Failed to save canvas');
        }
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save canvas. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAuthSuccess = () => {
    setAuthModalOpen(false);
    // Auto-save after successful authentication
    setTimeout(() => {
      handleSaveToSupabase();
    }, 500);
  };

  const handleSnapshot = (snapshot: { nodes: Node[]; edges: Edge[] }) => {
    latestSnapshotRef.current = snapshot;
    // Mark as unsaved when canvas changes
    if (flowchartData.length > 0 && !location.state) {
      setIsSaved(false);
    }
  };

  // Legacy save function for backward compatibility (now saves to Supabase)
  const handleLegacySave = () => {
    if (!flowchartData.length || !latestSnapshotRef.current) return;
    
    // Use localStorage as fallback for unauthenticated users
    const canvases = JSON.parse(localStorage.getItem('savedCanvases') || '[]');
    const newCanvas = {
      id: `canvas_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`,
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      data: {
        nodes: latestSnapshotRef.current.nodes,
        edges: latestSnapshotRef.current.edges,
        subject,
      },
    };
    
    canvases.unshift(newCanvas);
    localStorage.setItem('savedCanvases', JSON.stringify(canvases));
    setIsSaved(true);
    toast.success('Canvas saved locally');
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
                    setCurrentCanvasId(null);
                    setIsSaved(false);
                  }}
                  className="flex items-center gap-2"
                >
                  Clear Canvas
                </Button>
                <Button onClick={handleSave} className="flex items-center gap-2" variant={isSaved ? 'secondary' : 'default'}>
                  <Save className="w-4 h-4" /> 
                  {saving ? 'Saving...' : (isSaved ? (currentCanvasId ? 'Saved' : 'Saved') : (currentCanvasId ? 'Update' : 'Save'))}
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
              onSnapshot={handleSnapshot}
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
      
      {/* Authentication Modal */}
      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen}
        onSuccess={handleAuthSuccess}
      />
      
      {/* Footer */}
      <footer className="glass-panel border-t p-4">
        <div className="max-w-7xl mx-auto text-xs text-muted-foreground flex items-center justify-between">
          <span>MindMap Ai</span>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <span className="text-green-400">● Signed in as {user?.email}</span>
            ) : (
              <button 
                onClick={() => setAuthModalOpen(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign in to save canvases
              </button>
            )}
            <span>Dark purple theme</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;