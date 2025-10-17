
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, PanelsTopLeft, Plus, Settings } from 'lucide-react';

export const TopNavigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/new', label: 'New Canvas', icon: Plus },
    { path: '/canvases', label: 'Saved Canvases', icon: PanelsTopLeft },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="flex items-center gap-3 bg-card/50 backdrop-blur-xl border border-border rounded-full px-2 py-1.5">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.path} to={item.path}>
            <Button
              variant={isActive(item.path) ? 'default' : 'ghost'}
              size="sm"
              className="flex items-center gap-2 rounded-full transition-all hover:scale-105"
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </Button>
          </Link>
        );
      })}
    </nav>
  );
};
