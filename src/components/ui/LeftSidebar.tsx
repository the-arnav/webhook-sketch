import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark, Clock, ChevronLeft, ChevronRight, Star, StarOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SavedMap {
  id: string;
  title: string;
  date: string;
  isFavorite: boolean;
}

interface RecentPrompt {
  id: string;
  text: string;
  date: string;
}

interface LeftSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onSelectPrompt: (prompt: string) => void;
  onSelectMap: (mapId: string) => void;
}

export function LeftSidebar({ isOpen, onToggle, onSelectPrompt, onSelectMap }: LeftSidebarProps) {
  const [activeTab, setActiveTab] = useState<'recent' | 'saved'>('recent');
  
  // Mock data - in a real app, this would come from props or context
  const recentPrompts: RecentPrompt[] = [
    { id: '1', text: 'Explain how machines work', date: '2 mins ago' },
    { id: '2', text: 'What are the components of a computer?', date: '15 mins ago' },
    { id: '3', text: 'How do simple machines function?', date: '1 hour ago' },
    { id: '4', text: 'Describe complex machinery systems', date: '3 hours ago' },
    { id: '5', text: 'What are industrial machines?', date: 'Yesterday' },
  ];
  
  const savedMaps: SavedMap[] = [
    { id: '1', title: 'Machine Components', date: '2 days ago', isFavorite: true },
    { id: '2', title: 'Computer Architecture', date: '1 week ago', isFavorite: false },
    { id: '3', title: 'Industrial Machinery', date: '2 weeks ago', isFavorite: true },
  ];

  return (
    <div className={cn(
      'sidebar sidebar-left transition-all duration-300 ease-in-out',
      isOpen ? 'translate-x-0' : '-translate-x-full'
    )}>
      <div className="h-full w-64 glass-panel border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border/20 flex items-center justify-between">
          <h2 className="text-lg font-semibold premium-text">Workspace</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full hover:bg-primary/10"
            onClick={onToggle}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-border/20">
          <button
            className={cn(
              'flex-1 py-2 text-sm font-medium transition-colors relative',
              activeTab === 'recent' 
                ? 'text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setActiveTab('recent')}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-4 w-4" />
              Recent
            </div>
            {activeTab === 'recent' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-purple-300" />
            )}
          </button>
          <button
            className={cn(
              'flex-1 py-2 text-sm font-medium transition-colors relative',
              activeTab === 'saved' 
                ? 'text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setActiveTab('saved')}
          >
            <div className="flex items-center justify-center gap-2">
              <Bookmark className="h-4 w-4" />
              Saved
            </div>
            {activeTab === 'saved' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-purple-300" />
            )}
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2">
          {activeTab === 'recent' ? (
            <div className="space-y-1">
              {recentPrompts.map((prompt) => (
                <button
                  key={prompt.id}
                  className="w-full text-left p-2 rounded-lg hover:bg-primary/10 transition-colors group"
                  onClick={() => onSelectPrompt(prompt.text)}
                >
                  <p className="text-sm font-medium truncate">{prompt.text}</p>
                  <p className="text-xs text-muted-foreground">{prompt.date}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {savedMaps.map((map) => (
                <button
                  key={map.id}
                  className="w-full text-left p-2 rounded-lg hover:bg-primary/10 transition-colors group flex items-start justify-between"
                  onClick={() => onSelectMap(map.id)}
                >
                  <div>
                    <p className="text-sm font-medium truncate">{map.title}</p>
                    <p className="text-xs text-muted-foreground">{map.date}</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    {map.isFavorite ? (
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    ) : (
                      <StarOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Toggle button when sidebar is closed */}
      {!isOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20 z-10"
          onClick={onToggle}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}