const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

const supabaseUrl = 'https://lykwydydrctmjzcvugjd.supabase.co';
const supabaseAnonKey = 'sb_publishable_LtPtjXysCTL1qZB6E0VuvQ_CsZbTvUs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkContractsCols() {
    const cols = ['id', 'title', 'contract_number', 'value', 'status', 'client_id', 'created_at', 'start_date', 'end_date'];
    for (const col of cols) {
        const payload = { id: randomUUID() };
        payload[col] = 'test';
        const { error } = await supabase.from('contracts').insert(payload);
        if (error) {
            console.log(`Contract col '${col}' error:`, error.message);
        } else {
            console.log(`✅ Contract col '${col}' IS VALID!`);
        }
    }
}

checkContractsCols();
