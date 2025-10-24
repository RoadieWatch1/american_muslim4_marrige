import { createClient } from '@supabase/supabase-js';


// Initialize Supabase client
// Using direct values from project configuration
const supabaseUrl = 'https://iqmfgvypxqtpqaxdajqt.supabase.co';
const supabaseKey = 'sb_publishable_fifyknmaM5T-5PcqSAEwCw_BPmKRAim';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };