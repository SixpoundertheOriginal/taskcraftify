
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { IntegrationSlice, createIntegrationSlice } from './integrationSlice';

export type IntegrationStore = IntegrationSlice;

export const useIntegrationStore = create<IntegrationStore>()(
  devtools(
    (...a) => ({
      ...createIntegrationSlice(...a),
    })
  )
);
