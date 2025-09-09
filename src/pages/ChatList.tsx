import { Sidebar } from '@/components/Sidebar'
import { getChats, togglePinChat } from '@/utils/storage'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export default function ChatList() {
  const [items, setItems] = useState(getChats())

  const doPin = (id: string) => {
    togglePinChat(id)
    setItems(getChats())
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-6 space-y-6">
        <h1 className="text-2xl text-white font-bold">Saved Chats</h1>
        <div className="space-y-2">
          {items.map(ch => (
            <div key={ch.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="text-white/90 truncate">{ch.prompt}</div>
              <div className="text-xs text-slate-400 mt-1 flex gap-3 items-center">
                <span>{new Date(ch.createdAt).toLocaleString()}</span>
                {ch.canvasId && <Link to={`/canvas/${ch.canvasId}`} className="hover:underline">Open canvas</Link>}
                <Button size="sm" variant="ghost" onClick={() => doPin(ch.id)}>{ch.pinned ? 'Unpin' : 'Pin'}</Button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-slate-400">No chats yet.</div>
          )}
        </div>
      </main>
    </div>
  )
}


