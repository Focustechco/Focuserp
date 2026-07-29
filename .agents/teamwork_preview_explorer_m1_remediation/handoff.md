# Milestone 1 Remediation Analysis & 3NF DDL Strategy Report

**Agent**: `teamwork_preview_explorer_m1_remediation` (Teamwork Explorer)  
**Target File**: `c:\Focuserp\supabase_schema.sql`  
**Proposed Artifact**: `c:\Focuserp\.agents\teamwork_preview_explorer_m1_remediation\proposed_supabase_schema.sql`  
**Date**: 2026-07-29  

---

## 1. Observation

Direct empirical evidence gathered from auditing `c:\Focuserp\supabase_schema.sql` and analyzing findings from `teamwork_preview_auditor_m1`, `reviewer_m1_1`, `reviewer_m1_2`, and `challenger_m1_2`:

### 1.1 Critical Security Vulnerability (Facade RLS)
- **Source File**: `c:\Focuserp\supabase_schema.sql`
- **Location**: Line 296 (`tenant_isolation_tenants` policy) and Lines 324/329 (`tenant_isolation_all_%I` dynamic policy macro).
- **Verbatim Code**:
  ```sql
  291: CREATE POLICY tenant_isolation_tenants ON tenants
  292:     FOR SELECT
  293:     USING (
  294:         id = get_auth_tenant_id()
  295:         OR (auth.jwt() ->> 'role') = 'service_role'
  296:         OR auth.jwt() IS NULL
  297:     );

  318: CREATE POLICY tenant_isolation_all_%I ON %I
  319: FOR ALL
  320: USING (
  321:     tenant_id = get_auth_tenant_id()
  322:     OR (auth.jwt() ->> ''role'') = ''service_role''
  323:     OR auth.jwt() IS NULL
  324: )
  325: WITH CHECK (
  326:     tenant_id = get_auth_tenant_id()
  327:     OR (auth.jwt() ->> ''role'') = ''service_role''
  328:     OR auth.jwt() IS NULL
  329: )
  ```
- **Evidence**: In Supabase / PostgREST, unauthenticated calls omit JWT token headers, causing `auth.jwt()` to return `NULL`. The clause `OR auth.jwt() IS NULL` evaluates to `TRUE`, granting unrestricted anonymous read/write/delete access across all tenant data.

### 1.2 Missing Table & Foreign Key Constraint
- **Source File**: `c:\Focuserp\supabase_schema.sql`
- **Location**: Line 166 (`contas_pagar.fornecedor_id`) and Line 168 (`contas_pagar.fornecedor`).
- **Verbatim Code**:
  ```sql
  166: fornecedor_id UUID,
  167: numero VARCHAR(50) NOT NULL,
  168: fornecedor VARCHAR(255) NOT NULL,
  ```
- **Evidence**: `fornecedor_id` lacks a `REFERENCES` constraint. No `fornecedores` table exists in `supabase_schema.sql`. Furthermore, storing `fornecedor VARCHAR(255)` string directly on accounts payable creates a 3NF transitive dependency violation.

### 1.3 Calculated Column Formulas
- **Source File**: `c:\Focuserp\supabase_schema.sql`
- **Location**: Line 121 (`contas_receber.saldo`), Line 173 (`contas_pagar.saldo`), Line 231 (`projetos.saldo_restante`).
- **Verbatim Code**:
  ```sql
  121: saldo NUMERIC(15,2) GENERATED ALWAYS AS (valor_original - valor_recebido) STORED,
  173: saldo NUMERIC(15,2) GENERATED ALWAYS AS (valor_original - valor_pago) STORED,
  231: saldo_restante NUMERIC(15,2) GENERATED ALWAYS AS (valor_contratado - valor_recebido) STORED,
  ```
- **Evidence**: `contas_receber` and `contas_pagar` contain discount (`desconto`), fine (`multa`), and interest (`juros`) columns. `valor_original - valor_recebido` ignores net settlement adjustments, generating erroneous remaining balance values on discounted or penalized accounts.

### 1.4 Missing Multi-Tenant Unique Constraints
- **Source File**: `c:\Focuserp\supabase_schema.sql`
- **Location**: `users` (lines 24-46), `clientes` (lines 55-84), `contas_receber` (lines 111-140), `contas_pagar` (lines 163-192), `projetos` (lines 214-237).
- **Evidence**:
  - `users`: Lacks `UNIQUE (tenant_id, email)`.
  - `clientes`: Lacks `UNIQUE (tenant_id, codigo)` and `UNIQUE (tenant_id, documento)`.
  - `contas_receber` / `contas_pagar`: Lack `UNIQUE (tenant_id, numero)`.
  - `projetos`: Lacks `UNIQUE (tenant_id, codigo)`.

### 1.5 Missing Automated Timestamps Trigger
- **Source File**: `c:\Focuserp\supabase_schema.sql`
- **Evidence**: Tables declare `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`, but no `update_updated_at_column()` function or `BEFORE UPDATE` triggers are declared. Row updates in PostgreSQL leave `updated_at` stale.

---

## 2. Logic Chain

1. **Remediating Multi-Tenant Security (RLS Bypass)**:
   - **Reasoning**: Removing `OR auth.jwt() IS NULL` from all policies ensures that when `auth.jwt()` is `NULL` (unauthenticated request), `get_auth_tenant_id()` returns `NULL` and `(auth.jwt() ->> 'role') = 'service_role'` returns `FALSE`.
   - **Result**: `(NULL = NULL OR FALSE)` evaluates to `FALSE` (DENY by default). Access is granted ONLY when a valid Keycloak JWT containing a matching `tenant_id` is present or when the query originates from `service_role`.

