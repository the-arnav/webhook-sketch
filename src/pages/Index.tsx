
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FlowchartCanvas } from '@/components/FlowchartCanvas';
import { JSONUploader } from '@/components/JSONUploader';
import { AuthModal } from '@/components/AuthModal';
import { TopNavigation } from '@/components/TopNavigation';
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
  const latestSnapshotRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null);
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
        console.log('Loading canvas data from state:', canvasData);
        
        // Keep subject and meta, but DO NOT rebuild positions; pass snapshot directly
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
        setIsSaved(true);
        
        // Store the complete canvas data with all positions and content
        latestSnapshotRef.current = {
          nodes: canvasData.nodes,
          edges: canvasData.edges
        };
        
        console.log('Canvas snapshot loaded with exact positions');
      }
    }
  }, [location.state]);

  useEffect(() => {
    if (flowchartData.length && !location.state) setIsSaved(false);
  }, [flowchartData, subject, location.state]);

  const handleDataLoad = (data: FlowchartData[], subjectText?: string) => {
    console.log('Loading new data:', data);
    setFlowchartData(data);
    setSubject(subjectText || 'Main Topic');
    setCurrentCanvasId(null);
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
    const canvasTitle = subject || 'Untitled Mindmap';
    
    console.log('Saving canvas with data:', {
      title: canvasTitle,
      subject,
      nodes: latestSnapshotRef.current.nodes.length,
      edges: latestSnapshotRef.current.edges.length
    });
    
    try {
      const canvasData = {
        title: canvasTitle,
        subject,
        data: {
          nodes: latestSnapshotRef.current.nodes.map(node => ({
            ...node,
            // Ensure all node properties are saved including positions and data
            position: node.position,
            data: {
              ...node.data,
              // Explicitly preserve all content fields
              ...(node.data.subject && { subject: node.data.subject }),
              ...(node.data.title && { title: node.data.title }),
              ...(node.data.description && { description: node.data.description }),
              ...(node.data.itemNumber && { itemNumber: node.data.itemNumber }),
            }
          })),
          edges: latestSnapshotRef.current.edges.map(edge => ({
            ...edge,
            // Ensure all edge properties are preserved
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
            style: edge.style,
            animated: edge.animated,
            type: edge.type,
            markerEnd: edge.markerEnd
          }))
        },
      };

      if (currentCanvasId) {
        const updatedCanvas = await updateCanvas(currentCanvasId, canvasData);
        
        if (updatedCanvas) {
          setIsSaved(true);
          toast.success(`Canvas "${canvasTitle}" updated successfully!`);
          console.log('Canvas updated successfully:', updatedCanvas);
        } else {
          throw new Error('Failed to update canvas');
        }
      } else {
        const savedCanvas = await saveCanvasSupabase(canvasData);

        if (savedCanvas) {
          setCurrentCanvasId(savedCanvas.id);
          setIsSaved(true);
          toast.success(`Canvas "${canvasTitle}" saved successfully!`);
          console.log('Canvas saved successfully:', savedCanvas);
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
    setTimeout(() => {
      handleSaveToSupabase();
    }, 500);
  };

  const handleSnapshot = (snapshot: { nodes: Node[]; edges: Edge[] }) => {
    console.log('Received snapshot with', snapshot.nodes.length, 'nodes and', snapshot.edges.length, 'edges');
    latestSnapshotRef.current = snapshot;
    if (flowchartData.length > 0 && !location.state) {
      setIsSaved(false);
    }
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
          <div className="flex items-center gap-4">
            <TopNavigation />
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
                    {saving ? 'Saving...' : (isSaved ? 'Saved' : (currentCanvasId ? 'Update' : 'Save'))}
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
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex">
        <div className="flex-1 relative">
          <div className="bg-animated" />
          <div className="h-full relative z-10">
            <FlowchartCanvas 
              data={flowchartData} 
              subject={subject}
              onSnapshot={handleSnapshot}
              initialSnapshot={latestSnapshotRef.current}
            />
          </div>

          <div className="absolute inset-x-0 bottom-0 flex justify-center pb-8 z-20">
            <div className="w-full max-w-3xl px-4">
              <JSONUploader onDataLoad={handleDataLoad} />
            </div>
          </div>
        </div>
      </main>
      
      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen}
        onSuccess={handleAuthSuccess}
      />
      
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
