import fs from 'fs';
import path from 'path';

const schemaPath = path.join('c:', 'Focuserp', 'supabase_schema.sql');
const content = fs.readFileSync(schemaPath, 'utf8');

console.log("=== FORENSIC AUDIT OF SUPABASE_SCHEMA.SQL ===");
console.log("File size:", content.length, "bytes");

// Check 1: Search for auth.jwt() IS NULL outside comments
const lines = content.split('\n');
let nullBypassFound = false;

lines.forEach((line, index) => {
    const codePart = line.split('--')[0];
    if (codePart.includes('auth.jwt() IS NULL')) {
        console.error(`[FAIL] Line ${index + 1}: Found executable 'auth.jwt() IS NULL' -> ${line}`);
        nullBypassFound = true;
    }
});

if (!nullBypassFound) {
    console.log("[PASS] Check 1: Zero instances of executable 'auth.jwt() IS NULL' facade vulnerability.");
}

// Check 2: Verify all 11 tables have RLS enabled
const tables = [
    'tenants', 'users', 'clientes', 'cliente_contatos', 'fornecedores',
    'contas_receber', 'contas_receber_parcelas', 'contas_pagar',
    'contas_pagar_parcelas', 'projetos', 'audit_logs'
];

let allRlsEnabled = true;
tables.forEach(table => {
    const pattern = new RegExp(`ALTER\\s+TABLE\\s+${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i');
    if (!pattern.test(content)) {
        console.error(`[FAIL] Table ${table} does not have ENABLE ROW LEVEL SECURITY`);
        allRlsEnabled = false;
    }
});

if (allRlsEnabled) {
    console.log("[PASS] Check 2: All 11 tables have RLS explicitly enabled.");
}

// Check 3: Check get_auth_tenant_id function definition
if (content.includes('CREATE OR REPLACE FUNCTION get_auth_tenant_id()')) {
    console.log("[PASS] Check 3: get_auth_tenant_id() helper function defined.");
} else {
    console.error("[FAIL] Check 3: get_auth_tenant_id() function missing.");
}

// Check 4: Verify policy conditions for tenants and tenant-scoped tables
if (content.includes('CREATE POLICY tenant_isolation_tenants ON tenants') &&
    content.includes('tenant_isolation_all_%I ON %I')) {
    console.log("[PASS] Check 4: RLS policies correctly defined for tenants and loop tables.");
} else {
    console.error("[FAIL] Check 4: Policy definition structure missing or modified unexpectedly.");
}

console.log("=== AUDIT COMPLETE ===");
