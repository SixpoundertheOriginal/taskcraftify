
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { TaskSlice, createTaskSlice } from './taskSlice';
import { FilterSlice, createFilterSlice } from './filterSlice';
import { SubscriptionSlice, createSubscriptionSlice } from './subscriptionSlice';
import { StatsSlice, createStatsSlice } from './statsSlice';

export type TaskStore = TaskSlice & FilterSlice & SubscriptionSlice & StatsSlice;

export const useTaskStore = create<TaskStore>()(
  devtools(
    (...a) => ({
      ...createTaskSlice(...a),
      ...createFilterSlice(...a),
      ...createSubscriptionSlice(...a),
      ...createStatsSlice(...a),
    })
  )
);
