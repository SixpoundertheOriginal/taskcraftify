
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { CheckSquare, ListTodo, ArrowUpDown, Clock, Archive } from 'lucide-react';

export function TaskSettings() {
  const { toast } = useToast();
  const [autoArchive, setAutoArchive] = useState(false);
  const [defaultDueTime, setDefaultDueTime] = useState("17:00");
  const [defaultPriority, setDefaultPriority] = useState("medium");
  const [confirmTaskCompletion, setConfirmTaskCompletion] = useState(true);
  
  const saveSettings = () => {
    // In a real implementation, this would save to user preferences
    localStorage.setItem('taskcraft-auto-archive', String(autoArchive));
    localStorage.setItem('taskcraft-default-due-time', defaultDueTime);
    localStorage.setItem('taskcraft-default-priority', defaultPriority);
    localStorage.setItem('taskcraft-confirm-completion', String(confirmTaskCompletion));
    
    toast({
      title: "Task settings saved",
      description: "Your task preferences have been updated.",
    });
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            <span>Task Behavior</span>
          </CardTitle>
          <CardDescription>
            Customize how tasks are created, displayed, and managed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Confirm Task Completion</Label>
              <p className="text-xs text-muted-foreground">
                Show confirmation dialog when marking tasks as complete
              </p>
            </div>
            <Switch 
              checked={confirmTaskCompletion} 
              onCheckedChange={setConfirmTaskCompletion}
            />
          </div>
          
          <Separator />
          
          <div className="flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Auto-archive Completed Tasks</Label>
              <p className="text-xs text-muted-foreground">
                Automatically archive tasks after they're completed
              </p>
            </div>
            <Switch 
              checked={autoArchive} 
              onCheckedChange={setAutoArchive}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Default Due Time</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Set the default time for task due dates
            </p>
            <Select 
              value={defaultDueTime} 
              onValueChange={setDefaultDueTime}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select default time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="09:00">9:00 AM</SelectItem>
                <SelectItem value="12:00">12:00 PM</SelectItem>
                <SelectItem value="17:00">5:00 PM</SelectItem>
                <SelectItem value="23:59">End of day (11:59 PM)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Default Priority</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Set the default priority for new tasks
            </p>
            <RadioGroup
              defaultValue={defaultPriority}
              value={defaultPriority}
              onValueChange={setDefaultPriority}
              className="grid grid-cols-4 gap-2"
            >
              <Label
                className={`flex items-center justify-center rounded-md border-2 border-muted p-2 hover:bg-accent hover:text-accent-foreground ${
                  defaultPriority === 'low' ? 'border-primary' : ''
                }`}
              >
                <RadioGroupItem value="low" className="sr-only" />
                <span className="text-center text-sm">Low</span>
              </Label>
              
              <Label
                className={`flex items-center justify-center rounded-md border-2 border-muted p-2 hover:bg-accent hover:text-accent-foreground ${
                  defaultPriority === 'medium' ? 'border-primary' : ''
                }`}
              >
                <RadioGroupItem value="medium" className="sr-only" />
                <span className="text-center text-sm">Medium</span>
              </Label>
              
              <Label
                className={`flex items-center justify-center rounded-md border-2 border-muted p-2 hover:bg-accent hover:text-accent-foreground ${
                  defaultPriority === 'high' ? 'border-primary' : ''
                }`}
              >
                <RadioGroupItem value="high" className="sr-only" />
                <span className="text-center text-sm">High</span>
              </Label>
              
              <Label
                className={`flex items-center justify-center rounded-md border-2 border-muted p-2 hover:bg-accent hover:text-accent-foreground ${
                  defaultPriority === 'urgent' ? 'border-primary' : ''
                }`}
              >
                <RadioGroupItem value="urgent" className="sr-only" />
                <span className="text-center text-sm">Urgent</span>
              </Label>
            </RadioGroup>
          </div>
          
          <Button onClick={saveSettings} className="w-full">
            Save Task Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
