
import { useState, useEffect } from 'react';
import { useTaskStore } from '@/store';
import { 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  CheckCircle, 
  TrendingUp, 
  ChartBar,
  ChartLine,
  ChartPie,
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
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatDistanceToNow, format, isToday, startOfDay, endOfDay, startOfWeek, endOfWeek, isSameDay, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { ProductivityChart } from './ProductivityChart';
import { TaskStatusChart } from './TaskStatusChart';

export function InsightsPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>("overview");
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
  
  // Calculate completion rate trend
  const today = new Date();
  const yesterday = subDays(today, 1);
  const completedToday = tasks.filter(task => {
    if (task.status !== 'DONE' || !task.updatedAt) return false;
    const completionDate = new Date(task.updatedAt);
    return isToday(completionDate);
  }).length;
  
  const completedYesterday = tasks.filter(task => {
    if (task.status !== 'DONE' || !task.updatedAt) return false;
    const completionDate = new Date(task.updatedAt);
    return isSameDay(completionDate, yesterday);
  }).length;
  
  const productivityTrend = 
    completedYesterday === 0 ? 'neutral' :
    completedToday > completedYesterday ? 'up' : 
    completedToday < completedYesterday ? 'down' : 'neutral';
  
  // Get upcoming tasks (next 3 days)
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
    
  // Task completion by day of week
  const dayOfWeekCompletion: Record<string, number> = {
    'Sunday': 0,
    'Monday': 0,
    'Tuesday': 0,
    'Wednesday': 0,
    'Thursday': 0,
    'Friday': 0,
    'Saturday': 0
  };
  
  tasks.forEach(task => {
    if (task.status === 'DONE' && task.updatedAt) {
      const completionDate = new Date(task.updatedAt);
      const dayOfWeek = format(completionDate, 'EEEE');
      dayOfWeekCompletion[dayOfWeek] = (dayOfWeekCompletion[dayOfWeek] || 0) + 1;
    }
  });
  
  const mostProductiveDay = Object.entries(dayOfWeekCompletion)
    .sort((a, b) => b[1] - a[1])
    .filter(([_, count]) => count > 0)
    .map(([day]) => day)[0] || null;
  
  return (
    <Collapsible 
      open={isOpen} 
      onOpenChange={setIsOpen}
      className="w-full mb-6 rounded-lg overflow-hidden transition-all duration-300"
    >
      <Card className="bg-gradient-to-r from-muted/60 to-background border-muted/40">
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
        
        <CollapsibleContent 
          className={cn(
            "transition-all duration-300 ease-in-out",
            isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <CardContent className="p-4 pt-0">
            <Accordion 
              type="single" 
              value={expandedSection || "overview"}
              onValueChange={setExpandedSection}
              collapsible
              className="space-y-2 border-none"
            >
              <AccordionItem value="overview" className="border-none">
                <AccordionTrigger className="py-2 hover:no-underline">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <ChartBar className="h-4 w-4 text-primary" />
                    Overview
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-2 pt-1">
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
                          <p className="text-lg font-semibold flex items-center gap-1">
                            {completedThisWeek.length}
                            {productivityTrend === 'up' && (
                              <TrendingUp className="h-4 w-4 text-emerald-500" />
                            )}
                            {productivityTrend === 'down' && (
                              <TrendingUp className="h-4 w-4 text-rose-500 rotate-180" />
                            )}
                          </p>
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
                        
                        {mostProductiveDay && (
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              Most productive day: {mostProductiveDay}
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
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="productivity" className="border-none">
                <AccordionTrigger className="py-2 hover:no-underline">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <ChartLine className="h-4 w-4 text-primary" />
                    Productivity
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-2 pt-1">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Weekly Completion</h4>
                      <ProductivityChart />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="status" className="border-none">
                <AccordionTrigger className="py-2 hover:no-underline">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <ChartPie className="h-4 w-4 text-primary" />
                    Task Status
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-2 pt-1">
                  <TaskStatusChart />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
