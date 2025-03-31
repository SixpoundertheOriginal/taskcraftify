import React, { useState } from 'react';
import { useTaskStore } from '@/store';
import { Task, TaskStatus } from '@/types/task';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, AlertCircle, Clock, CalendarRange, Flag, Plus, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';
import { FocusOverview } from '@/components/insights';

export function MyFocusView() {
  const {
    tasks,
    isLoading,
    error,
    getOverdueTasks,
    getTasksDueToday,
    getTasksDueTomorrow,
    getTasksDueThisWeek,
    getHighPriorityTasks
  } = useTaskStore();
  
  const isMobile = useIsMobile();
  
  // Group expansion state
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    overdue: true,
    today: true,
    tomorrow: true,
    thisWeek: true,
    highPriority: true,
    recentlyAdded: true,
    allActive: true,
  });
  
  // Toggle group expansion
  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };
  
  if (isLoading) {
    return <TaskGroupSkeleton />;
  }
  
  if (error) {
    return (
      <div className="p-6 border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50 rounded-lg">
        <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Error loading tasks
        </h3>
        <p className="text-sm text-red-600 dark:text-red-300 mt-2">
          {typeof error === 'string' ? error : 'There was an error loading your tasks. Please try again.'}
        </p>
      </div>
    );
  }
  
  // Use the store's helper functions for consistent behavior across the app
  const overdueTasks = getOverdueTasks();
  const todayTasks = getTasksDueToday();
  const tomorrowTasks = getTasksDueTomorrow();
  const thisWeekTasks = getTasksDueThisWeek();
  const highPriorityTasks = getHighPriorityTasks();
  
  // Get recently added tasks (last 3 days) that aren't in other categories
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  const recentlyAddedTasks = tasks.filter(task => {
    // Skip completed or archived tasks
    if (task.status === TaskStatus.DONE || task.status === TaskStatus.ARCHIVED) {
      return false;
    }
    
    // Must be created in the last 3 days
    const createdDate = new Date(task.createdAt);
    if (createdDate < threeDaysAgo) {
      return false;
    }
    
    // Skip tasks already in other categories
    if (
      overdueTasks.some(t => t.id === task.id) ||
      todayTasks.some(t => t.id === task.id) ||
      tomorrowTasks.some(t => t.id === task.id) ||
      thisWeekTasks.some(t => t.id === task.id) ||
      highPriorityTasks.some(t => t.id === task.id)
    ) {
      return false;
    }
    
    return true;
  });
  
  // Get all active tasks for fallback
  const activeTasks = tasks.filter(task => 
    task.status !== TaskStatus.DONE && task.status !== TaskStatus.ARCHIVED
  );
  
  // Debug log for each category
  console.log('MyFocusView - Categorized tasks:',
    '\nOverdue:', overdueTasks.length,
    '\nToday:', todayTasks.length,
    '\nTomorrow:', tomorrowTasks.length,
    '\nThis Week:', thisWeekTasks.length,
    '\nHigh Priority:', highPriorityTasks.length,
    '\nRecently Added:', recentlyAddedTasks.length,
    '\nTotal Active Tasks:', activeTasks.length
  );
  
  const hasNoFocusTasks = 
    overdueTasks.length === 0 && 
    todayTasks.length === 0 && 
    tomorrowTasks.length === 0 && 
    thisWeekTasks.length === 0 && 
    highPriorityTasks.length === 0 && 
    recentlyAddedTasks.length === 0;
  
  // Handle edge case: no tasks meet focus criteria, but we have active tasks
  if (hasNoFocusTasks && activeTasks.length > 0) {
    console.log('MyFocusView - No tasks matching focus criteria but have', activeTasks.length, 'active tasks');
    
    return (
      <div className="space-y-8 animate-fade-in">
        {/* Focus Overview */}
        <FocusOverview />
        
        {/* Show all active tasks */}
        <div className="space-y-6">
          <TaskGroup
            title="All Active Tasks"
            count={activeTasks.length}
            tasks={activeTasks}
            accentColor="bg-emerald-500"
            icon={<Plus className="h-4 w-4 text-emerald-500" />}
            isExpanded={expandedGroups.allActive}
            onToggle={() => toggleGroup('allActive')}
            badgeColor="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
          />
        </div>
      </div>
    );
  }
  
  if (hasNoFocusTasks) {
    return <EmptyFocusState />;
  }
  
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Focus Overview */}
      <FocusOverview />
      
      {/* Task Groups */}
      <div className="space-y-6">
        {/* Overdue Tasks Group */}
        {overdueTasks.length > 0 && (
          <TaskGroup
            title="Overdue"
            count={overdueTasks.length}
            tasks={overdueTasks}
            accentColor="bg-red-500"
            icon={<AlertCircle className="h-4 w-4 text-red-500" />}
            isExpanded={expandedGroups.overdue}
            onToggle={() => toggleGroup('overdue')}
            badgeColor="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
          />
        )}
        
        {/* Due Today Group */}
        {todayTasks.length > 0 && (
          <TaskGroup
            title="Due Today"
            count={todayTasks.length}
            tasks={todayTasks}
            accentColor="bg-amber-500"
            icon={<Clock className="h-4 w-4 text-amber-500" />}
            isExpanded={expandedGroups.today}
            onToggle={() => toggleGroup('today')}
            badgeColor="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
          />
        )}
        
        {/* Due Tomorrow Group */}
        {tomorrowTasks.length > 0 && (
          <TaskGroup
            title="Due Tomorrow"
            count={tomorrowTasks.length}
            tasks={tomorrowTasks}
            accentColor="bg-blue-500"
            icon={<Clock className="h-4 w-4 text-blue-500" />}
            isExpanded={expandedGroups.tomorrow}
            onToggle={() => toggleGroup('tomorrow')}
            badgeColor="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
          />
        )}
        
        {/* Due This Week Group */}
        {thisWeekTasks.length > 0 && (
          <TaskGroup
            title="Due This Week"
            count={thisWeekTasks.length}
            tasks={thisWeekTasks}
            accentColor="bg-indigo-500"
            icon={<CalendarRange className="h-4 w-4 text-indigo-500" />}
            isExpanded={expandedGroups.thisWeek}
            onToggle={() => toggleGroup('thisWeek')}
            badgeColor="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
          />
        )}
        
        {/* High Priority Group */}
        {highPriorityTasks.length > 0 && (
          <TaskGroup
            title="High Priority"
            count={highPriorityTasks.length}
            tasks={highPriorityTasks}
            accentColor="bg-purple-500"
            icon={<Flag className="h-4 w-4 text-purple-500" />}
            isExpanded={expandedGroups.highPriority}
            onToggle={() => toggleGroup('highPriority')}
            badgeColor="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
          />
        )}
        
        {/* Recently Added Group */}
        {recentlyAddedTasks.length > 0 && (
          <TaskGroup
            title="Recently Added"
            count={recentlyAddedTasks.length}
            tasks={recentlyAddedTasks}
            accentColor="bg-emerald-500"
            icon={<Plus className="h-4 w-4 text-emerald-500" />}
            isExpanded={expandedGroups.recentlyAdded}
            onToggle={() => toggleGroup('recentlyAdded')}
            badgeColor="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
          />
        )}
      </div>
    </div>
  );
}

