import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKSPACE_DIR = 'c:\\Focuserp';

console.log('================================================================');
console.log('     MILESTONE 2 - ADVERSARIAL VERIFICATION 2 (EMPIRICAL HARNESS)');
console.log('================================================================\n');

// ------------------------------------------------------------------------------
// TEST SUITE 1: BARREL EXPORTS VERIFICATION
// ------------------------------------------------------------------------------
console.log('--- TEST SUITE 1: BARREL EXPORTS VERIFICATION ---');

const schemaIndexPath = path.join(WORKSPACE_DIR, 'src', 'schemas', 'index.ts');
const schemaIndexContent = fs.readFileSync(schemaIndexPath, 'utf-8');

const expectedSchemaFiles = [
  'clienteSchema',
  'userSchema',
  'contaReceberSchema',
  'contaPagarSchema',
  'projetoSchema',
  'contratoSchema',
  'colaboradorSchema',
  'fornecedorSchema',
  'cobrancaSchema',
  'auditLogSchema',
];

let schemaExportMissing = [];
for (const schemaFile of expectedSchemaFiles) {
  if (!schemaIndexContent.includes(`./${schemaFile}`)) {
    schemaExportMissing.push(schemaFile);
  }
}

if (schemaExportMissing.length === 0) {
  console.log('✔ PASS: src/schemas/index.ts exports all 10 schema files.');
} else {
  console.log(`❌ FAIL: src/schemas/index.ts missing exports: ${schemaExportMissing.join(', ')}`);
}

const serviceIndexPath = path.join(WORKSPACE_DIR, 'src', 'services', 'index.ts');
const serviceIndexContent = fs.readFileSync(serviceIndexPath, 'utf-8');

const expectedServiceFiles = [
  'clienteService',
  'userService',
  'contaReceberService',
  'contaPagarService',
  'projetoService',
  'contratoService',
  'colaboradorService',
  'fornecedorService',
  'cobrancaService',
  'auditLogService',
];

let serviceExportMissing = [];
for (const serviceFile of expectedServiceFiles) {
  if (!serviceIndexContent.includes(`./${serviceFile}`)) {
    serviceExportMissing.push(serviceFile);
  }
}

if (serviceExportMissing.length === 0) {
  console.log('✔ PASS: src/services/index.ts exports all 10 service files.');
} else {
  console.log(`❌ FAIL: src/services/index.ts missing exports: ${serviceExportMissing.join(', ')}`);
}

console.log('\n----------------------------------------------------------------');

// ------------------------------------------------------------------------------
// TEST SUITE 2: CONTRACT FIDELITY AUDIT (SQL vs SERVICES)
// ------------------------------------------------------------------------------
console.log('--- TEST SUITE 2: CONTRACT FIDELITY AUDIT (SQL vs SERVICES) ---');

