
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AccountSettings, 
  AppearanceSettings, 
  NotificationSettings,
  TaskSettings,
  IntegrationsSettings,
  PrivacySettings,
  KeyboardShortcutsSettings 
} from '@/components/settings';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('account');
  
  return (
    <div className="container py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Customize TaskCraft to meet your preferences and workflow needs.
        </p>
      </div>
      
      <Tabs defaultValue="account" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 md:grid-cols-7 mb-4">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account" className="space-y-4">
          <AccountSettings />
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-4">
          <AppearanceSettings />
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4">
          <NotificationSettings />
        </TabsContent>
        
        <TabsContent value="tasks" className="space-y-4">
          <TaskSettings />
        </TabsContent>
        
        <TabsContent value="integrations" className="space-y-4">
          <IntegrationsSettings />
        </TabsContent>
        
        <TabsContent value="privacy" className="space-y-4">
          <PrivacySettings />
        </TabsContent>
        
        <TabsContent value="shortcuts" className="space-y-4">
          <KeyboardShortcutsSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
