import { useMemo, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { getCanvases, searchCanvases, getCanvas } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { AuthModal } from '@/components/AuthModal'
import { Button } from '@/components/ui/button'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { toast } from 'sonner'
import type { Canvas } from '@/lib/supabase'

export default function Dashboard() {
  const [canvases, setCanvases] = useState<Canvas[]>([])
  const [loading, setLoading] = useState(true)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

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
      setCanvases(data.slice(0, 8)) // Show only recent 8
    } catch (error) {
      console.error('Failed to load canvases:', error)
      toast.error('Failed to load canvases')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (query: string) => {
    if (!isAuthenticated) return
    
    if (!query.trim()) {
      loadCanvases()
      return
    }

    try {
      const results = await searchCanvases(query)
      setCanvases(results.slice(0, 8))
    } catch (error) {
      console.error('Search failed:', error)
      toast.error('Search failed')
    }
  }

  const openCanvas = async (id: string) => {
    try {
      const canvas = await getCanvas(id)
      if (canvas) {
        // Navigate to the main canvas page with the loaded data
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

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl text-white font-bold">Dashboard</h1>
          <Link to="/new">
            <Button variant="default">New Mindmap</Button>
          </Link>
        </div>

        {isAuthenticated && (
          <div className="w-full">
            <input
              type="text"
              placeholder="Search canvases..."
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white/90 font-semibold">Recent Canvases</h2>
            {isAuthenticated && (
              <Link to="/canvases" className="text-sm text-slate-300 hover:text-white">View all</Link>
            )}
          </div>
          
          {!isAuthenticated ? (
            <div className="text-center py-12">
              <div className="text-slate-400 mb-4">Sign in to view and save your canvases</div>
              <Button onClick={() => setAuthModalOpen(true)}>Sign In</Button>
            </div>
          ) : loading ? (
            <div className="text-slate-400">Loading canvases...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {canvases.map(c => (
                <div key={c.id} onClick={() => openCanvas(c.id)} className="block group bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition cursor-pointer">
                  <div className="text-white font-medium truncate">{c.title}</div>
                  <div className="text-xs text-slate-400 mt-1">{new Date(c.updated_at).toLocaleString()}</div>
                  <div className="h-24 mt-3 rounded-md bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/5"></div>
                </div>
              ))}
              {canvases.length === 0 && (
                <div className="text-slate-400">No canvases yet. Create your first mindmap.</div>
              )}
            </div>
            )}
        </section>

      </main>
      
      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen}
        onSuccess={() => setAuthModalOpen(false)}
      />
    </div>
  )
}


