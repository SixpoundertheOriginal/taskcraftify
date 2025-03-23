
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { TaskSlice, createTaskSlice } from './taskSlice';
import { FilterSlice, createFilterSlice } from './filterSlice';
import { SubscriptionSlice, createSubscriptionSlice } from './subscriptionSlice';

export type TaskStore = TaskSlice & FilterSlice & SubscriptionSlice;

export const useTaskStore = create<TaskStore>()(
  devtools(
    (...a) => ({
      ...createTaskSlice(...a),
      ...createFilterSlice(...a),
      ...createSubscriptionSlice(...a),
    })
  )
);
