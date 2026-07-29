const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lykwydydrctmjzcvugjd.supabase.co';
const supabaseAnonKey = 'sb_publishable_LtPtjXysCTL1qZB6E0VuvQ_CsZbTvUs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
    const candidateTables = [
        'clients', 'projects', 'tasks', 'contracts', 'notifications',
        'financial_records', 'accounts', 'users', 'user_notifications',
        'app_state', 'focus_app_state', 'focus_notificacoes'
    ];

    for (const tbl of candidateTables) {
        const { data, error } = await supabase.from(tbl).select('*').limit(1);
        if (error) {
            console.log(`Table '${tbl}':`, error.message);
        } else {
            console.log(`✅ Table '${tbl}' EXISTS! Row count:`, data.length);
        }
    }
}

checkTables();
