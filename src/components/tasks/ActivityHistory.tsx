
import { useEffect, useState } from 'react';
import { useTaskStore } from '@/store';
import { ActivityItem } from '@/types/task';
import { formatDistanceToNow, isSameDay, isYesterday, format } from 'date-fns';
import { Loader2, Activity, CheckCircle, Edit, MessageSquare, Trash, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityHistoryProps {
  taskId: string;
}

export function ActivityHistory({ taskId }: ActivityHistoryProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { tasks, fetchActivities } = useTaskStore();
  
  const task = tasks.find(t => t.id === taskId);
  const activities = task?.activities || [];
  
  // Fetch activities on initial render
  useEffect(() => {
    const loadActivities = async () => {
      setIsLoading(true);
      try {
        await fetchActivities(taskId);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (taskId) {
      loadActivities();
    }
  }, [taskId, fetchActivities]);
  
  // Group activities by date
  const groupedActivities: Record<string, ActivityItem[]> = {};
  
  const today = new Date();
  
  activities.forEach(activity => {
    let dateGroup = '';
    
    if (isSameDay(activity.createdAt, today)) {
      dateGroup = 'Today';
    } else if (isYesterday(activity.createdAt)) {
      dateGroup = 'Yesterday';
    } else {
      dateGroup = format(activity.createdAt, 'MMMM d, yyyy');
    }
    
    if (!groupedActivities[dateGroup]) {
      groupedActivities[dateGroup] = [];
    }
    
    groupedActivities[dateGroup].push(activity);
  });
  
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'status_change':
        return <CheckCircle className="h-3.5 w-3.5 text-blue-500" />;
      case 'edit':
        return <Edit className="h-3.5 w-3.5 text-amber-500" />;
      case 'comment_added':
        return <MessageSquare className="h-3.5 w-3.5 text-green-500" />;
      case 'comment_edited':
        return <Edit className="h-3.5 w-3.5 text-green-500" />;
      case 'comment_deleted':
        return <Trash className="h-3.5 w-3.5 text-red-500" />;
      case 'subtask_added':
        return <Plus className="h-3.5 w-3.5 text-indigo-500" />;
      case 'subtask_completed':
        return <CheckCircle className="h-3.5 w-3.5 text-indigo-500" />;
      case 'subtask_edited':
        return <Edit className="h-3.5 w-3.5 text-indigo-500" />;
      case 'subtask_deleted':
        return <Trash className="h-3.5 w-3.5 text-red-500" />;
      default:
        return <Activity className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };
  
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium mb-2">Activity History</h3>
      
      {isLoading && !activities.length ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Activity className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">No activity yet</p>
          <p className="text-xs text-muted-foreground">
            Activity will be tracked as you make changes
          </p>
        </div>
      ) : (
        <div className={cn(
          "space-y-4 transition-all",
          isLoading ? "opacity-60" : ""
        )}>
          {Object.entries(groupedActivities).map(([dateGroup, items]) => (
            <div key={dateGroup} className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">
                {dateGroup}
              </h4>
              <div className="border-l-2 border-muted pl-3 space-y-3">
                {items.map(activity => (
                  <div key={activity.id} className="flex items-start gap-2 -ml-1.5">
                    <div className="bg-background rounded-full p-1 border mt-0.5">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(activity.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
