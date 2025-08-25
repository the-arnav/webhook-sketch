import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

interface PromptCardProps {
  onSubmit: (prompt: string) => void;
}

export function PromptCard({ onSubmit }: PromptCardProps) {
  const [prompt, setPrompt] = useState('');
  
  const examplePrompts = [
    'Explain how black holes work',
    'What was World War 2?',
    'How do computers process information?',
    'Describe the water cycle'
  ];
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSubmit(prompt.trim());
    }
  };
  
  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  return (
    <div className="w-full max-w-3xl mx-auto fade-in">
      <div className="glass-panel rounded-xl p-3 shadow-lg">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a topic or question to visualize as a flowchart..."
              className="min-h-[60px] max-h-[120px] bg-background/50 border-primary/20 focus:border-primary/50 rounded-lg text-base resize-none"
            />
          </div>
          
          <Button type="submit" className="gradient-button h-10 px-4" disabled={!prompt.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
        
        <div className="flex flex-wrap gap-1.5 mt-2 px-1">
          <p className="text-xs text-muted-foreground mr-1">Try:</p>
          {examplePrompts.map((example, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleExampleClick(example)}
              className="text-xs px-2 py-1 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}