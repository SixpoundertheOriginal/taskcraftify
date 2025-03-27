
import { useEffect, useState } from 'react';
import { useIntegrationStore } from '@/store';
import { useAuth } from '@/auth/AuthContext';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Provider } from '@/types/integration';
import { 
  Loader2, 
  ExternalLink,
  Trash2, 
  CalendarDays,
  Mail,
  RefreshCw,
  CheckCircle,
  XCircle,
  Microsoft
} from 'lucide-react';

export function IntegrationsSettings() {
  const { user } = useAuth();
  const { 
    integrations, 
    emailSettings,
    fetchIntegrations, 
    fetchEmailSettings,
    updateEmailSettings,
    deleteIntegration,
    syncWithExternalCalendar,
    startOAuthFlow,
    isLoading,
    error 
  } = useIntegrationStore();
  
  const [notifyTaskAssignments, setNotifyTaskAssignments] = useState(true);
  const [notifyDueDates, setNotifyDueDates] = useState(true);
  const [notifyComments, setNotifyComments] = useState(true);
  const [dailySummary, setDailySummary] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  
  useEffect(() => {
    fetchIntegrations();
    fetchEmailSettings();
  }, [fetchIntegrations, fetchEmailSettings]);
  
  useEffect(() => {
    if (emailSettings) {
      setNotifyTaskAssignments(emailSettings.notificationPreferences.taskAssignments);
      setNotifyDueDates(emailSettings.notificationPreferences.dueDates);
      setNotifyComments(emailSettings.notificationPreferences.comments);
      setDailySummary(emailSettings.dailySummary);
      setEmailAddress(emailSettings.emailAddress || '');
    }
  }, [emailSettings]);
  
  const handleConnectCalendar = (provider: Provider) => {
    startOAuthFlow(provider);
  };
  
  const handleDisconnectIntegration = async (id: string) => {
    await deleteIntegration(id);
  };
  
  const handleSyncCalendar = async (integrationId: string) => {
    await syncWithExternalCalendar(integrationId);
  };
  
  const handleSaveEmailSettings = async () => {
    await updateEmailSettings({
      emailAddress,
      notificationPreferences: {
        taskAssignments: notifyTaskAssignments,
        dueDates: notifyDueDates,
        comments: notifyComments
      },
      dailySummary
    });
    
    toast({
      title: "Email settings saved",
      description: "Your email notification preferences have been updated"
    });
  };
  
  const googleIntegration = integrations.find(i => i.provider === 'google');
  const microsoftIntegration = integrations.find(i => i.provider === 'microsoft');
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Integrations & Notifications</h3>
        <p className="text-sm text-muted-foreground">
          Connect your calendars and configure email notifications
        </p>
      </div>
      
      <Separator />
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Calendar Integrations
              </CardTitle>
              <CardDescription>
                Connect your calendar to sync tasks with due dates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-secondary/50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" className="h-8 w-8" alt="Google Calendar" />
                    <div>
                      <div className="font-medium">Google Calendar</div>
                      <div className="text-sm text-muted-foreground">
                        {googleIntegration 
                          ? 'Connected' 
                          : 'Sync your tasks with Google Calendar'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {googleIntegration ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSyncCalendar(googleIntegration.id)}
                          disabled={isLoading}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Sync
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Disconnect
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will disconnect your Google Calendar integration. 
                                Any synced events will remain but will no longer be updated.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDisconnectIntegration(googleIntegration.id)}
                              >
                                Disconnect
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    ) : (
                      <Button 
                        onClick={() => handleConnectCalendar('google')}
                        disabled={isLoading}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Microsoft Outlook Integration */}
                <div className="flex items-center justify-between bg-secondary/50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Microsoft className="h-8 w-8 text-blue-500" />
                    <div>
                      <div className="font-medium">Microsoft Outlook</div>
                      <div className="text-sm text-muted-foreground">
                        {microsoftIntegration 
                          ? 'Connected' 
                          : 'Sync your tasks with Microsoft Outlook/Office 365'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {microsoftIntegration ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSyncCalendar(microsoftIntegration.id)}
                          disabled={isLoading}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Sync
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Disconnect
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will disconnect your Microsoft Outlook integration. 
                                Any synced events will remain but will no longer be updated.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDisconnectIntegration(microsoftIntegration.id)}
                              >
                                Disconnect
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    ) : (
                      <Button 
                        onClick={() => handleConnectCalendar('microsoft')}
                        disabled={isLoading}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>
                Configure how you receive task notifications via email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    placeholder="Your email address" 
                    value={emailAddress}
                    onChange={e => setEmailAddress(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="font-medium">Notification Preferences</div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="taskAssignments" className="flex-1">
                        Task assignments
                      </Label>
                      <Switch 
                        id="taskAssignments" 
                        checked={notifyTaskAssignments}
                        onCheckedChange={setNotifyTaskAssignments}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="dueDates" className="flex-1">
                        Due date reminders
                      </Label>
                      <Switch 
                        id="dueDates" 
                        checked={notifyDueDates}
                        onCheckedChange={setNotifyDueDates}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="comments" className="flex-1">
                        New comments
                      </Label>
                      <Switch 
                        id="comments" 
                        checked={notifyComments}
                        onCheckedChange={setNotifyComments}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="dailySummary" className="flex-1">
                          Daily task summary
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Receive a daily email with your upcoming tasks
                        </p>
                      </div>
                      <Switch 
                        id="dailySummary" 
                        checked={dailySummary}
                        onCheckedChange={setDailySummary}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveEmailSettings} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
