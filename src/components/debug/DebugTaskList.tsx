
import { useState, useEffect } from 'react';
import { useTaskStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Bug } from 'lucide-react';
import { Task } from '@/types/task';

export function DebugTaskList() {
  const { 
    tasks, 
    filters, 
    fetchTasks, 
    setupTaskSubscription,
    error,
    isLoading
  } = useTaskStore();
  
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  
  // Debug state
  const [debugInfo, setDebugInfo] = useState<{
    tasksCount: number;
    storeTaskIds: string[];
    localTaskIds: string[];
    filterKeys: string[];
  }>({
    tasksCount: 0,
    storeTaskIds: [],
    localTaskIds: [],
    filterKeys: [],
  });
  
  // Effect to update debug info whenever tasks change
  useEffect(() => {
    console.log("[DebugTaskList] Tasks from store updated:", tasks.length);
    console.log("[DebugTaskList] Task IDs:", tasks.map(t => t.id));
    
    setDebugInfo({
      tasksCount: tasks.length,
      storeTaskIds: tasks.map(t => t.id),
      localTaskIds: localTasks.map(t => t.id),
      filterKeys: Object.keys(filters),
    });
    
    // Also update local tasks for comparison
    setLocalTasks(tasks);
  }, [tasks, filters, localTasks]);
  
  // Initial task loading with detailed logging
  useEffect(() => {
    console.log("[DebugTaskList] Component mounted, setting up debug environment");
    
    const loadTasks = async () => {
      console.log("[DebugTaskList] Explicitly fetching tasks...");
      try {
        const fetchedTasks = await fetchTasks();
        console.log("[DebugTaskList] Fetch complete, received tasks:", fetchedTasks.length);
        console.log("[DebugTaskList] First few task IDs:", fetchedTasks.slice(0, 3).map(t => t.id));
        setLastRefreshed(new Date());
      } catch (err) {
        console.error("[DebugTaskList] Error fetching tasks:", err);
      }
    };
    
    loadTasks();
  }, [fetchTasks]);
  
  // Handle subscription separately for better debugging
  useEffect(() => {
    console.log("[DebugTaskList] Setting up subscription...");
    
    // Set up the task subscription for real-time updates
    const unsubscribe = setupTaskSubscription();
    setSubscriptionActive(true);
    
    return () => {
      console.log("[DebugTaskList] Unmounting, cleaning up subscription");
      unsubscribe();
      setSubscriptionActive(false);
    };
  }, [setupTaskSubscription]);
  
  // Force refresh handler
  const handleForceRefresh = async () => {
    console.log("[DebugTaskList] Manually refreshing tasks...");
    try {
      const refreshedTasks = await fetchTasks();
      console.log("[DebugTaskList] Manual refresh complete, tasks:", refreshedTasks.length);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("[DebugTaskList] Error in manual refresh:", err);
    }
  };
  
  // Force new subscription handler
  const handleResetSubscription = () => {
    console.log("[DebugTaskList] Resetting subscription...");
    
    // Clean up existing subscription if active
    if (subscriptionActive) {
      console.log("[DebugTaskList] Cleaning up existing subscription");
      const unsubscribe = setupTaskSubscription();
      unsubscribe();
      setSubscriptionActive(false);
    }
    
    // Set up new subscription
    console.log("[DebugTaskList] Setting up new subscription");
    const newUnsubscribe = setupTaskSubscription();
    setSubscriptionActive(true);
  };
  
  return (
    <div className="space-y-6 p-6 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-yellow-500" />
          <h2 className="text-xl font-bold">Debug Task List</h2>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleForceRefresh}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Force Refresh
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleResetSubscription}
            className="flex items-center gap-1"
          >
            Reset Subscription
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-md p-4">
          <h3 className="font-medium mb-2">Store State</h3>
          <div className="text-sm space-y-2">
            <p>
              <span className="font-medium">Tasks in store:</span> {debugInfo.tasksCount}
            </p>
            <p>
              <span className="font-medium">Active filters:</span> {debugInfo.filterKeys.length > 0 
                ? debugInfo.filterKeys.join(', ') 
                : 'None'}
            </p>
            <p>
              <span className="font-medium">Loading:</span> {isLoading ? 'Yes' : 'No'}
            </p>
            <p>
              <span className="font-medium">Subscription active:</span> {subscriptionActive ? 'Yes' : 'No'}
            </p>
            <p>
              <span className="font-medium">Last refreshed:</span> {lastRefreshed.toLocaleTimeString()}
            </p>
          </div>
        </div>
        
        <div className="border rounded-md p-4">
          <h3 className="font-medium mb-2">Task IDs from Store</h3>
          <div className="h-40 overflow-y-auto">
            {debugInfo.storeTaskIds.length > 0 ? (
              <ul className="text-sm space-y-1">
                {debugInfo.storeTaskIds.map(id => (
                  <li key={id} className="border-b pb-1">
                    {id}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No tasks in store</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="border rounded-md p-4">
        <h3 className="font-medium mb-2">Raw Task Data</h3>
        <div className="max-h-60 overflow-y-auto bg-muted p-2 rounded text-xs">
          <pre>
            {JSON.stringify(tasks.slice(0, 3), null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
