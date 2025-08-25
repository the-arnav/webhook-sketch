import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopNavbarProps {
  onClearCanvas: () => void;
  showUploader?: boolean;
  setShowUploader?: (show: boolean) => void;
  hasData?: boolean;
  onToggleSidebar?: () => void;
}

export function TopNavbar({ onClearCanvas, showUploader, setShowUploader, hasData, onToggleSidebar }: TopNavbarProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    document.documentElement.classList.toggle('light', newTheme === 'light');
    localStorage.setItem('theme', newTheme);
  };
  
  // Initialize theme from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
    document.documentElement.classList.toggle('light', initialTheme === 'light');
  }, []);

  return (
    <div className="navbar glass-panel fade-in">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Logo and App Name */}
        <div className="flex items-center space-x-3">
          {onToggleSidebar && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-primary/10"
              onClick={onToggleSidebar}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </Button>
          )}
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center text-white font-bold">
            WS
          </div>
          <div>
            <h1 className="text-lg font-semibold premium-text">Webhook Sketch</h1>
            <p className="text-xs text-muted-foreground">Professional JSON Visualization Studio</p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center space-x-2">
          {hasData && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full px-4 text-sm font-medium hover:bg-destructive/10 hover:text-destructive"
                onClick={onClearCanvas}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Canvas
              </Button>
              
              {setShowUploader && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full px-4 text-sm font-medium border-primary/20 hover:border-primary/40"
                  onClick={() => setShowUploader(!showUploader)}
                >
                  {showUploader ? 'View Canvas' : 'Edit Data'}
                </Button>
              )}
            </>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}