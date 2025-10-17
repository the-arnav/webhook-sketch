import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette, Move3D, User, LogOut, Settings as SettingsIcon, Home, BarChart3, ArrowLeft, Eye, Zap, Grid3X3, Layout } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const themePresets = [
  { name: 'Purple', hue: '270', preview: 'hsl(270, 80%, 65%)' },
  { name: 'Blue', hue: '220', preview: 'hsl(220, 80%, 65%)' },
  { name: 'Green', hue: '140', preview: 'hsl(140, 80%, 65%)' },
  { name: 'Orange', hue: '30', preview: 'hsl(30, 80%, 65%)' },
  { name: 'Pink', hue: '320', preview: 'hsl(320, 80%, 65%)' },
  { name: 'Cyan', hue: '180', preview: 'hsl(180, 80%, 65%)' },
  { name: 'Red', hue: '0', preview: 'hsl(0, 80%, 65%)' },
  { name: 'Indigo', hue: '240', preview: 'hsl(240, 80%, 65%)' },
];

export default function Settings() {
  const { 
    themeColor, horizontalSpacing, verticalSpacing, nodeOpacity, animationSpeed, showGrid, autoLayout, canvasBackground,
    setThemeColor, setHorizontalSpacing, setVerticalSpacing, setNodeOpacity, setAnimationSpeed, setShowGrid, setAutoLayout, setCanvasBackground 
  } = useSettings();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground">Customize your workspace and preferences</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Theme Settings */}
          <Card className="glass-panel border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-primary" />
                Theme Customization
              </CardTitle>
              <CardDescription>
                Choose your preferred color scheme for the interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-foreground">Color Themes</Label>
                <div className="grid grid-cols-4 gap-3 mt-3">
                  {themePresets.map((preset) => (
                    <button
                      key={preset.hue}
                      onClick={() => setThemeColor(preset.hue)}
                      className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                        themeColor === preset.hue 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border bg-card hover:border-primary/50'
                      }`}
                    >
                      <div 
                        className="w-full h-8 rounded-md mb-2"
                        style={{ backgroundColor: preset.preview }}
                      />
                      <span className="text-xs font-medium text-foreground">{preset.name}</span>
                      {themeColor === preset.hue && (
                        <Badge variant="secondary" className="mt-1 text-xs">Active</Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Canvas Layout Settings */}
          <Card className="glass-panel border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Move3D className="w-5 h-5 text-primary" />
                Canvas Layout
              </CardTitle>
              <CardDescription>
                Adjust the spacing and layout behavior of your flowcharts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-foreground">
                    Horizontal Spacing: {horizontalSpacing}px
                  </Label>
                  <div className="mt-3">
                    <Slider
                      value={[horizontalSpacing]}
                      onValueChange={(value) => setHorizontalSpacing(value[0])}
                      min={200}
                      max={600}
                      step={50}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>Compact</span>
                      <span>Spacious</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-foreground">
                    Vertical Spacing: {verticalSpacing}px
                  </Label>
                  <div className="mt-3">
                    <Slider
                      value={[verticalSpacing]}
                      onValueChange={(value) => setVerticalSpacing(value[0])}
                      min={200}
                      max={600}
                      step={50}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>Tight</span>
                      <span>Spacious</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-foreground">Auto Layout</Label>
                  <p className="text-xs text-muted-foreground">Automatically organize nodes when adding new ones</p>
                </div>
                <Switch checked={autoLayout} onCheckedChange={setAutoLayout} />
              </div>
            </CardContent>
          </Card>

          {/* Visual Customization */}
          <Card className="glass-panel border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-primary" />
                Visual Customization
              </CardTitle>
              <CardDescription>
                Customize the appearance and behavior of the canvas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-foreground">
                    Node Opacity: {nodeOpacity}%
                  </Label>
                  <div className="mt-3">
                    <Slider
                      value={[nodeOpacity]}
                      onValueChange={(value) => setNodeOpacity(value[0])}
                      min={50}
                      max={100}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>Transparent</span>
                      <span>Solid</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-foreground">
                    Animation Speed: {animationSpeed}ms
                  </Label>
                  <div className="mt-3">
                    <Slider
                      value={[animationSpeed]}
                      onValueChange={(value) => setAnimationSpeed(value[0])}
                      min={100}
                      max={800}
                      step={100}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>Fast</span>
                      <span>Slow</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-foreground">Show Grid</Label>
                    <p className="text-xs text-muted-foreground">Display background grid for alignment</p>
                  </div>
                  <Switch checked={showGrid} onCheckedChange={setShowGrid} />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-foreground">Canvas Background</Label>
                  <div className="mt-3">
                    <Select value={canvasBackground} onValueChange={setCanvasBackground}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solid">Solid Dark</SelectItem>
                        <SelectItem value="amoled">AMOLED Black</SelectItem>
                        <SelectItem value="gradient">Gradient</SelectItem>
                        <SelectItem value="dots">Dotted Pattern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card className="glass-panel border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <User className="w-5 h-5 text-primary" />
                Account Information
              </CardTitle>
              <CardDescription>
                Manage your account and authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {user ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-foreground">
                        {user.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Signed in since {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary">Authenticated</Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-foreground">Sign Out</h4>
                      <p className="text-sm text-muted-foreground">
                        Sign out from your account
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Not signed in. Some features may be limited.
                  </p>
                  <Button className="mt-4" asChild>
                    <a href="/auth">Sign In</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}