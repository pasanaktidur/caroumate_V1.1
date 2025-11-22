
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qkimqxkskyzacosejrew.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFraW1xeGtza3l6YWNvc2VqcmV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NDYyNDMsImV4cCI6MjA3OTQyMjI0M30.tFcI06JyFw5NNZNL2rYXWEXG1l_08l-ZRaH_yH7kP3Q';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
