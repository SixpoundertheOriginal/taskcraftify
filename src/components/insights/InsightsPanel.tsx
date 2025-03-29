
import { useState, useEffect } from 'react';
import { useTaskStore } from '@/store';
import { 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  CheckCircle, 
  TrendingUp, 
  Clock 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { formatDistanceToNow, format, isToday, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';

export function InsightsPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const { tasks } = useTaskStore();
  
  // Calculate basic metrics
  const todaysTasks = tasks.filter(task => 
    task.dueDate && isToday(new Date(task.dueDate))
  );
  
  const completedTodayTasks = todaysTasks.filter(task => 
    task.status === 'DONE'
  );
  
  // Get tasks due this week
  const thisWeekStart = startOfWeek(new Date());
  const thisWeekEnd = endOfWeek(new Date());
  
  const thisWeekTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate >= thisWeekStart && dueDate <= thisWeekEnd;
  });
  
  const completedThisWeek = tasks.filter(task => {
    if (task.status !== 'DONE') return false;
    if (!task.updatedAt) return false;
    const completedDate = new Date(task.updatedAt);
    return completedDate >= thisWeekStart && completedDate <= thisWeekEnd;
  });
  
  // Get upcoming tasks (next 3 days)
  const today = new Date();
  const threeDaysLater = new Date();
  threeDaysLater.setDate(today.getDate() + 3);
  
  const upcomingTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate > today && dueDate <= threeDaysLater && task.status !== 'DONE';
  });
  
  // Get overdue tasks
  const overdueTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate < startOfDay(today) && task.status !== 'DONE';
  });
  
  const urgentTasks = tasks.filter(task => 
    task.priority === 'URGENT' && task.status !== 'DONE'
  );
  
  // Format greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };
  
  // Most common tags
  const tagCounts: Record<string, number> = {};
  tasks.forEach(task => {
    if (task.tags) {
      task.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });
  
  const mostCommonTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);
  
  return (
    <Collapsible 
      open={isOpen} 
      onOpenChange={setIsOpen}
      className="w-full mb-6 rounded-lg overflow-hidden transition-all duration-200"
    >
      <Card className="bg-gradient-to-r from-muted/50 to-background">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary">
              Insights
            </Badge>
            <h2 className="text-lg font-medium">Task Dashboard</h2>
          </div>
          
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 p-0">
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              <span className="sr-only">Toggle insights panel</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Today's overview */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">{getGreeting()}</h3>
                <p className="text-lg font-semibold">
                  You have {todaysTasks.length} tasks today
                  {completedTodayTasks.length > 0 && (
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      ({completedTodayTasks.length} completed)
                    </span>
                  )}
                </p>
                
                <div className="flex gap-2 items-center mt-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(), 'EEEE, MMMM d')}
                  </span>
                </div>
              </div>
              
              {/* Weekly stats */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">This week</h3>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-lg font-semibold">{completedThisWeek.length}</p>
                    <p className="text-xs text-muted-foreground">Tasks completed</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{thisWeekTasks.length}</p>
                    <p className="text-xs text-muted-foreground">Tasks scheduled</p>
                  </div>
                </div>
                
                <div className="flex gap-2 items-center mt-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {completedThisWeek.length > 0
                      ? `${Math.round((completedThisWeek.length / Math.max(thisWeekTasks.length, 1)) * 100)}% completion rate`
                      : 'No tasks completed yet'}
                  </span>
                </div>
              </div>
              
              {/* Task highlights */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Highlights</h3>
                <div className="space-y-1">
                  {overdueTasks.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full" />
                      <span className="text-sm">
                        {overdueTasks.length} overdue {overdueTasks.length === 1 ? 'task' : 'tasks'}
                      </span>
                    </div>
                  )}
                  
                  {upcomingTasks.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="h-2 w-2 p-0 rounded-full" />
                      <span className="text-sm">
                        {upcomingTasks.length} upcoming {upcomingTasks.length === 1 ? 'task' : 'tasks'} in the next 3 days
                      </span>
                    </div>
                  )}
                  
                  {urgentTasks.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />
                      <span className="text-sm">
                        {urgentTasks.length} urgent {urgentTasks.length === 1 ? 'task' : 'tasks'} to focus on
                      </span>
                    </div>
                  )}
                  
                  {mostCommonTags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">Popular tags:</span>
                      {mostCommonTags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
