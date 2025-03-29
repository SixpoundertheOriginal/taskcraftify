
import { useState } from 'react';
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
import { useToast } from '@/components/ui/use-toast';
import { Eye, Download, Lock, Activity } from 'lucide-react';

export function PrivacySettings() {
  const { toast } = useToast();
  const [usageAnalytics, setUsageAnalytics] = useState(true);
  const [crashReports, setCrashReports] = useState(true);
  
  const saveSettings = () => {
    // In a real implementation, this would save to user preferences
    toast({
      title: "Privacy settings saved",
      description: "Your privacy preferences have been updated.",
    });
  };
  
  const exportData = () => {
    // In a real implementation, this would generate a data export
    toast({
      title: "Data export requested",
      description: "Your data is being prepared. You'll receive an email when it's ready.",
    });
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            <span>Privacy Preferences</span>
          </CardTitle>
          <CardDescription>
            Manage how your data is used and collected
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Usage Analytics</Label>
              <p className="text-xs text-muted-foreground">
                Allow anonymous usage data collection to help improve the app
              </p>
            </div>
            <Switch 
              checked={usageAnalytics} 
              onCheckedChange={setUsageAnalytics}
            />
          </div>
          
          <Separator />
          
          <div className="flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Crash Reports</Label>
              <p className="text-xs text-muted-foreground">
                Send anonymous crash reports to help fix issues
              </p>
            </div>
            <Switch 
              checked={crashReports} 
              onCheckedChange={setCrashReports}
            />
          </div>
          
          <Button onClick={saveSettings} className="w-full">
            Save Privacy Settings
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            <span>Data Export</span>
          </CardTitle>
          <CardDescription>
            Request a copy of your TaskCraft data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm">
              You can request a copy of all your TaskCraft data, including tasks, projects, 
              and settings. Data export requests are processed within 24 hours.
            </p>
            <Button onClick={exportData} variant="outline" className="w-full">
              Request Data Export
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
