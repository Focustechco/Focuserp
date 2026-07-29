const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lykwydydrctmjzcvugjd.supabase.co';
const supabaseAnonKey = 'sb_publishable_LtPtjXysCTL1qZB6E0VuvQ_CsZbTvUs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAllTables() {
    const list = ['focus_app_state', 'focusappstate', 'app_state', 'state', 'focus_state', 'focus_data'];
    for (const t of list) {
        const { data, error } = await supabase.from(t).select('*').limit(1);
        if (!error) {
            console.log(`FOUND TABLE: ${t}`, data);
        } else {
            console.log(`Table ${t} error:`, error.message, error.code);
        }
    }
}

checkAllTables();
