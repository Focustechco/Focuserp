# Handoff Report: Review of Milestone 1 Database Architecture & DDL (`supabase_schema.sql`)

## 1. Observation

### 1.1 Reviewed File & Context
- **Target File**: `c:\Focuserp\supabase_schema.sql` (333 lines).
- **Specification Source**: `c:\Focuserp\.agents\teamwork_preview_explorer_m1\handoff.md` & `c:\Focuserp\.agents\orchestrator\PROJECT.md`.
- **Review Scope**: Correctness, 3NF normalization, foreign key cascade rules, index coverage, `get_auth_tenant_id()` function implementation, and multi-tenant RLS security policies.

### 1.2 Structural & DDL Findings
- **Tables Implemented (10 Total)**:
  1. `tenants`: Primary tenant registry with UUID PK.
  2. `users`: Keycloak/Supabase auth mapping table linked to `tenants` via `tenant_id`.
  3. `clientes`: Client records with embedded address attributes.
  4. `cliente_contatos`: 1:N contacts linked to `clientes` via `cliente_id`.
  5. `contas_receber`: Accounts receivable with generated `saldo` column (`valor_original - valor_recebido`).
  6. `contas_receber_parcelas`: Receivable installments linked to `contas_receber`.
  7. `contas_pagar`: Accounts payable with generated `saldo` column (`valor_original - valor_pago`).
  8. `contas_pagar_parcelas`: Payable installments linked to `contas_pagar`.
  9. `projetos`: Projects with generated `saldo_restante` column (`valor_contratado - valor_recebido`).
  10. `audit_logs`: Audit trail table with JSONB details.

- **Foreign Key Cascade Strategies**:
  - `tenant_id`: `ON DELETE CASCADE` across all 9 domain tables.
  - `cliente_id`: `ON DELETE CASCADE` on `cliente_contatos`; `ON DELETE SET NULL` on `contas_receber` and `projetos`.
  - `conta_receber_id` & `conta_pagar_id`: `ON DELETE CASCADE` on installment tables.
  - `user_id`: `ON DELETE SET NULL` on `audit_logs`.

- **Index Coverage**:
  - 20 total index statements.
  - Includes tenant indexes on all domain tables (`idx_users_tenant`, `idx_clientes_tenant`, `idx_cliente_contatos_tenant`, `idx_contas_receber_tenant`, `idx_cr_parcelas_tenant`, `idx_contas_pagar_tenant`, `idx_cp_parcelas_tenant`, `idx_projetos_tenant`, `idx_audit_logs_tenant`).
  - Worker M1 proactively added missing tenant indexes on `cliente_contatos`, `contas_receber_parcelas`, and `contas_pagar_parcelas` compared to Explorer M1's draft.

- **Helper Function `get_auth_tenant_id()`**:
  - Standard PostgreSQL function defined with `STABLE SECURITY DEFINER`.
  - Uses `NULLIF(auth.jwt() ->> 'tenant_id', '')::uuid` with exception block `EXCEPTION WHEN OTHERS THEN RETURN NULL;`.

- **RLS Policies**:
  - RLS enabled on all 10 tables.
  - Dynamic `DO` block creates `tenant_isolation_all_<tbl>` FOR ALL USING and WITH CHECK:
    `tenant_id = get_auth_tenant_id() OR (auth.jwt() ->> 'role') = 'service_role' OR auth.jwt() IS NULL`.

---

## 2. Logic Chain

1. **Schema Correctness & 3NF Normalization**:
   - Every domain entity maps to a dedicated 3NF relation.
   - Multivalued arrays from legacy models (e.g. contacts, payment installments) are normalized into child tables (`cliente_contatos`, `contas_receber_parcelas`, `contas_pagar_parcelas`).
   - Calculated financial fields (`saldo`, `saldo_restante`) use PostgreSQL `GENERATED ALWAYS AS (...) STORED` columns, eliminating state drift.

2. **Foreign Key Cascade Integrity**:
   - `ON DELETE CASCADE` on `tenant_id` ensures atomic deletion of all organization data when a tenant is removed.
   - `ON DELETE SET NULL` on `cliente_id` (in receivables and projects) preserves historical accounting and project audit trails even if a client record is deleted.

