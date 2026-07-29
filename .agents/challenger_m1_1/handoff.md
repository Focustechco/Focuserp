# Adversarial Handoff Report — challenger_m1_1

## 1. Observation

Adversarial empirical testing of `c:\Focuserp\supabase_schema.sql` was conducted using a dedicated PostgreSQL 18.4 Docker test harness (`c:\Focuserp\.agents\challenger_m1_1\test_schema.py`). The findings are backed by execution output:

1. **SQL Syntax & DDL Loading**:
   - `supabase_schema.sql` executes cleanly without SQL syntax errors. All 10 tables, indexes, helper functions, and RLS policies are created.

2. **RLS Policy Bypass (`auth.jwt() IS NULL`)**:
   - Schema lines 291–297 and 318–331 define RLS policies with `OR auth.jwt() IS NULL`.
   - **Empirical Result**: Querying `clientes`, `users`, and `tenants` as non-superuser role `authenticated` with `auth.jwt() = NULL` returned ALL records across all tenants:
     ```
           label      | count 
     -----------------+-------
      clientes count: |     2
      users count:    |     2
      tenants count:  |     2
     ```
   - **Verdict**: Critical RLS bypass. Unauthenticated connections or requests with null JWT bypass tenant isolation completely and read all tenant data.

3. **Cross-Tenant Foreign Key Integrity Failure**:
   - Table `contas_receber_parcelas` defines `conta_receber_id UUID NOT NULL REFERENCES contas_receber(id) ON DELETE CASCADE`.
   - Table `projetos` defines `cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL`.
   - **Empirical Result**: A row in `contas_receber_parcelas` assigned to `tenant_id = '11111111-1111-1111-1111-111111111111'` (Tenant Alpha) was inserted successfully referencing a `conta_receber_id = '99999999-9999-9999-9999-999999999999'` belonging to Tenant Beta (`tenant_id = '22222222-2222-2222-2222-222222222222'`).
   - **Verdict**: Missing composite Foreign Key constraints `(tenant_id, parent_id) REFERENCES parent_table(tenant_id, id)`.

4. **Missing Unique Constraints within Tenants**:
   - `clientes` table defines `codigo VARCHAR(50) NOT NULL` without a `UNIQUE(tenant_id, codigo)` constraint.
   - **Empirical Result**: Inserting two records with identical `codigo = 'DUP001'` under the same `tenant_id` succeeded without error.
   - `contas_receber` (`numero`), `contas_pagar` (`numero`), `projetos` (`codigo`) also lack `UNIQUE(tenant_id, ...)` constraints.

5. **Type Constraints & Domain Validation Missing**:
   - `contas_receber` accepted `valor_original = -500.00`, `valor_recebido = -200.00`, and `status = 'INVALID_STATUS_STRING'`.
   - `projetos` accepted `progresso_global = 999.99` and negative hours (`horas_planejadas = -50.00`).
   - `users` accepted `email = 'not-an-email'`, `status = 'HACKED_STATUS'`, and `tentativas_falhas = -99`.

---

## 2. Logic Chain

1. **RLS Vulnerability Reasoning**:
   - Line 323 of `supabase_schema.sql` contains `OR auth.jwt() IS NULL` inside the `USING` and `WITH CHECK` conditions for `tenant_isolation_all_<tbl>`.
   - In Supabase, direct REST requests or connections without a valid bearer JWT yield `auth.jwt() = NULL`.
   - Evaluating `(tenant_id = get_auth_tenant_id() OR ... OR auth.jwt() IS NULL)` when `auth.jwt()` is `NULL` evaluates `auth.jwt() IS NULL` to `TRUE`.
   - Therefore, PostgreSQL permits full SELECT/INSERT/UPDATE/DELETE access to every row regardless of `tenant_id`.

2. **Cross-Tenant FK Corruption Reasoning**:
   - Child tables (e.g., `contas_receber_parcelas`, `projetos`, `cliente_contatos`) only enforce single-column FKs on parent primary keys (`id`).
   - PostgreSQL FK constraints do not implicitly check `tenant_id` alignment between child and parent tables.
   - An attacker or buggy application code in Tenant A can reference parent records belonging to Tenant B, causing cross-tenant data corruption and invalid reporting.

3. **Domain Integrity Reasoning**:
   - Using generic `VARCHAR` columns for `status`, `tipo`, `perfil` without `CHECK` constraints or `ENUM` types allows arbitrary text injection.
   - Omitting `CHECK` constraints on financial/numerical fields (`valor >= 0`, `progresso_global BETWEEN 0 AND 100`) allows corrupted data states (e.g., negative invoices or 999% progress).

---

## 3. Caveats

- Tests were run in PostgreSQL 18.4 Docker container using a mock `auth.jwt()` function that mirrors Supabase's PostgREST `auth.jwt()` behavior.
- Real Supabase API gateways reject unauthenticated requests before reaching PostgreSQL if anon key is not provided; however, any client presenting an anon key without a user token causes `auth.jwt()` to return `NULL` (or `{}`), triggering the `auth.jwt() IS NULL` bypass clause inside Postgres.

---

## 4. Conclusion

`supabase_schema.sql` has **CRITICAL** security vulnerabilities and domain integrity flaws:
1. **Critical Security Defect**: `OR auth.jwt() IS NULL` in RLS policies completely defeats multi-tenant isolation.
2. **High Security Defect**: Lack of composite foreign keys allows cross-tenant reference contamination.
3. **Medium Quality Defect**: Missing unique constraints on tenant-scoped codes (`codigo`, `numero`) allows duplicate identifiers within the same tenant.
4. **Medium Quality Defect**: Lack of numerical and string check constraints permits negative monetary values and invalid status strings.

---

## 5. Verification Method

To verify these findings independently:

1. Execute the Python empirical harness in Docker:
   ```powershell
   python c:\Focuserp\.agents\challenger_m1_1\test_schema.py
   ```
2. Inspect the test output:
   - **Test 3 Output**: Shows `count = 2` for all tables when `auth.jwt() IS NULL` under `SET ROLE authenticated`.
   - **Test 7 Output**: Shows successful insertion of negative values and invalid status strings.
   - **Test 8 Output**: Shows successful insertion of cross-tenant parent-child references.
   - **Test 9 Output**: Shows duplicate `codigo` rows in `clientes` under the same tenant.
