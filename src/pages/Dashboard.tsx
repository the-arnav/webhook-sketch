import { useMemo, useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { SearchBar } from '@/components/SearchBar'
import { getCanvases, getChats, SavedCanvas, SavedChat } from '@/utils/storage'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const [results, setResults] = useState<{ canvases: SavedCanvas[]; chats: SavedChat[] }>()
  const canvases = useMemo(() => results?.canvases ?? getCanvases().slice(0, 8), [results])
  const chats = useMemo(() => results?.chats ?? getChats().slice(0, 8), [results])

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

        <SearchBar onResults={setResults} />

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white/90 font-semibold">Recent Canvases</h2>
            <Link to="/canvases" className="text-sm text-slate-300 hover:text-white">View all</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {canvases.map(c => (
              <Link key={c.id} to={`/canvas/${c.id}`} className="block group bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition">
                <div className="text-white font-medium truncate">{c.title}</div>
                <div className="text-xs text-slate-400 mt-1">{new Date(c.updatedAt).toLocaleString()}</div>
                <div className="h-24 mt-3 rounded-md bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/5"></div>
              </Link>
            ))}
            {canvases.length === 0 && (
              <div className="text-slate-400">No canvases yet. Create your first mindmap.</div>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white/90 font-semibold">Recent Chats</h2>
            <Link to="/chats" className="text-sm text-slate-300 hover:text-white">View all</Link>
          </div>
          <div className="space-y-2">
            {chats.map(ch => (
              <div key={ch.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                <div className="text-white/90 truncate">{ch.prompt}</div>
                <div className="text-xs text-slate-400 mt-1 flex gap-3">
                  <span>{new Date(ch.createdAt).toLocaleString()}</span>
                  {ch.canvasId && <Link to={`/canvas/${ch.canvasId}`} className="hover:underline">Open canvas</Link>}
                </div>
              </div>
            ))}
            {chats.length === 0 && (
              <div className="text-slate-400">No chats yet. Elaborate a node to start capturing history.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}


