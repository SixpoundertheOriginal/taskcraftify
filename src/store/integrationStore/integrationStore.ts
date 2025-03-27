
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { IntegrationState, IntegrationActions, createIntegrationSlice } from './integrationSlice';

// Combine both state and actions in the store type
export type IntegrationStore = IntegrationState & IntegrationActions;

export const useIntegrationStore = create<IntegrationStore>()(
  devtools((set, get) => ({
    ...createIntegrationSlice(set, get),
  }))
);
