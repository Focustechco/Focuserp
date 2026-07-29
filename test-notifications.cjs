const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lykwydydrctmjzcvugjd.supabase.co';
const supabaseAnonKey = 'sb_publishable_LtPtjXysCTL1qZB6E0VuvQ_CsZbTvUs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function discoverNotifCols3() {
    const cols = ['text', 'message', 'description', 'category', 'type', 'url', 'link', 'target_url', 'entity_id', 'source'];
    for (const col of cols) {
        const payload = { created_at: new Date().toISOString() };
        payload[col] = 'test';
        const { error } = await supabase.from('notifications').insert(payload);
        if (error) {
            console.log(`Col '${col}' error:`, error.message);
        } else {
            console.log(`✅ Col '${col}' IS VALID!`);
        }
    }
}

discoverNotifCols3();
