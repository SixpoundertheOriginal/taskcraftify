
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { IntegrationState, createIntegrationSlice } from './integrationSlice';

export type IntegrationStore = IntegrationState;

export const useIntegrationStore = create<IntegrationStore>()(
  devtools(
    (...a) => ({
      ...createIntegrationSlice(...a),
    })
  )
);
