
import { useState, useEffect } from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { useUI } from '@/providers/UIProvider';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Palette, Monitor, Moon, Sun, Layout, Type } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const { preferences, updatePreferences, setDefaultView, toggleCompactMode, setFontScale } = useUI();
  const [mounted, setMounted] = useState(false);
  
  // Wait until mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return null;
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <span>Theme</span>
          </CardTitle>
          <CardDescription>
            Currently only light mode is supported
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={theme}
            onValueChange={setTheme}
            className="grid grid-cols-1 gap-4"
          >
            <Label
              className="flex flex-col items-center justify-between rounded-md border-2 border-primary p-4 hover:bg-accent hover:text-accent-foreground"
            >
              <RadioGroupItem value="light" className="sr-only" />
              <Sun className="h-5 w-5 mb-3" />
              <span className="text-center">Light</span>
            </Label>
          </RadioGroup>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            <span>Layout Preferences</span>
          </CardTitle>
          <CardDescription>
            Customize how content is displayed throughout the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Default Task View</h3>
            <Tabs 
              defaultValue={preferences.defaultView} 
              value={preferences.defaultView}
              onValueChange={(value) => setDefaultView(value as 'list' | 'kanban' | 'groups')}
              className="w-full"
            >
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="list">List View</TabsTrigger>
                <TabsTrigger value="kanban">Kanban View</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <Separator />
          
          <div className="flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-medium">Compact Layout</h3>
              <p className="text-xs text-muted-foreground">
                Enable this to display more content on screen at once
              </p>
            </div>
            <Switch 
              checked={preferences.compactMode} 
              onCheckedChange={toggleCompactMode} 
            />
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <div className="flex flex-row items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium">Font Size</h3>
                <p className="text-xs text-muted-foreground">
                  Adjust the text size across the application
                </p>
              </div>
              <span className="font-medium text-sm">{preferences.fontScale}%</span>
            </div>
            
            <div className="pt-2">
              <Slider
                defaultValue={[preferences.fontScale]}
                min={75}
                max={150}
                step={5}
                value={[preferences.fontScale]}
                onValueChange={(value) => setFontScale(value[0])}
              />
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>Smaller</span>
                <span>Default</span>
                <span>Larger</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
