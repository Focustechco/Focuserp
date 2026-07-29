# Verification Report — Empirical Challenge & Schema Validation

**Agent**: `challenger_m1_2` (EMPIRICAL CHALLENGER — critic, specialist)  
**Date**: 2026-07-29  
**Target Project**: `c:\Focuserp`  
**Files Verified**: `c:\Focuserp\package.json`, `c:\Focuserp\supabase_schema.sql`

---

## 1. Observation

### 1.1 Empirical Build Verification (`npm run build`)
- **Command Executed**: `npm run build` in directory `c:\Focuserp`
- **Execution Result**:
  ```text
  ✓ built in 1.80s
  [nitro] i Using auto generated worker name: focustechco-focuserp
  i Generated .output/server/wrangler.json
  i Generated .wrangler/deploy/config.json
  i Generated .output/public/_headers
  i Generated .output/nitro.json

  [nitro] √ You can preview this build using npx vite preview
  [nitro] √ You can deploy this build using npx nitro deploy --prebuilt
  ```
- **Exit Code**: 0 (Success)
- **Artifacts Produced**: `.output/server/index.mjs`, `.output/public/*`, `.output/server/wrangler.json`, `.output/nitro.json`.

### 1.2 DDL Schema Validation (`supabase_schema.sql`)
Analyzed `c:\Focuserp\supabase_schema.sql` (333 lines, 10 tables defined: `tenants`, `users`, `clientes`, `cliente_contatos`, `contas_receber`, `contas_receber_parcelas`, `contas_pagar`, `contas_pagar_parcelas`, `projetos`, `audit_logs`).

Executed custom validation harness `node .agents/challenger_m1_2/validate_schema.js` on `supabase_schema.sql`:

#### Observation A: Critical Security Flaw in RLS Policies
- **Lines 291-297**:
  ```sql
  CREATE POLICY tenant_isolation_tenants ON tenants
      FOR SELECT
      USING (
          id = get_auth_tenant_id()
          OR (auth.jwt() ->> 'role') = 'service_role'
          OR auth.jwt() IS NULL
      );
  ```
- **Lines 317-329**:
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
- **Observation**: `OR auth.jwt() IS NULL` is explicitly included in the `USING` and `WITH CHECK` clauses for all tables.

#### Observation B: Missing Foreign Key & Missing Table
- **Line 166**:
  ```sql
  166: fornecedor_id UUID,
  168: fornecedor VARCHAR(255) NOT NULL,
  ```
- **Observation**: `fornecedor_id` lacks a `REFERENCES` constraint. No `fornecedores` table is created or referenced anywhere in `supabase_schema.sql`.

#### Observation C: 3NF (Third Normal Form) Violations
- **Line 116 (`contas_receber`)**:
  ```sql
  114: cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  116: cliente_nome VARCHAR(255),
  ```
- **Line 168 (`contas_pagar`)**:
  ```sql
  166: fornecedor_id UUID,
  168: fornecedor VARCHAR(255) NOT NULL,
  ```
- **Observation**: Storing redundant descriptive strings (`cliente_nome`, `fornecedor`) alongside entity IDs creates transitive dependencies (`cliente_id -> cliente_nome`).

#### Observation D: Missing Multi-Tenant Unique Constraints
- **`users` Table (Lines 24-46)**:
  - Line 31: `email VARCHAR(255) NOT NULL,`
  - Line 27: `keycloak_sub VARCHAR(255) UNIQUE,`
  - Line 28: `auth_user_id UUID UNIQUE,`
  - **Observation**: `email` lacks `UNIQUE (tenant_id, email)` constraint. Conversely, global `UNIQUE` on `keycloak_sub` / `auth_user_id` blocks users from belonging to multiple tenants.
- **`clientes` Table (Lines 55-84)**:
  - Line 58: `codigo VARCHAR(50) NOT NULL,`
  - Line 62: `documento VARCHAR(20) NOT NULL,`
  - **Observation**: No `UNIQUE (tenant_id, codigo)` or `UNIQUE (tenant_id, documento)` constraints exist. Duplicate codes or CNPJs can be inserted per tenant.

