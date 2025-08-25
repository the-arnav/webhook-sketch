import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, ArrowRight } from 'lucide-react';

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
    <div className="max-w-2xl w-full mx-auto fade-in">
      <div className="glass-panel rounded-xl p-6 shadow-lg scale-in">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-md mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight mb-2 premium-text">Generate Your Flowchart</h2>
          <p className="text-muted-foreground">
            Enter a topic or question to visualize as an interactive flowchart
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What would you like to visualize?"
              className="min-h-[120px] bg-background/50 border-primary/20 focus:border-primary/50 rounded-lg text-base"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-400 hover:from-purple-700 hover:to-purple-500 text-white rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg"
            disabled={!prompt.trim()}
          >
            <span className="mr-2">Generate Flowchart</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
        
        <div className="mt-6">
          <p className="text-sm text-muted-foreground mb-2">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((example, index) => (
              <button
                key={index}
                className="text-xs px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
                onClick={() => handleExampleClick(example)}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}