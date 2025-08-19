import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface JSONUploaderProps {
  onDataLoad: (data: any[]) => void;
}

export const JSONUploader = ({ onDataLoad }: JSONUploaderProps) => {
  const [jsonInput, setJsonInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sampleJSON = {
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
        },
        {
          "itemNumber": 3,
          "title": "The Big Bang and the Universe's Expansion",
          "description": "The Big Bang theory suggests that the universe is still expanding, with most galaxies moving away from each other. This expansion is thought to have begun during the early stages of the universe's evolution."
        }
      ]
    }
  };

  const handleProcessJSON = () => {
    if (!jsonInput.trim()) {
      toast.error('Please enter JSON data');
      return;
    }

    setIsLoading(true);
    
    try {
      const parsed = JSON.parse(jsonInput);
      
      if (!parsed.output || !parsed.output.items || !Array.isArray(parsed.output.items)) {
        throw new Error('Invalid JSON structure. Expected format: { "output": { "items": [...] } }');
      }
      
      const items = parsed.output.items;
      
      // Validate each item
      items.forEach((item: any, index: number) => {
        if (!item.itemNumber || !item.title || !item.description) {
          throw new Error(`Item ${index + 1} is missing required fields (itemNumber, title, description)`);
        }
      });
      
      onDataLoad(items);
      toast.success(`Successfully loaded ${items.length} items`);
      
    } catch (error) {
      toast.error(`JSON Error: ${error instanceof Error ? error.message : 'Invalid JSON format'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSampleData = () => {
    setJsonInput(JSON.stringify(sampleJSON, null, 2));
    onDataLoad(sampleJSON.output.items);
    toast.success('Sample data loaded');
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
              Expected format: <code className="bg-muted px-1 rounded">{"{ \"output\": { \"items\": [...] } }"}</code>
              <br />
              Each item needs: <code className="bg-muted px-1 rounded">itemNumber</code>, <code className="bg-muted px-1 rounded">title</code>, <code className="bg-muted px-1 rounded">description</code>
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
            onClick={loadSampleData}
            className="whitespace-nowrap"
          >
            Load Sample
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};