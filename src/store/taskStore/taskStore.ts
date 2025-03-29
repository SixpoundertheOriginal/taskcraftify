
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { TaskSlice, createTaskSlice } from './taskSlice';
import { FilterSlice, createFilterSlice } from './filterSlice';
import { SubscriptionSlice, createSubscriptionSlice } from './subscriptionSlice';
import { StatsSlice, createStatsSlice } from './statsSlice';
import { AttachmentSlice, createAttachmentSlice } from './attachmentSlice';

export type TaskStore = TaskSlice & FilterSlice & SubscriptionSlice & StatsSlice & AttachmentSlice & {
  filteredTasks: Task[];
  refreshTaskCounts: () => void;
  setTaskStatus: (taskId: string, status: string) => Promise<void>;
  toggleSubtaskCompletion: (subtaskId: string, completed: boolean) => Promise<void>;
  diagnosticDatabaseQuery?: () => Promise<any>;
};

export const useTaskStore = create<TaskStore>()(
  devtools(
    (...a) => ({
      ...createTaskSlice(...a),
      ...createFilterSlice(...a),
      ...createSubscriptionSlice(...a),
      ...createStatsSlice(...a),
      ...createAttachmentSlice(...a),
    })
  )
);
