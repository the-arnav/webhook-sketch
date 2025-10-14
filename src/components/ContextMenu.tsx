import React, { useState } from 'react';
import { Edit3, Trash2, Copy, Move, Lock, Unlock, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Node } from '@xyflow/react';

interface ContextMenuProps {
  x: number;
  y: number;
  nodeId: string;
  nodes: Node[];
  onClose: () => void;
  onDelete: () => void;
  onEdit: (nodeId: string, field: 'title' | 'description' | 'subject', currentValue: string) => void;
  onDuplicate: () => void;
  onMove: () => void;
  onToggleLock: () => void;
  onChangeColor: (nodeId: string, color: string) => void;
  isLocked?: boolean;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  nodeId,
  nodes,
  onClose,
  onDelete,
  onEdit,
  onDuplicate,
  onMove,
  onToggleLock,
  onChangeColor,
  isLocked = false
}) => {
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const node = nodes.find(n => n.id === nodeId);
  
  const colors = [
    { name: 'Purple', value: 'hsl(280 70% 60%)' },
    { name: 'Blue', value: 'hsl(220 70% 60%)' },
    { name: 'Green', value: 'hsl(140 60% 50%)' },
    { name: 'Orange', value: 'hsl(30 80% 60%)' },
    { name: 'Pink', value: 'hsl(320 70% 60%)' },
    { name: 'Cyan', value: 'hsl(180 60% 50%)' },
  ];

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

  const handleEditClick = () => {
    if (!node) return;
    const field = node.type === 'subject' ? 'subject' : node.type === 'title' ? 'title' : 'description';
    const currentValue = (node.data[field] as string) || '';
    onEdit(nodeId, field, currentValue);
  };

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
          onClick={handleEditClick}
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
        
        <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-3 h-9 px-3 hover:bg-accent/50"
              onClick={(e) => {
                e.stopPropagation();
                setColorPickerOpen(true);
              }}
            >
              <Palette className="w-4 h-4" />
              Change Color
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-48 p-2" 
            side="right" 
            align="start"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-3 gap-2">
              {colors.map((color) => (
                <button
                  key={color.name}
                  className="w-full aspect-square rounded-md border-2 border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color.value }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChangeColor(nodeId, color.value);
                    setColorPickerOpen(false);
                  }}
                  title={color.name}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
        
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