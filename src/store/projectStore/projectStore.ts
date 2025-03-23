
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ProjectSlice, createProjectSlice } from './projectSlice';
import { SubscriptionSlice, createSubscriptionSlice } from './subscriptionSlice';

export type ProjectStore = ProjectSlice & SubscriptionSlice;

export const useProjectStore = create<ProjectStore>()(
  devtools(
    (...a) => ({
      ...createProjectSlice(...a),
      ...createSubscriptionSlice(...a),
    })
  )
);
