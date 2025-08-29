import { Sidebar } from '@/components/Sidebar'
import { getCanvases, updateCanvas, deleteCanvas as deleteCanvasSupabase, togglePinCanvas } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { AuthModal } from '@/components/AuthModal'
import { useMemo, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import type { Canvas } from '@/lib/supabase'

export default function CanvasList() {
  const [items, setItems] = useState<Canvas[]>([])
  const [loading, setLoading] = useState(true)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const { isAuthenticated } = useAuth()
  
  const pinned = useMemo(() => items.filter(i => i.pinned), [items])
  const others = useMemo(() => items.filter(i => !i.pinned), [items])

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex bg-slate-950">
        <Sidebar />
        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl text-white font-bold">Sign in to view your saved canvases</h1>
            <p className="text-slate-400">Create an account to save and manage your mind maps</p>
            <Button onClick={() => setAuthModalOpen(true)}>Sign In</Button>
          </div>
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
      <div className="min-h-screen flex bg-slate-950">
        <Sidebar />
        <main className="flex-1 p-6">
          <h1 className="text-2xl text-white font-bold mb-6">Saved Canvases</h1>
          <div className="text-slate-400">Loading canvases...</div>
        </main>
      </div>
    )
  }

  const Section = ({ title, list }: { title: string; list: typeof items }) => (
    <section className="space-y-3">
      <h2 className="text-white/90 font-semibold">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {list.map(c => (
          <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <Input defaultValue={c.title} onBlur={(e) => doRename(c.id, e.target.value)} className="bg-transparent text-white border-white/10" />
            <div className="text-xs text-slate-400 mt-1">{new Date(c.updated_at).toLocaleString()}</div>
            <div className="h-20 mt-3 rounded-md bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/5"></div>
            <div className="flex gap-2 mt-3">
              <Link to={`/canvas/${c.id}`}>
                <Button size="sm" variant="secondary">Open</Button>
              </Link>
              <Button size="sm" variant="ghost" onClick={() => doPin(c.id)}>{c.pinned ? 'Unpin' : 'Pin'}</Button>
              <Button size="sm" variant="destructive" onClick={() => doDelete(c.id)}>Delete</Button>
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="text-slate-400">No items</div>}
      </div>
    </section>
  )

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-6 space-y-8">
        <h1 className="text-2xl text-white font-bold">Saved Canvases</h1>
        <Section title="Pinned" list={pinned} />
        <Section title="All" list={others} />
      </main>
    </div>
  )
}


