const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lykwydydrctmjzcvugjd.supabase.co';
const supabaseAnonKey = 'sb_publishable_LtPtjXysCTL1qZB6E0VuvQ_CsZbTvUs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanTestRow() {
    const { error } = await supabase.from('clients').delete().eq('id', '00000000-0000-4000-a000-000000000001');
    console.log('Clean test row result:', error?.message || 'Deleted successfully');
}

cleanTestRow();
