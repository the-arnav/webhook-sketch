import React from 'react';
import { Edit3, Trash2, Copy, Move, Lock, Unlock, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onMove: () => void;
  onToggleLock: () => void;
  onChangeColor: () => void;
  isLocked?: boolean;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onClose,
  onDelete,
  onEdit,
  onDuplicate,
  onMove,
  onToggleLock,
  onChangeColor,
  isLocked = false
}) => {
  React.useEffect(() => {
    const handleClickOutside = () => onClose();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Delete') onDelete();
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, onDelete]);

  return (
    <div
      className="fixed z-50 bg-card border border-border rounded-lg shadow-lg py-2 min-w-[180px] glass-panel animate-scale-in"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="space-y-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 h-9 px-3 hover:bg-accent/50"
          onClick={onEdit}
        >
          <Edit3 className="w-4 h-4" />
          Edit Content
          <span className="ml-auto text-xs text-muted-foreground">E</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 h-9 px-3 hover:bg-accent/50"
          onClick={onDuplicate}
        >
          <Copy className="w-4 h-4" />
          Duplicate
          <span className="ml-auto text-xs text-muted-foreground">Ctrl+D</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 h-9 px-3 hover:bg-accent/50"
          onClick={onMove}
        >
          <Move className="w-4 h-4" />
          Move to Position
          <span className="ml-auto text-xs text-muted-foreground">M</span>
        </Button>
        
        <Separator className="my-1" />
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 h-9 px-3 hover:bg-accent/50"
          onClick={onChangeColor}
        >
          <Palette className="w-4 h-4" />
          Change Color
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 h-9 px-3 hover:bg-accent/50"
          onClick={onToggleLock}
        >
          {isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          {isLocked ? 'Unlock Node' : 'Lock Node'}
          <span className="ml-auto text-xs text-muted-foreground">L</span>
        </Button>
        
        <Separator className="my-1" />
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 h-9 px-3 hover:bg-destructive/20 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4" />
          Delete Node
          <span className="ml-auto text-xs text-muted-foreground">Del</span>
        </Button>
      </div>
    </div>
  );
};