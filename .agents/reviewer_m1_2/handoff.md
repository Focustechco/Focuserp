# Handoff Report: Independent Review of Database DDL & Multi-Tenant Security (`supabase_schema.sql`)

**Reviewer**: reviewer_m1_2 (Roles: Reviewer, Adversarial Critic)  
**Target File**: `c:\Focuserp\supabase_schema.sql`  
**Verdict**: **REQUEST_CHANGES**  

---

## 1. Observation

Direct observations from analysis and validation of `c:\Focuserp\supabase_schema.sql`:

1. **RLS Policy Bypass (`auth.jwt() IS NULL`)**:
   - Lines 291-297:
     ```sql
     CREATE POLICY tenant_isolation_tenants ON tenants
         FOR SELECT
         USING (
             id = get_auth_tenant_id()
             OR (auth.jwt() ->> 'role') = 'service_role'
             OR auth.jwt() IS NULL
         );
     ```
   - Lines 318-330 (Dynamic macro for `users`, `clientes`, `cliente_contatos`, `contas_receber`, `contas_receber_parcelas`, `contas_pagar`, `contas_pagar_parcelas`, `projetos`, `audit_logs`):
     ```sql
     CREATE POLICY tenant_isolation_all_%I ON %I
     FOR ALL
     USING (
         tenant_id = get_auth_tenant_id()
         OR (auth.jwt() ->> ''role'') = ''service_role''
         OR auth.jwt() IS NULL
     )
     WITH CHECK (
         tenant_id = get_auth_tenant_id()
         OR (auth.jwt() ->> ''role'') = ''service_role''
         OR auth.jwt() IS NULL
     )
     ```
   - *Observation*: The clause `OR auth.jwt() IS NULL` causes the RLS expression to evaluate to `TRUE` for any request lacking a user JWT token (such as anonymous API calls made via Supabase PostgREST endpoints using the public `anon` key).

2. **Keycloak JWT Integration (`get_auth_tenant_id()`)**:
   - Lines 267-275:
     ```sql
     CREATE OR REPLACE FUNCTION get_auth_tenant_id()
     RETURNS UUID AS $$
     BEGIN
       RETURN NULLIF(auth.jwt() ->> 'tenant_id', '')::uuid;
     EXCEPTION
       WHEN OTHERS THEN
         RETURN NULL;
     END;
     $$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
     ```
   - *Observation*: Extracts `auth.jwt() ->> 'tenant_id'`. If JWT lacks `tenant_id` or is malformed, exception handling returns `NULL`. However, combined with `OR auth.jwt() IS NULL` in RLS policies, a missing/null JWT grants full access instead of denying access.

3. **Calculated Balance Fields (`saldo`, `saldo_restante`)**:
   - `contas_receber` (Line 121):
     `saldo NUMERIC(15,2) GENERATED ALWAYS AS (valor_original - valor_recebido) STORED`
   - `contas_pagar` (Line 173):
     `saldo NUMERIC(15,2) GENERATED ALWAYS AS (valor_original - valor_pago) STORED`
   - `projetos` (Line 231):
     `saldo_restante NUMERIC(15,2) GENERATED ALWAYS AS (valor_contratado - valor_recebido) STORED`
   - *Observation*: `contas_receber` and `contas_pagar` contain discount (`desconto`), fine (`multa`), and interest (`juros`) fields. The generated `saldo` formula ignores discounts/multas/juros. For example, if `valor_original` = 100, `desconto` = 10, and `valor_recebido` = 90 (full net payment), `saldo` calculates as `100 - 90 = 10` (reporting an unpaid balance of 10 on a fully settled account).

4. **Data Integrity & Schema Constraints**:
   - `contas_pagar` (Line 166): `fornecedor_id UUID` lacks `REFERENCES` foreign key constraint.
   - `contas_receber` (Lines 114-116): Contains both `cliente_id UUID REFERENCES clientes(id)` and `cliente_nome VARCHAR(255)` (3NF transitive dependency violation).
   - `users`: Lacks `UNIQUE(tenant_id, email)` constraint.
   - `clientes`: Lacks `UNIQUE(tenant_id, codigo)` and `UNIQUE(tenant_id, documento)` constraints.
   - `contas_receber` / `contas_pagar`: Lack `UNIQUE(tenant_id, numero)` constraints.
   - `projetos`: Lacks `UNIQUE(tenant_id, codigo)` constraint.
   - Missing `BEFORE UPDATE` trigger to maintain `updated_at` timestamps across tables.

