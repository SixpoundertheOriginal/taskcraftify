// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://oglcdlzomfuoyeqeobal.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nbGNkbHpvbWZ1b3llcWVvYmFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3NTI4MzIsImV4cCI6MjA1ODMyODgzMn0.wqi138Ap4i8p17wBcVa2hPwhlpqjXPC8nzCa8lSQEkI";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);