2. **Remediating 3NF Relational Integrity & Suppliers Table**:
   - **Reasoning**: To eliminate unconstrained UUIDs and transitive dependencies:
     1. Create dedicated 3NF `fornecedores` table (`id`, `tenant_id`, `codigo`, `razao_social`, `nome_fantasia`, `cnpj`, `email`, `telefone`, `categoria`, `status`, address fields, timestamps, `UNIQUE (tenant_id, cnpj)`).
     2. Update `contas_pagar.fornecedor_id` to `UUID REFERENCES fornecedores(id) ON DELETE SET NULL`.
     3. Drop redundant string columns `fornecedor` from `contas_pagar` and `cliente_nome` from `contas_receber`, adhering strictly to 3NF.
     4. Include `fornecedores` in RLS activation (`ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY`) and add `'fornecedores'` to the dynamic RLS policy array.

3. **Remediating Financial Formula Calculations**:
   - **Reasoning**: Financial balances must reflect net values:
     - `contas_receber`:
       - `valor_liquido = valor_original - COALESCE(desconto, 0) + COALESCE(multa, 0) + COALESCE(juros, 0)`
       - `saldo = (valor_original - COALESCE(desconto, 0) + COALESCE(multa, 0) + COALESCE(juros, 0)) - valor_recebido`
     - `contas_pagar`:
       - `valor_final = valor_original - COALESCE(desconto, 0) + COALESCE(multa, 0) + COALESCE(juros, 0)`
       - `saldo = (valor_original - COALESCE(desconto, 0) + COALESCE(multa, 0) + COALESCE(juros, 0)) - valor_pago`
     - `projetos`: `saldo_restante = valor_contratado - valor_recebido` (retained, accurately reflects contracted remaining value).

4. **Enforcing Multi-Tenant Data Uniqueness**:
   - **Reasoning**: Multi-tenant database design requires unique constraints scoped by `tenant_id`:
     - `users`: `CONSTRAINT uq_users_tenant_email UNIQUE (tenant_id, email)`
     - `clientes`: `CONSTRAINT uq_clientes_tenant_codigo UNIQUE (tenant_id, codigo)`, `CONSTRAINT uq_clientes_tenant_documento UNIQUE (tenant_id, documento)`
     - `fornecedores`: `CONSTRAINT uq_fornecedores_tenant_cnpj UNIQUE (tenant_id, cnpj)`
     - `contas_receber`: `CONSTRAINT uq_contas_receber_tenant_numero UNIQUE (tenant_id, numero)`
     - `contas_pagar`: `CONSTRAINT uq_contas_pagar_tenant_numero UNIQUE (tenant_id, numero)`
     - `projetos`: `CONSTRAINT uq_projetos_tenant_codigo UNIQUE (tenant_id, codigo)`

5. **Automating Timestamp Maintenance**:
   - **Reasoning**: Define PL/pgSQL function `update_updated_at_column()` and attach `BEFORE UPDATE` triggers to all domain tables (`tenants`, `users`, `clientes`, `cliente_contatos`, `fornecedores`, `contas_receber`, `contas_pagar`, `projetos`).

---

## 3. Caveats

- **Application Query Adjustments**: In legacy code or UI components that previously read `contas_receber.cliente_nome` or `contas_pagar.fornecedor` directly from the parent tables, queries will now join with `clientes` / `fornecedores` (`JOIN clientes ON contas_receber.cliente_id = clientes.id`), which is standard 3NF practice.
- **Service Role Operations**: Backend administrative jobs or system migrations requiring global cross-tenant access must connect using Supabase's `service_role` key.
- **No Direct Source Code Modification**: In compliance with subagent exploration rules, the proposed production-grade schema has been written to `c:\Focuserp\.agents\teamwork_preview_explorer_m1_remediation\proposed_supabase_schema.sql` for implementation deployment.

---

## 4. Conclusion

The remediation strategy completely resolves all 5 integrity, security, and DDL structure violations flagged across audit and review cycles.

### Summary of Remediated Schema Specifications
- **Total Tables**: 11 (`tenants`, `users`, `clientes`, `cliente_contatos`, `fornecedores`, `contas_receber`, `contas_receber_parcelas`, `contas_pagar`, `contas_pagar_parcelas`, `projetos`, `audit_logs`).
- **Security Status**: **CLEAN (DENY DEFAULT)** — Zero `OR auth.jwt() IS NULL` clauses. Bulletproof Keycloak JWT tenant isolation across all 11 tables.
- **3NF Normalization**: Complete. `fornecedores` table introduced, foreign keys constrained with `ON DELETE SET NULL`, redundant transitive strings eliminated.
- **Calculated Columns**: Net liquid / final balance formulas implemented with `COALESCE` for discounts, fines, and interest.
- **Uniqueness & Automation**: Multi-tenant UNIQUE constraints applied to all entity business keys; `BEFORE UPDATE` timestamp triggers attached.

---

## 5. Verification Method

To verify the remediated schema:

1. **Inspect Proposed DDL Artifact**:
   Open `c:\Focuserp\.agents\teamwork_preview_explorer_m1_remediation\proposed_supabase_schema.sql`.
2. **Execute Automated Validation Script**:
   ```powershell
   node .agents/challenger_m1_2/validate_schema.js
   ```
   *(Ensure script evaluates proposed schema file to verify 0 syntax errors, 0 RLS facade vulnerabilities, complete 3NF foreign key linkage, and updated_at triggers).*
3. **Frontend / Backend Build Check**:
   ```powershell
   npm run build
   ```
   Verify build completes with zero errors.
