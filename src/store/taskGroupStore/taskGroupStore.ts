
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { TaskGroupSlice, createTaskGroupSlice } from './taskGroupSlice';
import { TaskGroup } from '@/types/taskGroup';
import { supabase } from '@/integrations/supabase/client';

export type TaskGroupStore = TaskGroupSlice & {
  getTaskGroupsByProject: (projectId: string) => TaskGroup[];
  setupTaskGroupSubscription: () => (() => void);
};

export const useTaskGroupStore = create<TaskGroupStore>()(
  devtools(
    (...args) => {
      const [set, get, store] = args;
      
      const taskGroupSlice = createTaskGroupSlice(set, get, store);
      
      return {
        ...taskGroupSlice,
        
        getTaskGroupsByProject: (projectId: string): TaskGroup[] => {
          return get().taskGroups.filter(group => group.projectId === projectId);
        },
        
        setupTaskGroupSubscription: (): (() => void) => {
          console.log("Setting up realtime subscription to task_groups table");
          
          // Create a unique channel name
          const channelName = `task-groups-channel-${Math.random().toString(36).substring(2, 9)}`;
          
          // Create channel with reconnection capability
          const channel = supabase
            .channel(channelName)
            .on('postgres_changes', 
              { event: '*', schema: 'public', table: 'task_groups' }, 
              async (payload) => {
                console.log(`Realtime task group update detected`);
                
                // Refresh task groups when any change happens
                await get().fetchTaskGroups();
              }
            )
            .subscribe((status) => {
              console.log(`Task groups subscription status: ${status}`);
            });

          // Return unsubscribe function
          return () => {
            console.log(`Removing task groups subscription`);
            try {
              supabase.removeChannel(channel);
            } catch (error) {
              console.error('Error removing subscription:', error);
            }
          };
        }
      };
    },
    { name: 'task-group-store' }
  )
);
