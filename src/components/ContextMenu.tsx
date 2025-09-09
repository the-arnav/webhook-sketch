import React from 'react';
import { Trash2 } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  onDelete: () => void;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onDelete, onClose }) => {
  React.useEffect(() => {
    const handleClickOutside = () => onClose();
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      className="fixed z-50 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg py-1 min-w-[120px]"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onDelete}
        className="w-full px-3 py-2 text-left text-sm hover:bg-accent/10 flex items-center gap-2 text-destructive hover:text-destructive"
      >
        <Trash2 className="w-4 h-4" />
        Delete Node
      </button>
    </div>
  );
};