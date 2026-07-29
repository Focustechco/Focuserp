import fs from 'fs';
import path from 'path';

const sqlPath = path.resolve('c:/Focuserp/supabase_schema.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf8');

console.log("=== EMPIRICAL SQL DDL & SECURITY VALIDATION ===");

// 1. Basic syntax checks (balanced parens and quotes)
let openParens = 0;
let inString = false;
let stringChar = '';

for (let i = 0; i < sqlContent.length; i++) {
  const char = sqlContent[i];
  if (inString) {
    if (char === stringChar) {
      if (i > 0 && sqlContent[i - 1] === '\\') {
        // escaped
      } else {
        inString = false;
      }
    }
  } else {
    if (char === "'" || char === '"') {
      inString = true;
      stringChar = char;
    } else if (char === '(') {
      openParens++;
    } else if (char === ')') {
      openParens--;
    }
  }
}

console.log(`Balanced Parentheses Check: ${openParens === 0 ? 'PASS (0 open parens)' : 'FAIL (' + openParens + ' unbalanced parens)'}`);

// 2. Extract tables defined
const createTableRegex = /CREATE TABLE IF NOT EXISTS\s+([a-z0-9_]+)\s*\(([\s\S]*?)\);/gi;
const tables = [];
let match;

while ((match = createTableRegex.exec(sqlContent)) !== null) {
  const tableName = match[1];
  const body = match[2];
  tables.push({ tableName, body });
}

console.log(`Tables detected (${tables.length}): ${tables.map(t => t.tableName).join(', ')}`);

// 3. Foreign Key Targets Check
const fkRegex = /([a-z0-9_]+)\s+UUID.*REFERENCES\s+([a-z0-9_]+)\s*\(([a-z0-9_]+)\)/gi;
let fkMatch;
const fks = [];
while ((fkMatch = fkRegex.exec(sqlContent)) !== null) {
  fks.push({ col: fkMatch[1], targetTable: fkMatch[2], targetCol: fkMatch[3] });
}

const tableNamesSet = new Set(tables.map(t => t.tableName));
console.log("\nForeign Key References:");
fks.forEach(fk => {
  const exists = tableNamesSet.has(fk.targetTable);
  console.log(` - FK column ${fk.col} -> ${fk.targetTable}(${fk.targetCol}): ${exists ? 'VALID' : 'INVALID TARGET TABLE MISSING!'}`);
});

// Check for unconstrained ID fields (e.g. fornecedor_id)
tables.forEach(t => {
  const lines = t.body.split('\n');
  lines.forEach(line => {
    if (line.includes('_id UUID') && !line.includes('REFERENCES') && !line.includes('PRIMARY KEY')) {
      console.log(` - WARNING: Table '${t.tableName}' column '${line.trim()}' has no REFERENCES constraint!`);
    }
  });
});

// 4. 3NF Violation Checks
console.log("\n3NF Structural Analysis:");
tables.forEach(t => {
  if (t.tableName === 'contas_receber') {
    if (t.body.includes('cliente_id') && t.body.includes('cliente_nome')) {
      console.log(" - VIOLATION (3NF): 'contas_receber' stores both 'cliente_id' and 'cliente_nome' (transitive dependency: cliente_id -> cliente_nome).");
    }
  }
  if (t.tableName === 'contas_pagar') {
    if (t.body.includes('fornecedor_id') && t.body.includes('fornecedor')) {
      console.log(" - VIOLATION (3NF): 'contas_pagar' has 'fornecedor_id' without foreign key and stores raw 'fornecedor' string.");
    }
  }
});

// 5. Unique Constraints Multi-tenant check
console.log("\nMulti-Tenant Data Integrity Analysis:");
tables.forEach(t => {
  if (t.tableName === 'clientes') {
    const hasUniqueTenantCodigo = t.body.includes('UNIQUE') && t.body.includes('tenant_id');
    console.log(` - 'clientes' tenant unique constraints (codigo / documento): ${hasUniqueTenantCodigo ? 'PRESENT' : 'MISSING (codigo/documento can be duplicated per tenant without UNIQUE constraint!)'}`);
  }
  if (t.tableName === 'users') {
    const hasTenantEmailUnique = t.body.includes('UNIQUE(tenant_id, email)') || t.body.includes('UNIQUE (tenant_id, email)');
    console.log(` - 'users' (tenant_id, email) unique constraint: ${hasTenantEmailUnique ? 'PRESENT' : 'MISSING (email is NOT constrained unique per tenant!)'}`);
  }
});

// 6. RLS Policy Security Analysis
console.log("\nRLS Security Analysis:");
if (sqlContent.includes('auth.jwt() IS NULL')) {
  console.log(" - CRITICAL SECURITY VULNERABILITY FOUND: RLS policies contain 'auth.jwt() IS NULL'. This allows completely unauthenticated (anonymous) requests to pass RLS checks and access/modify all tenant data!");
} else {
  console.log(" - RLS auth.jwt() check is secure.");
}

// 7. Check for updated_at Triggers
console.log("\nTrigger & Maintenance Analysis:");
const hasTrigger = sqlContent.includes('CREATE TRIGGER') || sqlContent.includes('BEFORE UPDATE');
console.log(` - Automatic updated_at trigger: ${hasTrigger ? 'PRESENT' : 'MISSING (updated_at columns will NOT update automatically on UPDATE statements!)'}`);