3. **Index Efficiency**:
   - Indexing `tenant_id` on every table ensures fast query execution under PostgreSQL Row-Level Security.
   - Composite indexes (`idx_clientes_documento`, `idx_contas_receber_status`, `idx_contas_pagar_status`) optimize common lookup patterns in the frontend.

4. **Multi-Tenant RLS Security Flaw (Adversarial Assessment)**:
   - Inclusion of `OR auth.jwt() IS NULL` in the RLS policies creates a major multi-tenant isolation vulnerability.
   - In Supabase PostgREST, anonymous HTTP requests (or requests using the `anon` key without a Keycloak JWT bearer header) result in `auth.jwt()` returning `NULL`.
   - Because `auth.jwt() IS NULL` evaluates to `TRUE`, any anonymous client can query, modify, or delete all rows across all tenants, bypassing multi-tenant isolation entirely.

---

## 3. Caveats

- **No Live PostgreSQL Execution**: Verification was performed via static SQL analysis, DDL constraint checking, and specification alignment, as no live Supabase server instance is running locally.
- **`fornecedor_id` Constraint**: `contas_pagar.fornecedor_id` is an unconstrained UUID column in M1, matching Explorer M1 specifications where supplier names are handled as free-text strings (`fornecedor VARCHAR(255)`).

---

## 4. Conclusion & Review Report

**Verdict**: REQUEST_CHANGES (Major Security Finding)

### Findings

#### [Major / Security] Finding 1: Multi-Tenant RLS Bypass via `OR auth.jwt() IS NULL`
- **What**: RLS policies on `tenants` and all 9 domain tables include `OR auth.jwt() IS NULL` in `USING` and `WITH CHECK` conditions.
- **Where**: `supabase_schema.sql`, line 296 (`tenant_isolation_tenants`) and lines 382-386 (`tenant_isolation_all_<tbl>`).
- **Why**: In Supabase PostgREST, requests without a valid JWT bearer token result in `auth.jwt()` returning `NULL`. Evaluating `auth.jwt() IS NULL` as `TRUE` permits unauthenticated clients to read, write, and delete data across all tenants.
- **Suggestion**: Update RLS policies to strictly require valid tenant matching or `service_role`:
  ```sql
  CREATE POLICY tenant_isolation_all_%I ON %I
  FOR ALL
  USING (
      tenant_id = get_auth_tenant_id()
      OR (auth.jwt() ->> 'role') = 'service_role'
  )
  WITH CHECK (
      tenant_id = get_auth_tenant_id()
      OR (auth.jwt() ->> 'role') = 'service_role'
  );
  ```

#### [Minor / Design] Finding 2: Unconstrained `contas_pagar.fornecedor_id`
- **What**: `fornecedor_id UUID` lacks `REFERENCES` constraint.
- **Where**: `supabase_schema.sql`, line 166.
- **Why**: Currently intentional for M1, but should be noted for future milestones when a suppliers table is introduced.

### Verified Claims
- **3NF Data Normalization**: 10 tables, proper FK relationships, generated columns -> **PASS**
- **FK Cascade Rules**: Cascade on tenant/child tables, SET NULL on historical entity links -> **PASS**
- **Index Coverage**: 20 indexes covering all tenant IDs, composite filters, and FKs -> **PASS**
- **`get_auth_tenant_id()` Helper**: Exception-safe `STABLE SECURITY DEFINER` function -> **PASS**
- **Integrity Compliance**: Genuine DDL, zero hardcoded cheat results or dummy facades -> **PASS**

---

## 5. Verification Method

1. **Static DDL Analysis**: Inspected table definitions, FK constraints, generated columns, and index statements in `c:\Focuserp\supabase_schema.sql`.
2. **Specification Audit**: Cross-referenced `supabase_schema.sql` against `explorer_m1/handoff.md` and `PROJECT.md`.
3. **Adversarial Security Evaluation**: Evaluated RLS policies under unauthenticated PostgREST execution scenarios (`auth.jwt() IS NULL`).
