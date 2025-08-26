import { Sidebar } from '@/components/Sidebar'
import { getCanvases, renameCanvas, deleteCanvas, togglePinCanvas } from '@/utils/storage'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Link } from 'react-router-dom'

export default function CanvasList() {
  const [items, setItems] = useState(getCanvases())
  const pinned = useMemo(() => items.filter(i => i.pinned), [items])
  const others = useMemo(() => items.filter(i => !i.pinned), [items])

  const doRename = (id: string, title: string) => {
    renameCanvas(id, title)
    setItems(getCanvases())
  }

  const doDelete = (id: string) => {
    deleteCanvas(id)
    setItems(getCanvases())
  }

  const doPin = (id: string) => {
    togglePinCanvas(id)
    setItems(getCanvases())
  }

  const Section = ({ title, list }: { title: string; list: typeof items }) => (
    <section className="space-y-3">
      <h2 className="text-white/90 font-semibold">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {list.map(c => (
          <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <Input defaultValue={c.title} onBlur={(e) => doRename(c.id, e.target.value)} className="bg-transparent text-white border-white/10" />
            <div className="text-xs text-slate-400 mt-1">{new Date(c.updatedAt).toLocaleString()}</div>
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


