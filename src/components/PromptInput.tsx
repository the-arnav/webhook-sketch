import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Send, Brain, Loader2, Lightbulb } from 'lucide-react';
import { useMindMapStore } from '@/stores/mindMapStore';

const WEBHOOK_URL = 'https://officially-probable-hamster.ngrok-free.app/webhook/b919abb2-222c-4793-958f-83fa6b3e729c';

// Smart JSON parser that can extract items and subject from various structures
const extractDataFromJSON = (obj: any): { items: any[], subject?: string } => {
  console.log('Processing JSON:', obj);
  
  let subject: string | undefined;
  let items: any[] = [];

  // Handle array input first - your exact format
  if (Array.isArray(obj)) {
    console.log('Input is array, processing first element');
    if (obj.length > 0) {
      const firstElement = obj[0];
      if (firstElement.output && firstElement.output.items) {
        console.log('Found output.items structure');
        items = firstElement.output.items;
        subject = firstElement.subject || undefined;
        return { items, subject };
      }
    }
  }

  // Handle direct object input
  if (typeof obj === 'object' && obj !== null) {
    // Extract subject/title first
    const subjectKeys = ['subject', 'title', 'topic', 'name', 'heading', 'theme'];
    for (const key of subjectKeys) {
      if (obj[key] && typeof obj[key] === 'string') {
        subject = obj[key];
        break;
      }
    }

    // Direct output.items structure
    if (obj.output && obj.output.items && Array.isArray(obj.output.items)) {
      console.log('Found direct output.items');
      items = obj.output.items;
      return { items, subject };
    }

    // Common property names where items might be stored
    const commonKeys = [
      'items', 'data', 'results', 'nodes', 'entries', 'content', 
      'list', 'array', 'collection', 'records', 'elements'
    ];
    
    // Check direct common keys
    for (const key of commonKeys) {
      if (obj[key] && Array.isArray(obj[key])) {
        const foundItems = obj[key];
        if (foundItems.length > 0 && typeof foundItems[0] === 'object') {
          console.log(`Found items in ${key}`);
          items = foundItems;
          return { items, subject };
        }
      }
    }
  }

  console.log('No items found, returning empty');
  return { items: [], subject };
};

// Convert any object to standardized format
const normalizeItem = (item: any, index: number): any => {
  if (typeof item !== 'object' || item === null) {
    return {
      itemNumber: index + 1,
      title: `Item ${index + 1}`,
      description: String(item)
    };
  }
  
  // Try to find title-like properties
  const titleKeys = ['title', 'name', 'label', 'heading', 'subject', 'topic'];
  const descKeys = ['description', 'content', 'text', 'body', 'details', 'summary', 'info'];
  
  let title = '';
  let description = '';
  let itemNumber = item.itemNumber || item.id || item.number || index + 1;
  
  // Find title
  for (const key of titleKeys) {
    if (item[key] && typeof item[key] === 'string') {
      title = item[key];
      break;
    }
  }
  
  // Find description
  for (const key of descKeys) {
    if (item[key] && typeof item[key] === 'string') {
      description = item[key];
      break;
    }
  }
  
  // Fallback: use first string property as title, second as description
  if (!title || !description) {
    const stringProps = Object.entries(item)
      .filter(([key, value]) => typeof value === 'string' && value.length > 0)
      .map(([key, value]) => ({ key, value: value as string }));
    
    if (!title && stringProps.length > 0) {
      title = stringProps[0].value;
    }
    if (!description && stringProps.length > 1) {
      description = stringProps[1].value;
    }
  }
  
  // Final fallbacks
  if (!title) title = `Item ${index + 1}`;
  if (!description) {
    // Try to create description from other properties
    const otherProps = Object.entries(item)
      .filter(([key, value]) => !titleKeys.includes(key) && value !== null && value !== undefined)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    description = otherProps || 'No description available';
  }
  
  return {
    itemNumber: Number(itemNumber),
    title: title.substring(0, 100), // Limit title length
    description: description.substring(0, 500) // Limit description length
  };
};

const EXAMPLE_PROMPTS = [
  "How does photosynthesis work?",
  "Explain machine learning basics",
  "Steps to start a business",
  "How to learn programming",
  "The solar system explained"
];

export const PromptInput = () => {
  const [promptInput, setPromptInput] = useState('');
  const { setInitialData, isLoading, setLoading } = useMindMapStore();

  const handleSendPrompt = async () => {
    if (!promptInput.trim()) {
      toast.error('Please enter what you want to learn');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptInput.trim()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Webhook response:', data);
      
      const { items: extractedItems, subject } = extractDataFromJSON(data);
      console.log('Extracted items:', extractedItems);
      console.log('Extracted subject:', subject);
      
      if (extractedItems.length === 0) {
        throw new Error('No valid items found in the response. Please try a different topic.');
      }
      
      // Normalize all items to our standard format
      const normalizedItems = extractedItems.map((item, index) => normalizeItem(item, index));
      console.log('Normalized items:', normalizedItems);
      
      setInitialData(normalizedItems, subject || promptInput);
      toast.success(`Successfully generated mind map for "${subject || promptInput}" with ${normalizedItems.length} items`);
      setPromptInput(''); // Clear the input after success
      
    } catch (error) {
      console.error('Error sending prompt to webhook:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Failed to generate mind map'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setPromptInput(example);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card className="glass-panel">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-3 text-2xl">
            <Brain className="w-8 h-8 text-primary" />
            AI Mind Map Generator
          </CardTitle>
          <p className="text-muted-foreground">
            Transform any topic into an interactive mind map that you can explore and expand
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Textarea
              placeholder="What would you like to learn about? Try 'How does photosynthesis work?' or 'Explain quantum physics basics'"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[120px] resize-none text-base"
              disabled={isLoading}
            />
            
            <Button 
              onClick={handleSendPrompt} 
              disabled={isLoading || !promptInput.trim()}
              className="w-full h-12 text-base"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Mind Map...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Generate Mind Map
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="w-5 h-5 text-primary" />
            Example Topics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EXAMPLE_PROMPTS.map((example, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => handleExampleClick(example)}
                disabled={isLoading}
                className="text-left justify-start h-auto py-3 px-4"
              >
                {example}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>💡 <strong>Tip:</strong> Press Enter to generate, or click any example above</p>
        <p>🔗 <strong>Interactive:</strong> Click "Elaborate More" on any node to explore deeper</p>
      </div>
    </div>
  );
};