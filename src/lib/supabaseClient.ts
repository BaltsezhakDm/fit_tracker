import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zstvuwgcubxncubrpkkm.supabase.co';
const supabaseKey = 'sb_publishable_mNCYNvbqPsR7BXrDywWbCw_xnUIVYOJ';

export const supabase = createClient(supabaseUrl, supabaseKey);
