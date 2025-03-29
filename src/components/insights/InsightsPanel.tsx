
import React, { useState } from 'react';
import { useTaskStore } from '@/store';
import { ProductivityChart } from './ProductivityChart';
import { TaskStatusChart } from './TaskStatusChart';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronDown } from 'lucide-react';
import { startOfToday, endOfToday, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

export function InsightsPanel() {
  const { tasks } = useTaskStore();
  const [expanded, setExpanded] = useState(true);
  const isMobile = useIsMobile();
  
  // Get today's date range
  const today = new Date();
  const todayStart = startOfToday();
  const todayEnd = endOfToday();
  
  // Get current week's date range
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);
  
  // Calculate metrics
  const tasksToday = tasks.filter(task => {
    const createdDate = new Date(task.createdAt);
    return isWithinInterval(createdDate, { start: todayStart, end: todayEnd });
  }).length;
  
  const tasksThisWeek = tasks.filter(task => {
    const createdDate = new Date(task.createdAt);
    return isWithinInterval(createdDate, { start: weekStart, end: weekEnd });
  }).length;
  
  const completedToday = tasks.filter(task => {
    if (task.status !== 'DONE' || !task.updatedAt) return false;
    const completedDate = new Date(task.updatedAt);
    return isWithinInterval(completedDate, { start: todayStart, end: todayEnd });
  }).length;
  
  const completedThisWeek = tasks.filter(task => {
    if (task.status !== 'DONE' || !task.updatedAt) return false;
    const completedDate = new Date(task.updatedAt);
    return isWithinInterval(completedDate, { start: weekStart, end: weekEnd });
  }).length;
  
  // Get overdue tasks
  const overdueTasks = tasks.filter(task => {
    if (task.status === 'DONE' || task.status === 'ARCHIVED' || !task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate < today;
  }).length;
  
  // Get high priority tasks
  const highPriorityTasks = tasks.filter(task => 
    (task.priority === 'HIGH' || task.priority === 'URGENT') && 
    task.status !== 'DONE' && 
    task.status !== 'ARCHIVED'
  ).length;
  
  return (
    <div className="mb-8 bg-muted/30 rounded-lg border p-4">
      <Accordion
        type="single"
        collapsible
        defaultValue="insights"
        className="w-full"
      >
        <AccordionItem value="insights" className="border-none">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center">
              Insights & Analytics
            </h3>
            <AccordionTrigger className="pt-0 pb-2 px-2">
              <span className="sr-only">Toggle insights panel</span>
            </AccordionTrigger>
          </div>
          
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Key metrics */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-3">Today's Overview</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-background rounded-md p-3 shadow-sm border">
                      <div className="text-3xl font-bold text-primary">{completedToday}</div>
                      <div className="text-xs text-muted-foreground">Completed today</div>
                    </div>
                    <div className="bg-background rounded-md p-3 shadow-sm border">
                      <div className="text-3xl font-bold text-primary">{tasksToday}</div>
                      <div className="text-xs text-muted-foreground">Created today</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-3">Weekly Progress</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-background rounded-md p-3 shadow-sm border">
                      <div className="text-3xl font-bold text-primary">{completedThisWeek}</div>
                      <div className="text-xs text-muted-foreground">Completed this week</div>
                    </div>
                    <div className="bg-background rounded-md p-3 shadow-sm border">
                      <div className="text-3xl font-bold text-primary">{tasksThisWeek}</div>
                      <div className="text-xs text-muted-foreground">Created this week</div>
                    </div>
                  </div>
                </div>
                
                <div className={isMobile ? "mb-6" : ""}>
                  <h4 className="text-sm font-medium mb-3">Attention Required</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-background rounded-md p-3 shadow-sm border">
                      <div className="text-3xl font-bold text-amber-500">{overdueTasks}</div>
                      <div className="text-xs text-muted-foreground">Overdue tasks</div>
                    </div>
                    <div className="bg-background rounded-md p-3 shadow-sm border">
                      <div className="text-3xl font-bold text-rose-500">{highPriorityTasks}</div>
                      <div className="text-xs text-muted-foreground">High priority tasks</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Charts */}
              <div className="space-y-10"> {/* Further increased space between charts */}
                {/* For mobile, separate the charts to avoid overlapping issues */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Task Distribution</h4>
                  <div className="bg-background rounded-md p-4 shadow-sm border">
                    <TaskStatusChart />
                  </div>
                </div>
                
                {/* Add more spacing between chart sections on mobile */}
                {isMobile && <div className="h-12"></div>} {/* Further increased height for better separation */}
                
                <div>
                  <h4 className="text-sm font-medium mb-3 mt-4">
                    <span className="inline-block pt-4">Weekly Productivity</span>
                  </h4>
                  <div className="bg-background rounded-md p-4 shadow-sm border">
                    <ProductivityChart />
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