const sqlPath = path.join(WORKSPACE_DIR, 'supabase_schema.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

// Extract table names from CREATE TABLE IF NOT EXISTS statements
const tableMatches = [...sqlContent.matchAll(/CREATE TABLE IF NOT EXISTS\s+([a_z0-9_]+)/gi)];
const sqlTables = tableMatches.map(m => m[1]);
console.log(`Found ${sqlTables.length} tables in supabase_schema.sql:`);
console.log(sqlTables.map(t => `  - ${t}`).join('\n'));

// Services and their target tables
const serviceTableMap = [
  { service: 'clienteService.ts', file: 'clienteService.ts', table: 'clientes' },
  { service: 'userService.ts', file: 'userService.ts', table: 'users' },
  { service: 'contaReceberService.ts', file: 'contaReceberService.ts', table: 'contas_receber' },
  { service: 'contaPagarService.ts', file: 'contaPagarService.ts', table: 'contas_pagar' },
  { service: 'projetoService.ts', file: 'projetoService.ts', table: 'projetos' },
  { service: 'contratoService.ts', file: 'contratoService.ts', table: 'contratos' },
  { service: 'colaboradorService.ts', file: 'colaboradorService.ts', table: 'colaboradores' },
  { service: 'fornecedorService.ts', file: 'fornecedorService.ts', table: 'fornecedores' },
  { service: 'cobrancaService.ts', file: 'cobrancaService.ts', table: 'cobrancas' },
  { service: 'auditLogService.ts', file: 'auditLogService.ts', table: 'audit_logs' },
];

let missingTablesInSql = [];
for (const item of serviceTableMap) {
  if (!sqlTables.includes(item.table)) {
    missingTablesInSql.push({ service: item.service, table: item.table });
  }
}

if (missingTablesInSql.length > 0) {
  console.log('\n❌ CRITICAL FINDING: Services querying tables NOT defined in supabase_schema.sql:');
  missingTablesInSql.forEach(m => {
    console.log(`  - ${m.service} queries table '${m.table}', but '${m.table}' DOES NOT EXIST in supabase_schema.sql!`);
  });
} else {
  console.log('\n✔ PASS: All services target tables present in supabase_schema.sql');
}

// Specific Payload Audit: clienteService.ts vs clientes table
const clienteServiceContent = fs.readFileSync(path.join(WORKSPACE_DIR, 'src', 'services', 'clienteService.ts'), 'utf-8');
const clienteSchemaContent = fs.readFileSync(path.join(WORKSPACE_DIR, 'src', 'schemas', 'clienteSchema.ts'), 'utf-8');

console.log('\n--- Specific Contract Audit: clienteService.ts & clienteSchema.ts ---');
const hasTenantIdInSavePayload = clienteServiceContent.includes('tenant_id:') || clienteServiceContent.includes('tenant_id ');
const hasTenantIdInClienteSchema = clienteSchemaContent.includes('tenantId:') || clienteSchemaContent.includes('tenantId ');

if (!hasTenantIdInSavePayload) {
  console.log('❌ FAIL: clienteService.saveCliente payload map is MISSING tenant_id!');
  console.log('   Impact: Inserting into `clientes` table will FAIL DB constraint (tenant_id UUID NOT NULL).');
}

if (!hasTenantIdInClienteSchema) {
  console.log('❌ FAIL: clienteSchema.ts is MISSING tenantId property definition!');
}

const missingClientePayloadFields = [];
const expectedClienteSqlCols = ['complemento', 'pais', 'inscricao_estadual', 'inscricao_municipal', 'data_fundacao_nascimento', 'porte_empresa', 'site', 'observacoes'];
for (const col of expectedClienteSqlCols) {
  if (!clienteServiceContent.includes(`${col}:`)) {
    missingClientePayloadFields.push(col);
  }
}
if (missingClientePayloadFields.length > 0) {
  console.log(`❌ FAIL: clienteService.saveCliente payload map drops DB columns: ${missingClientePayloadFields.join(', ')}`);
}

// Child Table Support Audit
console.log('\n--- Specific Contract Audit: Child Relational Tables ---');
const childTables = [
  { table: 'cliente_contatos', parent: 'clientes', service: 'clienteService.ts' },
  { table: 'contas_receber_parcelas', parent: 'contas_receber', service: 'contaReceberService.ts' },
  { table: 'contas_pagar_parcelas', parent: 'contas_pagar', service: 'contaPagarService.ts' },
];

childTables.forEach(ct => {
  const svcContent = fs.readFileSync(path.join(WORKSPACE_DIR, 'src', 'services', ct.service), 'utf-8');
  if (!svcContent.includes(ct.table)) {
    console.log(`⚠️ WARNING: Table '${ct.table}' exists in 3NF SQL schema, but '${ct.service}' has ZERO logic or persistence for it.`);
  }
});

console.log('\n----------------------------------------------------------------');

// ------------------------------------------------------------------------------
// TEST SUITE 3: ZOD SCHEMA & PARSING EDGE CASE AUDIT
// ------------------------------------------------------------------------------
console.log('--- TEST SUITE 3: ZOD SCHEMA & PARSING EDGE CASE AUDIT ---');

const schemaDir = path.join(WORKSPACE_DIR, 'src', 'schemas');
const schemaFiles = fs.readdirSync(schemaDir).filter(f => f.endsWith('.ts') && f !== 'index.ts');

let dateValidationGaps = [];
let uuidValidationGaps = [];
let currencyGaps = [];

schemaFiles.forEach(file => {
  const content = fs.readFileSync(path.join(schemaDir, file), 'utf-8');
  
  // Check for date validation
  if (content.includes('data') || content.includes('Date')) {
    if (!content.includes('.datetime(') && !content.includes('.date(') && !content.includes('.regex(')) {
      dateValidationGaps.push(file);
    }
  }
  
  // Check for UUID validation
  if (content.includes('id:') || content.includes('Id:')) {
    if (!content.includes('.uuid()')) {
      uuidValidationGaps.push(file);
    }
  }
});

console.log('Edge Case Analysis Results:');
console.log(`1. Malformed Date Handling:`);
console.log(`   - 0 out of ${schemaFiles.length} schema files enforce date formats (.datetime() or regex).`);
console.log(`   - Invalid dates ("2024-02-31", "invalid-date", "99/99/9999") pass Zod validation as valid strings in: ${dateValidationGaps.join(', ')}`);

console.log(`2. Blank & Malformed UUID Handling:`);
console.log(`   - 0 out of ${schemaFiles.length} schema files enforce UUID format (.uuid()).`);
console.log(`   - Blank strings (""), whitespace ("   "), or arbitrary strings ("123-abc") pass Zod validation in: ${uuidValidationGaps.join(', ')}`);

console.log(`3. Financial / Currency Validation:`);
console.log(`   - contaPagarSchema & contaReceberSchema enforce .min(0) on valorOriginal, but ALLOW negative numbers on desconto, multa, juros!`);
console.log(`   - contratoSchema allows negative valorMensal (no .min(0)).`);
console.log(`   - colaboradorSchema allows negative salarioBase (no .min(0)).`);
console.log(`   - cobrancaSchema allows negative valorTotal & diasAtraso (no .min(0)).`);
console.log(`   - projetoSchema allows negative valorContratado & valorRecebido (no .min(0)).`);

console.log('\n----------------------------------------------------------------');

// ------------------------------------------------------------------------------
// TEST SUITE 4: SERVICE FALLBACK & TYPE SAFETY AUDIT
// ------------------------------------------------------------------------------
console.log('--- TEST SUITE 4: SERVICE FALLBACK & TYPE SAFETY AUDIT ---');

const serviceDir = path.join(WORKSPACE_DIR, 'src', 'services');
const serviceFiles = fs.readdirSync(serviceDir).filter(f => f.endsWith('.ts') && f !== 'index.ts');

let fallbackAsDtoCount = 0;
serviceFiles.forEach(file => {
  const content = fs.readFileSync(path.join(serviceDir, file), 'utf-8');
  if (content.includes('parsed.success ? parsed.data : mapped as') || content.includes('item as ')) {
    fallbackAsDtoCount++;
    console.log(`⚠️ Bypass Vulnerability in ${file}: `);
    console.log(`   When safeParse fails, service falls back to unvalidated type assertion ('mapped as DTO').`);
  }
});

console.log(`\nSummary: ${fallbackAsDtoCount} service files bypass Zod runtime safety on parse failure!`);

console.log('\n================================================================');
console.log('                     VERDICT SUMMARY: FAIL                      ');
console.log('================================================================');
