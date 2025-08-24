import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Send, Brain, AlertCircle, Loader2 } from 'lucide-react';

interface JSONUploaderProps {
  onDataLoad: (data: any[], subject?: string) => void;
}

const WEBHOOK_URL = 'https://officially-probable-hamster.ngrok-free.app/webhook-test/b919abb2-222c-4793-958f-83fa6b3e729c';

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

export const JSONUploader = ({ onDataLoad }: JSONUploaderProps) => {
  const [promptInput, setPromptInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendPrompt = async () => {
    if (!promptInput.trim()) {
      toast.error('Please enter what you want to learn');
      return;
    }

    setIsLoading(true);
    
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
      
      onDataLoad(normalizedItems, subject || promptInput);
      toast.success(`Successfully generated flowchart for "${subject || promptInput}" with ${normalizedItems.length} items`);
      setPromptInput(''); // Clear the input after success
      
    } catch (error) {
      console.error('Error sending prompt to webhook:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Failed to generate flowchart'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSamplePrompt = () => {
    setPromptInput('Explain how photosynthesis works');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt();
    }
  };

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          AI Learning Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="What would you like to learn about? (e.g., 'How does machine learning work?', 'Explain quantum physics basics', 'Solar system planets')"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="min-h-[100px] resize-none"
            disabled={isLoading}
          />
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong>AI-Powered Learning:</strong> Enter any topic you want to understand
              <br />
              <strong>Smart Processing:</strong> AI will break down complex topics into digestible flowchart steps
              <br />
              <strong>Tip:</strong> Press Enter to send, or Shift+Enter for new line
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleSendPrompt} 
            disabled={isLoading || !promptInput.trim()}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Generate Flowchart
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={loadSamplePrompt}
            disabled={isLoading}
            className="whitespace-nowrap"
          >
            Try Sample
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};