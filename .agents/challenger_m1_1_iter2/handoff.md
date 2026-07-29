# Adversarial Handoff Report — challenger_m1_1_iter2

## 1. Observation

Adversarial empirical testing was performed against the remediated DDL schema `c:\Focuserp\supabase_schema.sql` using a dedicated PostgreSQL 18.4 container test harness (`c:\Focuserp\.agents\challenger_m1_1_iter2\test_schema_iter2.py`).

The empirical test results confirm:

1. **Unauthenticated / Null JWT Requests Rejected by Default**:
   - Schema lines 363-371 define `get_auth_tenant_id()` which returns `NULL` when `auth.jwt() ->> 'tenant_id'` is `NULL`, missing, or invalid.
   - Schema lines 388-393 and 418-425 define RLS policies for `tenants` and all 10 tenant-scoped tables (`users`, `clientes`, `cliente_contatos`, `fornecedores`, `contas_receber`, `contas_receber_parcelas`, `contas_pagar`, `contas_pagar_parcelas`, `projetos`, `audit_logs`).
   - The flawed `OR auth.jwt() IS NULL` clause present in Iteration 1 has been **completely removed**.
   - **Empirical Execution Result (Null JWT)**:
     - `SELECT` query under `SET ROLE authenticated` with `auth.jwt() = NULL` returned **0 rows** across all 11 tables.
     - `INSERT` query under `SET ROLE authenticated` with `auth.jwt() = NULL` failed with `ERROR: new row violates row-level security policy for table "clientes"`.
   - **Empirical Execution Result (Empty JWT `{}`)**:
     - `SELECT` query with `auth.jwt() = '{}'::jsonb` (missing `tenant_id` claim) returned **0 rows**.

2. **Tenant Isolation Enforcement**:
   - **Empirical Execution Result (Tenant Alpha JWT)**:
     - Querying as Tenant Alpha (`tenant_id = '11111111-1111-1111-1111-111111111111'`) returned only Tenant Alpha records (1 tenant row, 1 user row, 1 client row, etc.). Zero records from Tenant Beta were accessible.
   - **Empirical Execution Result (Cross-Tenant INSERT Attack)**:
     - Tenant Alpha attempting to `INSERT` a client record with Tenant Beta's `tenant_id` (`'22222222-2222-2222-2222-222222222222'`) failed with `ERROR: new row violates row-level security policy for table "clientes"`.
   - **Empirical Execution Result (Cross-Tenant UPDATE Attack)**:
     - Tenant Alpha attempting to `UPDATE` a record belonging to Tenant Beta affected **0 rows** (`UPDATE 0`).

3. **Service Role Access**:
   - **Empirical Execution Result (`role = service_role`)**:
     - Querying with JWT claim `{"role": "service_role"}` returned all records across all tenants (2 tenant rows, 2 client rows), matching the intended administrative override contract.

4. **Unique Constraints within Tenant**:
   - **Empirical Execution Result (Duplicate Tenant Code)**:
     - Attempting to insert two records with duplicate `codigo` under the same tenant failed with `ERROR: duplicate key value violates unique constraint "uq_clientes_tenant_codigo"`.

---

## 2. Logic Chain

1. **Deny-by-Default Logic**:
   - RLS `USING` and `WITH CHECK` clauses require `tenant_id = get_auth_tenant_id() OR (auth.jwt() ->> 'role') = 'service_role'`.
   - For unauthenticated requests or null/empty JWTs, `get_auth_tenant_id()` evaluates to `NULL`.
   - `tenant_id = NULL` evaluates to `UNKNOWN`/`FALSE` in SQL boolean logic.
   - Since `(auth.jwt() ->> 'role') = 'service_role'` also evaluates to `FALSE` when JWT is null or missing, the entire policy condition evaluates to `FALSE`.
   - In PostgreSQL RLS, a policy condition evaluating to `FALSE` denies access (0 rows returned for SELECT, error raised for INSERT/UPDATE/DELETE).

2. **Tenant Isolation Logic**:
   - When a user presents a JWT with `tenant_id = X`, `get_auth_tenant_id()` returns `X`.
   - The RLS policy restricts `USING` and `WITH CHECK` to rows where `tenant_id = X`.
   - Any attempt to select, update, or delete rows with `tenant_id != X` fails the `USING` filter.
   - Any attempt to insert rows with `tenant_id != X` fails the `WITH CHECK` constraint, raising an RLS violation.

---

## 3. Caveats

- Testing was performed using a PostgreSQL 18.4 container with a mock `auth.jwt()` function matching Supabase PostgREST JWT injection behavior.
- Database level security is fully enforced. Application-level API gateways should still ensure JWT signatures are verified prior to reaching Postgres.

---

## 4. Conclusion

The remediated `supabase_schema.sql` **PASSES ALL ADVERSARIAL CHALLENGES**:
1. Unauthenticated and null JWT requests are strictly rejected by default.
2. Tenant isolation cannot be bypassed by missing JWT claims, empty tokens, cross-tenant INSERTs, or cross-tenant UPDATEs.
3. Row Level Security policies are active and correctly configured across all 11 database tables.

---

## 5. Verification Method

To verify these findings independently:

1. Inspect the test execution log from the PostgreSQL harness:
   `c:\Focuserp\.agents\challenger_m1_1_iter2\test_schema_iter2.py`
2. Run the test harness in Docker / Python:
   ```powershell
   python c:\Focuserp\.agents\challenger_m1_1_iter2\test_schema_iter2.py
   ```
3. Check the output for:
   - `TEST 3`: `Null JWT SELECT` returns `count = 0` for all 11 tables.
   - `TEST 4`: `Null JWT INSERT` raises `ERROR: new row violates row-level security policy`.
   - `TEST 7`: `Cross-Tenant INSERT` raises `ERROR: new row violates row-level security policy`.
   - `TEST 8`: `Cross-Tenant UPDATE` results in `UPDATE 0`.
