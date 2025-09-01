
import { useMemo, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { TopNavigation } from '@/components/TopNavigation'
import { getCanvases, searchCanvases, getCanvas } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { AuthModal } from '@/components/AuthModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { Search, Plus, FileText, Clock, Sparkles } from 'lucide-react'
import type { Canvas } from '@/lib/supabase'

export default function Dashboard() {
  const [canvases, setCanvases] = useState<Canvas[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  const filteredCanvases = useMemo(() => {
    return canvases.filter(canvas => 
      canvas.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      canvas.subject?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [canvases, searchQuery])

  const recentCanvases = useMemo(() => filteredCanvases.slice(0, 6), [filteredCanvases])
  const pinnedCanvases = useMemo(() => canvases.filter(c => c.pinned), [canvases])

  useEffect(() => {
    if (isAuthenticated) {
      loadCanvases()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated])

  const loadCanvases = async () => {
    try {
      const data = await getCanvases()
      setCanvases(data)
    } catch (error) {
      console.error('Failed to load canvases:', error)
      toast.error('Failed to load canvases')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
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

  const QuickActions = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:border-primary/40 transition-all cursor-pointer group">
        <CardContent className="p-6 text-center">
          <Link to="/new" className="block">
            <Plus className="w-12 h-12 mx-auto mb-4 text-primary group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold mb-2">Create New Mindmap</h3>
            <p className="text-sm text-muted-foreground">Start with a blank canvas or use AI to generate ideas</p>
          </Link>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:border-blue-500/40 transition-all cursor-pointer group">
        <CardContent className="p-6 text-center">
          <Link to="/canvases" className="block">
            <FileText className="w-12 h-12 mx-auto mb-4 text-blue-500 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold mb-2">View All Canvases</h3>
            <p className="text-sm text-muted-foreground">Browse and manage your saved mindmaps</p>
          </Link>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 hover:border-green-500/40 transition-all">
        <CardContent className="p-6 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-green-500" />
          <h3 className="font-semibold mb-2">AI Templates</h3>
          <p className="text-sm text-muted-foreground">Coming soon - Pre-built templates for common use cases</p>
        </CardContent>
      </Card>
    </div>
  )

  const CanvasGrid = ({ canvases: canvasesToShow, title }: { canvases: Canvas[], title: string }) => (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {canvasesToShow.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No canvases yet. Create your first mindmap to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {canvasesToShow.map(canvas => (
              <Card 
                key={canvas.id} 
                className="cursor-pointer hover:shadow-lg transition-all group border-border/50 hover:border-primary/50"
                onClick={() => openCanvas(canvas.id)}
              >
                <CardContent className="p-4">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg mb-3 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-primary/60 group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="font-semibold truncate mb-1">{canvas.title}</h3>
                  {canvas.subject && (
                    <p className="text-sm text-muted-foreground truncate mb-2">{canvas.subject}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(canvas.updated_at).toLocaleDateString()}</span>
                    {canvas.pinned && (
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded">Pinned</span>
                    )}
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
      <main className="flex-1 p-6 max-w-7xl mx-auto">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back{isAuthenticated && user ? `, ${user.email?.split('@')[0]}` : ''}!
            </h1>
            <p className="text-muted-foreground">
              Create, organize, and explore your mind maps with AI assistance
            </p>
          </div>
          <TopNavigation />
        </div>

        {!isAuthenticated ? (
          <Card className="text-center py-12">
            <CardContent>
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-4">Sign in to get started</h2>
              <p className="text-muted-foreground mb-6">
                Create an account to save your mind maps and access them from anywhere
              </p>
              <Button onClick={() => setAuthModalOpen(true)} size="lg">
                Sign In / Sign Up
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div>
            {/* Quick Actions */}
            <QuickActions />

            {/* Search */}
            <div className="mb-8">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search your canvases..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Loading */}
            {loading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading your canvases...</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Pinned Canvases */}
                {pinnedCanvases.length > 0 && (
                  <CanvasGrid canvases={pinnedCanvases} title="Pinned Canvases" />
                )}

                {/* Recent Canvases */}
                <CanvasGrid 
                  canvases={recentCanvases} 
                  title={searchQuery ? `Search Results (${filteredCanvases.length})` : "Recent Canvases"} 
                />

                {/* View All Link */}
                {!searchQuery && canvases.length > 6 && (
                  <div className="text-center">
                    <Link to="/canvases">
                      <Button variant="outline">
                        View All Canvases ({canvases.length})
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
      
      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen}
        onSuccess={() => setAuthModalOpen(false)}
      />
    </div>
  )
}
