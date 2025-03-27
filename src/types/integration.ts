
import { Database } from './database';

export type Provider = 'google' | 'apple' | 'microsoft';

export interface Integration {
  id: string;
  userId: string;
  provider: Provider;
  providerUserId?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  scopes?: string[];
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface APIIntegration extends Database['public']['Tables']['integrations']['Row'] {}

export interface CalendarEvent {
  id: string;
  userId: string;
  integrationId?: string;
  externalEventId?: string;
  taskId?: string;
  title: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  allDay?: boolean;
  location?: string;
  status?: string;
  calendarId?: string;
  recurrence?: string[];
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface APICalendarEvent extends Database['public']['Tables']['calendar_events']['Row'] {}

export interface EmailSettings {
  id: string;
  userId: string;
  emailAddress?: string;
  forwardAddress?: string;
  notificationPreferences: {
    taskAssignments: boolean;
    dueDates: boolean;
    comments: boolean;
  };
  dailySummary: boolean;
  summaryTime?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface APIEmailSettings extends Database['public']['Tables']['email_settings']['Row'] {}

export interface CreateIntegrationDTO {
  provider: Provider;
  providerUserId?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  scopes?: string[];
  settings?: Record<string, any>;
}

export interface UpdateIntegrationDTO {
  id: string;
  providerUserId?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  scopes?: string[];
  settings?: Record<string, any>;
}

export interface CreateCalendarEventDTO {
  integrationId?: string;
  externalEventId?: string;
  taskId?: string;
  title: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  allDay?: boolean;
  location?: string;
  status?: string;
  calendarId?: string;
  recurrence?: string[];
}

export interface UpdateCalendarEventDTO {
  id: string;
  integrationId?: string;
  externalEventId?: string;
  taskId?: string;
  title?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  allDay?: boolean;
  location?: string;
  status?: string;
  calendarId?: string;
  recurrence?: string[];
}

export interface UpdateEmailSettingsDTO {
  emailAddress?: string;
  forwardAddress?: string;
  notificationPreferences?: {
    taskAssignments?: boolean;
    dueDates?: boolean;
    comments?: boolean;
  };
  dailySummary?: boolean;
  summaryTime?: string;
}

// Mapper functions
export function mapApiIntegrationToIntegration(apiIntegration: APIIntegration): Integration {
  return {
    id: apiIntegration.id,
    userId: apiIntegration.user_id,
    provider: apiIntegration.provider as Provider,
    providerUserId: apiIntegration.provider_user_id || undefined,
    accessToken: apiIntegration.access_token || undefined,
    refreshToken: apiIntegration.refresh_token || undefined,
    tokenExpiresAt: apiIntegration.token_expires_at ? new Date(apiIntegration.token_expires_at) : undefined,
    scopes: apiIntegration.scopes || undefined,
    settings: apiIntegration.settings as Record<string, any> || {},
    createdAt: new Date(apiIntegration.created_at),
    updatedAt: new Date(apiIntegration.updated_at)
  };
}

export function mapIntegrationToApiIntegration(integration: CreateIntegrationDTO | UpdateIntegrationDTO, userId?: string): Partial<APIIntegration> {
  const apiIntegration: Partial<APIIntegration> = {
    provider: integration.provider,
    provider_user_id: integration.providerUserId || null,
    access_token: integration.accessToken || null,
    refresh_token: integration.refreshToken || null,
    scopes: integration.scopes || null,
    settings: integration.settings || null,
  };

  if (userId) {
    apiIntegration.user_id = userId;
  }

  if ('id' in integration) {
    apiIntegration.id = integration.id;
  }

  if (integration.tokenExpiresAt) {
    apiIntegration.token_expires_at = integration.tokenExpiresAt.toISOString();
  } else {
    apiIntegration.token_expires_at = null;
  }

  return apiIntegration;
}

export function mapApiCalendarEventToCalendarEvent(apiEvent: APICalendarEvent): CalendarEvent {
  return {
    id: apiEvent.id,
    userId: apiEvent.user_id,
    integrationId: apiEvent.integration_id || undefined,
    externalEventId: apiEvent.external_event_id || undefined,
    taskId: apiEvent.task_id || undefined,
    title: apiEvent.title,
    description: apiEvent.description || undefined,
    startTime: apiEvent.start_time ? new Date(apiEvent.start_time) : undefined,
    endTime: apiEvent.end_time ? new Date(apiEvent.end_time) : undefined,
    allDay: apiEvent.all_day || undefined,
    location: apiEvent.location || undefined,
    status: apiEvent.status || undefined,
    calendarId: apiEvent.calendar_id || undefined,
    recurrence: apiEvent.recurrence || undefined,
    lastSyncedAt: apiEvent.last_synced_at ? new Date(apiEvent.last_synced_at) : undefined,
    createdAt: new Date(apiEvent.created_at),
    updatedAt: new Date(apiEvent.updated_at)
  };
}

export function mapCalendarEventToApiCalendarEvent(event: CreateCalendarEventDTO | UpdateCalendarEventDTO, userId?: string): Partial<APICalendarEvent> {
  const apiEvent: Partial<APICalendarEvent> = {
    integration_id: event.integrationId || null,
    external_event_id: event.externalEventId || null,
    task_id: event.taskId || null,
    title: event.title,
    description: event.description || null,
    all_day: event.allDay || null,
    location: event.location || null,
    status: event.status || null,
    calendar_id: event.calendarId || null,
    recurrence: event.recurrence || null,
  };

  if (userId) {
    apiEvent.user_id = userId;
  }

  if ('id' in event) {
    apiEvent.id = event.id;
  }

  if (event.startTime) {
    apiEvent.start_time = event.startTime.toISOString();
  } else {
    apiEvent.start_time = null;
  }

  if (event.endTime) {
    apiEvent.end_time = event.endTime.toISOString();
  } else {
    apiEvent.end_time = null;
  }

  return apiEvent;
}

export function mapApiEmailSettingsToEmailSettings(apiSettings: APIEmailSettings): EmailSettings {
  const notificationPrefs = apiSettings.notification_preferences as Record<string, boolean> || {};
  
  return {
    id: apiSettings.id,
    userId: apiSettings.user_id,
    emailAddress: apiSettings.email_address || undefined,
    forwardAddress: apiSettings.forward_address || undefined,
    notificationPreferences: {
      taskAssignments: notificationPrefs.task_assignments ?? true,
      dueDates: notificationPrefs.due_dates ?? true,
      comments: notificationPrefs.comments ?? true
    },
    dailySummary: apiSettings.daily_summary ?? false,
    summaryTime: apiSettings.summary_time || undefined,
    createdAt: new Date(apiSettings.created_at),
    updatedAt: new Date(apiSettings.updated_at)
  };
}

export function mapEmailSettingsToApiEmailSettings(settings: UpdateEmailSettingsDTO, userId?: string): Partial<APIEmailSettings> {
  const apiSettings: Partial<APIEmailSettings> = {
    email_address: settings.emailAddress || null,
    forward_address: settings.forwardAddress || null,
    daily_summary: settings.dailySummary,
    summary_time: settings.summaryTime || null,
  };

  if (userId) {
    apiSettings.user_id = userId;
  }

  if (settings.notificationPreferences) {
    apiSettings.notification_preferences = {
      task_assignments: settings.notificationPreferences.taskAssignments,
      due_dates: settings.notificationPreferences.dueDates,
      comments: settings.notificationPreferences.comments
    };
  }

  return apiSettings;
}