5. **Empirical Validation Output (`validate_schema.js`)**:
   - Command: `node .agents/challenger_m1_2/validate_schema.js`
   - Result: Confirmed `auth.jwt() IS NULL` security vulnerability, missing foreign keys, 3NF violations, missing tenant unique constraints, and missing `updated_at` triggers.

---

## 2. Logic Chain

1. **Security & Tenant Isolation Impact**:
   - Supabase PostgREST exposes all tables with active RLS to clients.
   - Unauthenticated/anonymous clients connect without a user JWT, causing `auth.jwt()` to return `NULL`.
   - In `supabase_schema.sql`, every RLS policy includes `OR auth.jwt() IS NULL`.
   - Therefore, `USING` and `WITH CHECK` conditions evaluate to `TRUE` for anonymous requests.
   - Any public web client can query, insert, overwrite, or delete data from any tenant in `tenants`, `users`, `clientes`, `contas_receber`, `contas_pagar`, `projetos`, and `audit_logs`.
   - This represents a critical **INTEGRITY & SECURITY VIOLATION**.

2. **Financial Data Accuracy Impact**:
   - Financial management in FocusERP requires net settlement tracking.
   - Standard invoice payments incorporate discounts, late interest, or fines (`valor_liquido = valor_original - desconto + multa + juros`).
   - Defining `saldo` as `valor_original - valor_recebido` causes inaccurate balances whenever discounts or interest apply.
   - Furthermore, child tables (`contas_receber_parcelas`, `contas_pagar_parcelas`) have no triggers to aggregate paid installments into `valor_recebido`/`valor_pago` in parent tables, risking data desynchronization.

3. **Data Integrity & Relational Soundness Impact**:
   - Without `UNIQUE(tenant_id, email)` on `users` or `UNIQUE(tenant_id, codigo)` on `clientes`/`projetos`/`contas_receber`, duplicate business entities can be inserted into the same tenant scope.
   - Without a foreign key on `contas_pagar.fornecedor_id`, orphaned supplier IDs can be stored.
   - Without composite FKs `(tenant_id, parent_id)`, child records (`cliente_contatos`, `parcelas`) could point to parent records belonging to a different tenant.

---

## 3. Review Findings & Adversarial Analysis

### Review Findings Summary

| ID | Category | Severity | Location | Summary |
|---|---|---|---|---|
| F-01 | Security | **CRITICAL (INTEGRITY VIOLATION)** | `supabase_schema.sql`: 295, 324, 330 | `OR auth.jwt() IS NULL` in RLS policies completely bypasses tenant isolation for anonymous requests. |
| F-02 | Correctness | **MAJOR** | `supabase_schema.sql`: 121, 173 | `saldo` generated column ignores `desconto`, `multa`, and `juros`, producing incorrect unpaid balances. |
| F-03 | Data Integrity | **MAJOR** | `supabase_schema.sql`: 166 | `contas_pagar.fornecedor_id` lacks foreign key constraint (`REFERENCES`). |
| F-04 | Data Integrity | **MAJOR** | `users`, `clientes`, `contas_receber`, `contas_pagar`, `projetos` | Missing multi-tenant unique constraints (`UNIQUE(tenant_id, email)`, `UNIQUE(tenant_id, codigo)`, `UNIQUE(tenant_id, numero)`). |
| F-05 | 3NF / Design | **MEDIUM** | `contas_receber`: 116 | Redundant `cliente_nome` column creates transitive dependency (3NF violation). |
| F-06 | Automation | **MEDIUM** | All tables | Missing `BEFORE UPDATE` trigger function to update `updated_at = now()`. |
| F-07 | Data Integrity | **MEDIUM** | `contas_receber_parcelas`, `contas_pagar_parcelas`, `projetos` | Lack of aggregation triggers between child installments/receipts and parent tables. |

---

### Adversarial Stress-Testing Scenarios

