
import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BellRing, Mail, Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';

export function NotificationSettings() {
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [browserNotifications, setBrowserNotifications] = useState(true);
  const [dueDateReminder, setDueDateReminder] = useState("1day");
  const [quietHours, setQuietHours] = useState(false);
  
  const saveSettings = () => {
    // In a real implementation, this would save to user preferences
    toast({
      title: "Notification settings saved",
      description: "Your notification preferences have been updated.",
    });
  };
  
  const requestBrowserPermission = async () => {
    if (!("Notification" in window)) {
      toast({
        variant: "destructive",
        title: "Browser notifications not supported",
        description: "Your browser doesn't support notifications.",
      });
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        toast({
          title: "Notifications enabled",
          description: "You'll now receive browser notifications.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Permission denied",
          description: "You've blocked notifications for this site.",
        });
        setBrowserNotifications(false);
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            <span>Notification Preferences</span>
          </CardTitle>
          <CardDescription>
            Configure how and when you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Email Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Receive task reminders and updates via email
              </p>
            </div>
            <Switch 
              checked={emailNotifications} 
              onCheckedChange={setEmailNotifications}
            />
          </div>
          
          <Separator />
          
          <div className="flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Browser Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Receive notifications within your browser
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <Switch 
                checked={browserNotifications} 
                onCheckedChange={(checked) => {
                  setBrowserNotifications(checked);
                  if (checked) {
                    requestBrowserPermission();
                  }
                }}
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Due Date Reminders</Label>
              <p className="text-xs text-muted-foreground">
                When should we remind you about upcoming tasks?
              </p>
            </div>
            <Select 
              value={dueDateReminder} 
              onValueChange={setDueDateReminder}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select timing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1hour">1 hour before</SelectItem>
                <SelectItem value="3hours">3 hours before</SelectItem>
                <SelectItem value="1day">1 day before</SelectItem>
                <SelectItem value="2days">2 days before</SelectItem>
                <SelectItem value="1week">1 week before</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Separator />
          
          <div className="flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Quiet Hours</Label>
              <p className="text-xs text-muted-foreground">
                Don't send notifications during specific hours
              </p>
            </div>
            <Switch 
              checked={quietHours} 
              onCheckedChange={setQuietHours}
            />
          </div>
          
          <Button onClick={saveSettings} className="w-full">
            Save Notification Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