#### Observation E: Missing `updated_at` Automatic Triggers
- **Lines 18, 45, 83, 102, 139, 191, 236**:
  Tables declare `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`.
- **Observation**: No `BEFORE UPDATE` triggers exist to auto-update `updated_at` on row updates.

---

## 2. Logic Chain

1. **Build Step Verification**:
   - `npm run build` executes `vite build` via TanStack Start & Nitro.
   - Output produced valid client and server bundles in 1.80s without TypeScript or bundler errors.
   - **Conclusion**: The frontend/backend compilation passes cleanly.

2. **Security Vulnerability Logic (RLS Bypass)**:
   - In Supabase, `auth.jwt()` parses the JWT sent in the HTTP `Authorization` header.
   - For anonymous / unauthenticated API calls, no JWT is sent, so `auth.jwt()` evaluates to `NULL`.
   - In `supabase_schema.sql`, the policy condition evaluates `(tenant_id = get_auth_tenant_id() OR (auth.jwt() ->> 'role') = 'service_role' OR auth.jwt() IS NULL)`.
   - When `auth.jwt()` is `NULL`, `auth.jwt() IS NULL` evaluates to `TRUE`.
   - A boolean expression `A OR B OR TRUE` evaluates to `TRUE`.
   - Therefore, any anonymous user can perform SELECT, INSERT, UPDATE, and DELETE operations across all rows of all tables, entirely bypassing multi-tenant isolation.

3. **Data Model & Integrity Logic**:
   - **Missing FK**: `contas_pagar.fornecedor_id` is an unconstrained UUID field. Invalid or orphan supplier IDs can be stored.
   - **3NF Violation**: `contas_receber` stores both `cliente_id` and `cliente_nome`. If a client changes their company name in `clientes`, records in `contas_receber` will retain old names, leading to data inconsistency.
   - **Multi-Tenant Uniqueness**: `clientes.codigo` and `clientes.documento` are not constrained as unique per tenant (`UNIQUE (tenant_id, codigo)`). A tenant can accidentally insert multiple clients with identical codes or documents.
   - **Stale Timestamps**: Without `BEFORE UPDATE` triggers, updating a record in PostgreSQL leaves `updated_at` unchanged, breaking auditability.

---

## 3. Caveats

- **Runtime DB Execution**: Static analysis and automated script validation were conducted on `supabase_schema.sql`. Execution on a live PostgreSQL database server was not performed as no local or remote PostgreSQL daemon was provisioned in the workspace environment.
- **Review-Only Constraint**: In accordance with the system constraints ("Review-only — do NOT modify implementation code"), no changes were made to `supabase_schema.sql` or project source code. Findings must be resolved by the implementation agent.

---

## 4. Conclusion

- **Build Result**: **PASS**. `npm run build` succeeds with zero errors in 1.80s.
- **DDL Schema Result**: **FAIL (WITH HIGH/CRITICAL FINDINGS)**.
  - **CRITICAL**: RLS policy multi-tenant security bypass (`OR auth.jwt() IS NULL`).
  - **HIGH**: Missing `fornecedores` table and dangling `fornecedor_id` column in `contas_pagar`.
  - **MEDIUM**: 3NF violations in `contas_receber` (`cliente_nome`) and `contas_pagar` (`fornecedor`).
  - **MEDIUM**: Missing scoped unique constraints (`UNIQUE (tenant_id, email)` on `users`, `UNIQUE (tenant_id, codigo)` on `clientes`).
  - **LOW**: Missing `updated_at` trigger functions.

---

## 5. Verification Method

### How to Independently Verify:

1. **Verify Build**:
   ```powershell
   npm run build
   ```
   *Expected Output*: Build completes in ~1.8s producing `.output/` bundle directory without errors.

2. **Verify DDL Schema Validation & RLS Flaw**:
   ```powershell
   node .agents/challenger_m1_2/validate_schema.js
   ```
   *Expected Output*:
   - Balanced Parentheses Check: PASS
   - Detects missing REFERENCES on `contas_pagar.fornecedor_id`
   - Detects 3NF violations (`contas_receber.cliente_nome`, `contas_pagar.fornecedor`)
   - Reports CRITICAL SECURITY VULNERABILITY (`auth.jwt() IS NULL` clause)
