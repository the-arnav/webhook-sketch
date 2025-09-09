import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useSettings } from '@/contexts/SettingsContext';
import { useTheme } from '@/contexts/ThemeContext';

const themeOptions = [
  { id: 'purple', name: 'Purple', color: 'hsl(270, 80%, 65%)' },
  { id: 'blue', name: 'Blue', color: 'hsl(210, 100%, 65%)' },
  { id: 'green', name: 'Green', color: 'hsl(142, 76%, 60%)' },
  { id: 'orange', name: 'Orange', color: 'hsl(25, 95%, 65%)' },
  { id: 'pink', name: 'Pink', color: 'hsl(330, 81%, 70%)' },
  { id: 'red', name: 'Red', color: 'hsl(0, 84%, 65%)' },
] as const;

export default function Settings() {
  const { horizontalSpacing, verticalSpacing, setHorizontalSpacing, setVerticalSpacing } = useSettings();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl text-foreground font-bold">Settings</h1>
        </div>

        <div className="grid gap-6 max-w-4xl">
          {/* Canvas Spacing Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Canvas Node Spacing</CardTitle>
              <CardDescription>
                Adjust the spacing between nodes on the canvas for better organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="horizontal-spacing">
                  Horizontal Spacing: {horizontalSpacing}px
                </Label>
                <Slider
                  id="horizontal-spacing"
                  min={200}
                  max={800}
                  step={50}
                  value={[horizontalSpacing]}
                  onValueChange={(value) => setHorizontalSpacing(value[0])}
                  className="w-full"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="vertical-spacing">
                  Vertical Spacing: {verticalSpacing}px
                </Label>
                <Slider
                  id="vertical-spacing"
                  min={200}
                  max={600}
                  step={50}
                  value={[verticalSpacing]}
                  onValueChange={(value) => setVerticalSpacing(value[0])}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>
                Choose a color theme for your application. All primary colors will be updated.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {themeOptions.map((option) => (
                  <Button
                    key={option.id}
                    variant={theme === option.id ? "default" : "outline"}
                    onClick={() => setTheme(option.id as any)}
                    className="h-16 flex flex-col items-center gap-2"
                  >
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white/20"
                      style={{ backgroundColor: option.color }}
                    />
                    <span className="text-sm">{option.name}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Node Interaction Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Node Interactions</CardTitle>
              <CardDescription>
                Information about node interaction features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Right-click on any node to access the context menu</p>
                <p>• Select "Delete Node" to remove nodes from the canvas</p>
                <p>• Deleted nodes and their children will be permanently removed</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}