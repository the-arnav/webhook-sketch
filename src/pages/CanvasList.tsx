
import { Sidebar } from '@/components/Sidebar'
import { getCanvases, updateCanvas, deleteCanvas as deleteCanvasSupabase, togglePinCanvas, getCanvas } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { AuthModal } from '@/components/AuthModal'
import { useMemo, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Pin, PinOff, Trash2, Search, FileText, Edit } from 'lucide-react'
import type { Canvas } from '@/lib/supabase'

export default function CanvasList() {
  const [items, setItems] = useState<Canvas[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  
  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subject?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [items, searchQuery])

  const pinned = useMemo(() => filteredItems.filter(i => i.pinned), [filteredItems])
  const others = useMemo(() => filteredItems.filter(i => !i.pinned), [filteredItems])

  useEffect(() => {
    if (isAuthenticated) {
      loadCanvases()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated])

  const loadCanvases = async () => {
    try {
      const canvases = await getCanvases()
      setItems(canvases)
    } catch (error) {
      console.error('Failed to load canvases:', error)
      toast.error('Failed to load canvases')
    } finally {
      setLoading(false)
    }
  }

  const doRename = async (id: string, title: string) => {
    if (!title.trim()) return
    
    try {
      await updateCanvas(id, { title: title.trim() })
      await loadCanvases()
      setEditingId(null)
      toast.success('Canvas renamed successfully')
    } catch (error) {
      toast.error('Failed to rename canvas')
    }
  }

  const doDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this canvas?')) return
    
    try {
      await deleteCanvasSupabase(id)
      await loadCanvases()
      toast.success('Canvas deleted successfully')
    } catch (error) {
      toast.error('Failed to delete canvas')
    }
  }

  const doPin = async (id: string) => {
    try {
      await togglePinCanvas(id)
      await loadCanvases()
    } catch (error) {
      toast.error('Failed to update pin status')
    }
  }

  const openCanvas = async (id: string) => {
    try {
      const canvas = await getCanvas(id)
      if (canvas) {
        navigate('/new', { 
          state: { 
            canvasData: canvas.data,
            subject: canvas.subject || canvas.title,
            title: canvas.title,
            canvasId: canvas.id
          } 
        })
      }
    } catch (error) {
      toast.error('Failed to load canvas')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex bg-background">
        <Sidebar />
        <main className="flex-1 p-6 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h1 className="text-2xl font-bold mb-4">Sign in to view your canvases</h1>
              <p className="text-muted-foreground mb-6">Create an account to save and manage your mind maps</p>
              <Button onClick={() => setAuthModalOpen(true)} size="lg">Sign In</Button>
            </CardContent>
          </Card>
        </main>
        <AuthModal 
          open={authModalOpen} 
          onOpenChange={setAuthModalOpen}
          onSuccess={() => setAuthModalOpen(false)}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex bg-background">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Saved Canvases</h1>
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading canvases...</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  const Section = ({ title, list, icon: Icon }: { title: string; list: typeof items; icon: any }) => (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          {title} ({list.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {list.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No {title.toLowerCase()} canvases</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {list.map(c => (
              <Card key={c.id} className="group hover:shadow-lg transition-all border-border/50 hover:border-primary/50">
                <CardContent className="p-4">
                  {/* Canvas Preview */}
                  <div 
                    className="aspect-video bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 rounded-lg mb-3 flex items-center justify-center cursor-pointer relative overflow-hidden"
                    onClick={() => openCanvas(c.id)}
                  >
                    <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
                    <FileText className="w-8 h-8 text-primary/60 group-hover:scale-110 transition-transform relative z-10" />
                  </div>

                  {/* Title */}
                  <div className="mb-2">
                    {editingId === c.id ? (
                      <Input 
                        defaultValue={c.title} 
                        autoFocus
                        onBlur={(e) => doRename(c.id, e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && doRename(c.id, (e.target as HTMLInputElement).value)}
                        className="text-sm"
                      />
                    ) : (
                      <h3 
                        className="font-semibold truncate cursor-pointer hover:text-primary transition-colors"
                        onClick={() => setEditingId(c.id)}
                      >
                        {c.title}
                      </h3>
                    )}
                  </div>

                  {/* Subject */}
                  {c.subject && (
                    <p className="text-xs text-muted-foreground truncate mb-2">{c.subject}</p>
                  )}

                  {/* Date */}
                  <div className="text-xs text-muted-foreground mb-3">
                    {new Date(c.updated_at).toLocaleDateString()}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="default" 
                      onClick={() => openCanvas(c.id)}
                      className="flex-1"
                    >
                      Open
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setEditingId(c.id)}
                      className="px-2"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => doPin(c.id)}
                      className="px-2"
                    >
                      {c.pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => doDelete(c.id)}
                      className="px-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Saved Canvases</h1>
            
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search canvases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Sections */}
          {pinned.length > 0 && <Section title="Pinned" list={pinned} icon={Pin} />}
          <Section title="All Canvases" list={others} icon={FileText} />
        </div>
      </main>
    </div>
  )
}
