
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Keyboard, Key } from 'lucide-react';

export function KeyboardShortcutsSettings() {
  const shortcuts = [
    { action: "Create New Task", keys: ["N"] },
    { action: "Save Task", keys: ["Ctrl", "S"] },
    { action: "Toggle Sidebar", keys: ["Ctrl", "B"] },
    { action: "Search", keys: ["Ctrl", "K"] },
    { action: "Switch to List View", keys: ["Shift", "L"] },
    { action: "Switch to Kanban View", keys: ["Shift", "K"] },
    { action: "Mark Task as Complete", keys: ["C"] },
    { action: "Delete Selected Task", keys: ["Delete"] },
    { action: "Navigate Between Tasks", keys: ["↑", "↓"] },
    { action: "Open Task Details", keys: ["Enter"] },
  ];
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            <span>Keyboard Shortcuts</span>
          </CardTitle>
          <CardDescription>
            View and customize keyboard shortcuts for faster navigation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Switch id="enable-shortcuts" />
          <Label htmlFor="enable-shortcuts" className="ml-2">
            Enable keyboard shortcuts
          </Label>
          
          <div className="mt-6 space-y-0">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex justify-between py-3 border-b border-border last:border-0">
                <span className="text-sm">{shortcut.action}</span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, keyIndex) => (
                    <span key={keyIndex} className="px-2 py-1 text-xs font-medium bg-muted rounded border">
                      {key}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-xs text-muted-foreground mt-4">
            Keyboard shortcuts can be customized in a future update. Currently, these shortcuts are fixed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