// TaskGroup Component
interface TaskGroupProps {
  title: string;
  count: number;
  tasks: Task[];
  accentColor: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  badgeColor: string;
}

function TaskGroup({ 
  title, 
  count, 
  tasks, 
  accentColor, 
  icon, 
  isExpanded, 
  onToggle,
  badgeColor
}: TaskGroupProps) {
  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <div className="flex items-center justify-between px-4 py-3 relative">
          <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentColor}`} />
          
          <div className="flex items-center">
            <span className="mr-2">{icon}</span>
            <h3 className="font-medium">{title}</h3>
            <Badge variant="outline" className={`ml-2 ${badgeColor}`}>
              {count}
            </Badge>
          </div>
          
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {isExpanded ? 
                <ChevronUp className="h-4 w-4" /> : 
                <ChevronDown className="h-4 w-4" />
              }
              <span className="sr-only">Toggle {title}</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent>
          <div className="px-4 pb-3 space-y-3">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// Empty state component
function EmptyFocusState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="bg-primary-50 dark:bg-primary-950/30 p-4 rounded-full mb-4">
        <CheckCircle className="h-12 w-12 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        You don't have any priority tasks right now. Create a new task or check your completed tasks.
      </p>
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Create New Task
      </Button>
    </div>
  );
}

// Loading skeleton
function TaskGroupSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center">
            <Skeleton className="h-4 w-4 rounded-full mr-2" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-8 ml-2 rounded-full" />
            <div className="flex-1" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <div className="space-y-3 pt-2">
            {[1, 2].map((j) => (
              <Skeleton key={j} className="h-24 w-full rounded-md" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
