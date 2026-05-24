
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/*const supabaseUrl = "https://anxpshgcdxeocwqryjrp.supabase.co";
const supabaseAnonKey = "sb_publishable_t1NZI00h01h3c21Y5oxM2A_TInArZSa";*/

export const supabase = createClient(supabaseUrl, supabaseAnonKey);