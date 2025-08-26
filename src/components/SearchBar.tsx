import { useState } from 'react'
import { searchAll } from '@/utils/storage'
import { Input } from '@/components/ui/input'

interface Props {
  onResults?: (results: ReturnType<typeof searchAll>) => void
}

export const SearchBar = ({ onResults }: Props) => {
  const [q, setQ] = useState('')
  return (
    <div className="w-full">
      <Input
        value={q}
        onChange={(e) => {
          const v = e.target.value
          setQ(v)
          onResults?.(searchAll(v))
        }}
        placeholder="Search canvases, chats, tags..."
        className="bg-white/5 border-white/10 text-white placeholder:text-slate-400"
      />
    </div>
  )
}


