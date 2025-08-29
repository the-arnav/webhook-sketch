import { NavLink } from 'react-router-dom'
import { LayoutGrid, PanelsTopLeft, Settings, Folder } from 'lucide-react'

export const Sidebar = () => {
  const linkBase = 'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors'
  const active = 'bg-white/10 text-white'
  const inactive = 'text-slate-300 hover:bg-white/5 hover:text-white'

  return (
    <aside className="w-60 shrink-0 border-r border-white/10 bg-slate-900/60 backdrop-blur">
      <div className="p-4 text-white font-semibold tracking-wide">Workspace</div>
      <nav className="px-2 py-2 space-y-1">
        <NavLink to="/" end className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}>
          <LayoutGrid className="w-4 h-4" />
          Dashboard
        </NavLink>
        <NavLink to="/canvases" className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}>
          <PanelsTopLeft className="w-4 h-4" />
          Saved Canvases
        </NavLink>
        <NavLink to="/folders" className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}>
          <Folder className="w-4 h-4" />
          Tags / Folders
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `${linkBase} ${isActive ? active : inactive}`}>
          <Settings className="w-4 h-4" />
          Settings
        </NavLink>
      </nav>
    </aside>
  )
}


