import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface JSONUploaderProps {
  onDataLoad: (data: any[]) => void;
}

// Smart JSON parser that can extract items from various structures
const extractItemsFromJSON = (obj: any): any[] => {
  // If it's already an array with valid items, return it
  if (Array.isArray(obj)) {
    // Check if it's a direct array of items
    const firstItem = obj[0];
    if (firstItem && typeof firstItem === 'object' && 
        (firstItem.title || firstItem.name || firstItem.label)) {
      return obj;
    }
    
    // If it's an array of objects, try to extract from each
    for (const item of obj) {
      const extracted = extractItemsFromJSON(item);
      if (extracted.length > 0) return extracted;
    }
  }
  
  if (typeof obj !== 'object' || obj === null) return [];
  
  // Common property names where items might be stored
  const commonKeys = [
    'items', 'data', 'results', 'nodes', 'entries', 'content', 
    'list', 'array', 'collection', 'records', 'elements'
  ];
  
  // First, check direct common keys
  for (const key of commonKeys) {
    if (obj[key] && Array.isArray(obj[key])) {
      const items = obj[key];
      if (items.length > 0 && typeof items[0] === 'object') {
        return items;
      }
    }
  }
  
  // If not found directly, search recursively through all properties
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      const extracted = extractItemsFromJSON(value);
      if (extracted.length > 0) return extracted;
    }
  }
  
  return [];
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
  const [jsonInput, setJsonInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const complexSampleJSON = [
    {
      "output": {
        "items": [
          {
            "itemNumber": 1,
            "title": "The Big Bang Theory",
            "description": "The Big Bang is the scientific theory that explains the origin and evolution of the universe. It suggests that the universe began as an infinitely hot and dense point and expanded rapidly around 13.8 billion years ago."
          },
          {
            "itemNumber": 2,
            "title": "Evidence for the Big Bang",
            "description": "The Big Bang theory is supported by a wide range of observational evidence, including the cosmic microwave background radiation, the abundance of light elements, and the large-scale structure of the universe."
          }
        ]
      }
    }
  ];

  const simpleSampleJSON = {
    "data": [
      {
        "name": "Machine Learning Basics",
        "content": "Introduction to artificial intelligence and machine learning concepts, algorithms, and applications."
      },
      {
        "name": "Neural Networks",
        "content": "Deep dive into artificial neural networks, their structure, and how they process information."
      },
      {
        "name": "AI Applications",
        "content": "Real-world applications of AI in various industries including healthcare, finance, and technology."
      }
    ]
  };

  const handleProcessJSON = () => {
    if (!jsonInput.trim()) {
      toast.error('Please enter JSON data');
      return;
    }

    setIsLoading(true);
    
    try {
      const parsed = JSON.parse(jsonInput);
      const extractedItems = extractItemsFromJSON(parsed);
      
      if (extractedItems.length === 0) {
        throw new Error('No valid items found. Please ensure your JSON contains an array of objects with text properties.');
      }
      
      // Normalize all items to our standard format
      const normalizedItems = extractedItems.map((item, index) => normalizeItem(item, index));
      
      onDataLoad(normalizedItems);
      toast.success(`Successfully loaded ${normalizedItems.length} items from JSON`);
      
    } catch (error) {
      if (error instanceof SyntaxError) {
        toast.error('Invalid JSON syntax. Please check your JSON format.');
      } else {
        toast.error(`Processing Error: ${error instanceof Error ? error.message : 'Could not process JSON'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadSampleData = (complex: boolean = false) => {
    const sample = complex ? complexSampleJSON : simpleSampleJSON;
    setJsonInput(JSON.stringify(sample, null, 2));
    const extractedItems = extractItemsFromJSON(sample);
    const normalizedItems = extractedItems.map((item, index) => normalizeItem(item, index));
    onDataLoad(normalizedItems);
    toast.success(`${complex ? 'Complex' : 'Simple'} sample data loaded`);
  };

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          JSON Data Input
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Paste your JSON data here..."
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Smart JSON Parser:</strong> Automatically detects items in any structure
              <br />
              <strong>Supported formats:</strong> Arrays, nested objects, various property names (items, data, results, etc.)
              <br />
              <strong>Auto-mapping:</strong> Finds title/name and description/content fields automatically
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleProcessJSON} 
            disabled={isLoading}
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isLoading ? 'Processing...' : 'Generate Flowchart'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => loadSampleData(false)}
            className="whitespace-nowrap"
          >
            Simple Sample
          </Button>
          <Button 
            variant="outline" 
            onClick={() => loadSampleData(true)}
            className="whitespace-nowrap"
          >
            Complex Sample
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};