1. **Attack Scenario 1: Anonymous API Data Exfiltration & Destruction**
   - *Attack*: Attacker sends `GET https://<supabase-id>.supabase.co/rest/v1/users` or `DELETE FROM clientes` with public `anon` API key (no Bearer token).
   - *Result*: `auth.jwt()` is `NULL`. RLS condition `OR auth.jwt() IS NULL` evaluates to `TRUE`. Full database contents exfiltrated or deleted across all tenants.
   - *Defense Required*: Remove `OR auth.jwt() IS NULL` from all production RLS policies. Service role operations should rely strictly on `(auth.jwt() ->> 'role') = 'service_role'`.

2. **Attack Scenario 2: Discount & Fines Balance Corruption**
   - *Scenario*: Invoice created for $1,000 with a $100 early settlement discount (`valor_original` = 1000, `desconto` = 100). Customer pays $900 (`valor_recebido` = 900).
   - *Result*: `saldo` = `1000 - 900` = `100`. System flags invoice as "Atrasado/Pendente with $100 balance" even though payment was completed in full.
   - *Defense Required*: Calculate `saldo` based on net total due (`COALESCE(valor_liquido, valor_original - COALESCE(desconto, 0) + COALESCE(multa, 0) + COALESCE(juros, 0)) - valor_recebido`) or compute dynamically via view/function.

3. **Attack Scenario 3: Cross-Tenant Parent-Child Mismatch**
   - *Scenario*: Malicious or buggy client inserts `cliente_contatos` record with `tenant_id` = Tenant A, but `cliente_id` pointing to a client ID in Tenant B.
   - *Result*: Database accepts record due to simple `REFERENCES clientes(id)`.
   - *Defense Required*: Add `UNIQUE (tenant_id, id)` on parent tables and use composite FKs `FOREIGN KEY (tenant_id, cliente_id) REFERENCES clientes(tenant_id, id)`.

---

## 4. Caveats

- **Local PSQL vs PostgREST Execution**: Developers sometimes add `OR auth.jwt() IS NULL` so that direct SQL scripts run via standard PostgreSQL connections succeed. However, standard PostgreSQL superusers (`postgres` / `postgres_admin`) already bypass RLS natively. PostgREST connection roles (`anon`, `authenticated`) must strictly enforce RLS policies.
- **Keycloak Claim Mapping**: Keycloak must be configured with a protocol mapper to include `tenant_id` in the root JSON object of the issued JWT access tokens.

---

## 5. Conclusion

The current `supabase_schema.sql` cannot be approved due to a **CRITICAL INTEGRITY VIOLATION** (`OR auth.jwt() IS NULL` in RLS policies) that disables multi-tenant isolation for unauthenticated calls, as well as major financial balance calculation flaws and missing data integrity constraints.

**Verdict**: **REQUEST_CHANGES**

### Required Action Items for Fix:

1. **Fix RLS Policies**: Remove `OR auth.jwt() IS NULL` from `tenant_isolation_tenants` and all `tenant_isolation_all_*` policies.
2. **Correct Calculated Fields**: Update `saldo` in `contas_receber` and `contas_pagar` to factor in `desconto`, `multa`, and `juros`, or compute `valor_liquido - valor_recebido`.
3. **Enforce Foreign Key Constraints**: Add `FOREIGN KEY (fornecedor_id) REFERENCES ...` or clarify supplier entity schema.
4. **Add Unique Multi-Tenant Constraints**:
   - `users`: `UNIQUE (tenant_id, email)`
   - `clientes`: `UNIQUE (tenant_id, codigo)`, `UNIQUE (tenant_id, documento)`
   - `contas_receber` / `contas_pagar`: `UNIQUE (tenant_id, numero)`
   - `projetos`: `UNIQUE (tenant_id, codigo)`
5. **Add Maintenance Triggers**: Create PostgreSQL trigger function to auto-update `updated_at = now()` on table updates.

---

## 6. Verification Method

To verify the reported findings independently:

1. **Empirical Script Check**:
   Run the empirical schema validation script:
   ```powershell
   node .agents/challenger_m1_2/validate_schema.js
   ```
2. **SQL Inspection**:
   Inspect lines 291-332 of `c:\Focuserp\supabase_schema.sql` to verify presence of `OR auth.jwt() IS NULL`.
3. **Calculation Check**:
   Inspect lines 121 and 173 of `c:\Focuserp\supabase_schema.sql` to confirm `saldo GENERATED ALWAYS AS (valor_original - valor_recebido/valor_pago)`.
