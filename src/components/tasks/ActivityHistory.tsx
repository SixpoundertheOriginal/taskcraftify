import React, { useState, useEffect } from 'react';
import { ActivityItem } from '@/types/task';
import { useTaskStore } from '@/store';
import {
  Check,
  Clock,
  Edit,
  Flag,
  Loader2,
  MessageSquare,
  Plus,
  Tag,
  Trash2,
  User
} from 'lucide-react';
import { formatDistance } from 'date-fns';

interface ActivityHistoryProps {
  taskId: string;
}

export const ActivityHistory: React.FC<ActivityHistoryProps> = ({ taskId }) => {
  const { tasks, fetchActivities } = useTaskStore();
  const [loading, setLoading] = useState(true);
  const task = tasks.find((task) => task.id === taskId);
  const activities = task?.activities || [];

  useEffect(() => {
    const loadActivities = async () => {
      setLoading(true);
      try {
        await fetchActivities(taskId);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, [taskId, fetchActivities]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return <div className="text-sm text-muted-foreground p-4">No activity yet.</div>;
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">Activity History</h4>
      <div className="divide-y divide-border rounded-md border">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-center space-x-2 p-3">
            {getActivityIcon(activity.type)}
            <div>
              <p className="text-sm text-gray-900">{activity.description}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistance(new Date(activity.createdAt), new Date(), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function getActivityIcon(type: string) {
  switch (type) {
    case 'task_created':
      return <Plus className="h-4 w-4 text-green-500" />;
    case 'task_updated':
      return <Edit className="h-4 w-4 text-blue-500" />;
    case 'task_deleted':
      return <Trash2 className="h-4 w-4 text-red-500" />;
    case 'status_changed':
      return <Check className="h-4 w-4 text-purple-500" />;
    case 'priority_changed':
      return <Flag className="h-4 w-4 text-orange-500" />;
    case 'due_date_changed':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'subtask_added':
      return <Plus className="h-4 w-4 text-lime-500" />;
    case 'subtask_completed':
      return <Check className="h-4 w-4 text-teal-500" />;
    case 'subtask_edited':
      return <Edit className="h-4 w-4 text-sky-500" />;
    case 'subtask_deleted':
      return <Trash2 className="h-4 w-4 text-rose-500" />;
    case 'comment_added':
      return <MessageSquare className="h-4 w-4 text-emerald-500" />;
    case 'comment_edited':
      return <Edit className="h-4 w-4 text-indigo-500" />;
    case 'comment_deleted':
      return <Trash2 className="h-4 w-4 text-violet-500" />;
    case 'tag_added':
      return <Tag className="h-4 w-4 text-amber-500" />;
    case 'tag_removed':
      return <Tag className="h-4 w-4 text-zinc-500" />;
    default:
      return <User className="h-4 w-4 text-gray-500" />;
  }
}
