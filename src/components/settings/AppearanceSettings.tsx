
import { useState, useEffect } from 'react';
import { useTheme } from '@/providers/ThemeProvider';
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
import { useTaskStore } from '@/store';

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [defaultView, setDefaultView] = useState('list');
  const [compactView, setCompactView] = useState(false);
  const [fontScale, setFontScale] = useState([100]);
  
  // Wait until mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    
    // Load user preferences from local storage
    const savedView = localStorage.getItem('taskcraft-default-view') || 'list';
    const savedCompactView = localStorage.getItem('taskcraft-compact-view') === 'true';
    const savedFontScale = localStorage.getItem('taskcraft-font-scale');
    
    setDefaultView(savedView);
    setCompactView(savedCompactView);
    setFontScale(savedFontScale ? [parseInt(savedFontScale)] : [100]);
  }, []);
  
  // Save preferences to local storage
  const saveViewPreference = (view: string) => {
    setDefaultView(view);
    localStorage.setItem('taskcraft-default-view', view);
  };
  
  const saveCompactViewPreference = (value: boolean) => {
    setCompactView(value);
    localStorage.setItem('taskcraft-compact-view', String(value));
  };
  
  const saveFontScalePreference = (value: number[]) => {
    setFontScale(value);
    localStorage.setItem('taskcraft-font-scale', String(value[0]));
    
    // Apply font scale to root element
    document.documentElement.style.fontSize = `${value[0]}%`;
  };
  
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
            Choose your preferred theme and appearance settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            defaultValue={theme}
            value={theme}
            onValueChange={setTheme}
            className="grid grid-cols-3 gap-4"
          >
            <Label
              className={`flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground ${
                theme === 'light' ? 'border-primary' : ''
              }`}
            >
              <RadioGroupItem value="light" className="sr-only" />
              <Sun className="h-5 w-5 mb-3" />
              <span className="text-center">Light</span>
            </Label>
            
            <Label
              className={`flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground ${
                theme === 'dark' ? 'border-primary' : ''
              }`}
            >
              <RadioGroupItem value="dark" className="sr-only" />
              <Moon className="h-5 w-5 mb-3" />
              <span className="text-center">Dark</span>
            </Label>
            
            <Label
              className={`flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground ${
                theme === 'system' ? 'border-primary' : ''
              }`}
            >
              <RadioGroupItem value="system" className="sr-only" />
              <Monitor className="h-5 w-5 mb-3" />
              <span className="text-center">System</span>
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
              defaultValue={defaultView} 
              value={defaultView}
              onValueChange={saveViewPreference}
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
              checked={compactView} 
              onCheckedChange={saveCompactViewPreference} 
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
              <span className="font-medium text-sm">{fontScale[0]}%</span>
            </div>
            
            <div className="pt-2">
              <Slider
                defaultValue={fontScale}
                min={75}
                max={150}
                step={5}
                value={fontScale}
                onValueChange={saveFontScalePreference}
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
