# Handoff Report — Adversarial Verification 2 (Milestone 2: Zod Schemas & Supabase SDK Services)

**Verdict**: **FAIL**  
**Agent**: `teamwork_preview_challenger_m2_2`  
**Date**: 2026-07-29T18:22:00Z  

---

## 1. Observation

### 1.1 Contract Mapping & SQL Fidelity (`supabase_schema.sql` vs `src/services/` & `src/schemas/`)

1. **Non-Existent Database Tables Queried by Services**:
   - `src/services/contratoService.ts` (lines 10-18, 84): Queries and upserts to table `contratos`:
     ```ts
     const { data, error } = await supabase.from('contratos').select(...);
     ```
   - `src/services/colaboradorService.ts` (lines 10-13, 71): Queries and upserts to table `colaboradores`:
     ```ts
     const { data, error } = await supabase.from('colaboradores').select(...);
     ```
   - `src/services/cobrancaService.ts` (lines 10-19, 78): Queries and upserts to table `cobrancas`:
     ```ts
     const { data, error } = await supabase.from('cobrancas').select(...);
     ```
   - **SQL Reference**: `supabase_schema.sql` (lines 1-428) defines 11 tables: `tenants`, `users`, `clientes`, `cliente_contatos`, `fornecedores`, `contas_receber`, `contas_receber_parcelas`, `contas_pagar`, `contas_pagar_parcelas`, `projetos`, `audit_logs`. Tables `contratos`, `colaboradores`, and `cobrancas` **DO NOT EXIST** in `supabase_schema.sql` DDL.

2. **Missing `tenant_id` in `clienteService.ts` and `clienteSchema.ts`**:
   - `src/services/clienteService.ts` (lines 81-97):
     ```ts
     const payload = {
       id,
       codigo: validated.codigo,
       tipo: validated.tipo,
       razao_social: validated.razaoSocial,
       nome_fantasia: validated.nomeFantasia,
       documento: validated.documento,
       status: validated.status,
       segmento: validated.segmento,
       cep: validated.endereco.cep,
       logradouro: validated.endereco.logradouro,
       numero: validated.endereco.numero,
       bairro: validated.endereco.bairro,
       cidade: validated.endereco.cidade,
       estado: validated.endereco.estado,
       updated_at: new Date().toISOString()
     };
     ```
   - **SQL Reference**: `supabase_schema.sql` line 82:
     ```sql
     tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
     ```
   - `tenant_id` is omitted from `saveCliente` payload map. `src/schemas/clienteSchema.ts` lines 26-45 also lacks `tenantId` property.

3. **Dropped Columns in `clienteService.ts`**:
   - `saveCliente` payload omits 8 columns defined in `supabase_schema.sql` (`clientes` table): `complemento`, `pais`, `inscricao_estadual`, `inscricao_municipal`, `data_fundacao_nascimento`, `porte_empresa`, `site`, `observacoes`.

4. **Unsupported Child Relational Tables**:
   - `supabase_schema.sql` defines child tables `cliente_contatos` (line 122), `contas_receber_parcelas` (line 228), and `contas_pagar_parcelas` (line 286).
   - `clienteService.ts` `saveCliente` drops `validated.contatos` array without saving to `cliente_contatos`. In `getClientes()` (lines 40-51), contacts are returned as hardcoded mock objects.
   - `contaReceberService.ts` and `contaPagarService.ts` have zero logic to insert, update, or fetch installment records in `contas_receber_parcelas` or `contas_pagar_parcelas`.

5. **Schema Field Mismatch in `projetoSchema.ts`**:
   - `src/schemas/projetoSchema.ts` line 14: `orcamentoEstimado: z.number().optional().default(0)`
   - `src/services/projetoService.ts` line 88-109: `saveProjeto` payload map does not include `orcamento_estimado`. `supabase_schema.sql` lines 303-327 (`projetos` table) has no `orcamento_estimado` column.

### 1.2 Barrel Exports (`index.ts`)

- `src/schemas/index.ts` lines 1-10:
  Re-exports `clienteSchema`, `userSchema`, `contaReceberSchema`, `contaPagarSchema`, `projetoSchema`, `contratoSchema`, `colaboradorSchema`, `fornecedorSchema`, `cobrancaSchema`, `auditLogSchema`.
- `src/services/index.ts` lines 1-10:
  Re-exports `clienteService`, `userService`, `contaReceberService`, `contaPagarService`, `projetoService`, `contratoService`, `colaboradorService`, `fornecedorService`, `cobrancaService`, `auditLogService`.
- Both barrel exports are complete and expose all schema DTOs and service objects.

### 1.3 Zod Runtime Parsing & Edge Cases

1. **Malformed Date Handling**:
   - `src/schemas/clienteSchema.ts` line 35: `dataFundacaoNascimento: z.string().optional()`
   - `src/schemas/colaboradorSchema.ts` line 12: `dataAdmissao: z.string().optional()`
   - `src/schemas/contaPagarSchema.ts` lines 20-22: `dataEmissao: z.string().optional()`, `dataVencimento: z.string().min(1)`, `dataPagamento: z.string().optional()`
   - `src/schemas/contaReceberSchema.ts` lines 20-23: `dataEmissao: z.string().optional()`, `dataVencimento: z.string().min(1)`, `dataRecebimento: z.string().optional()`, `dataPagamento: z.string().optional()`
   - `src/schemas/contratoSchema.ts` lines 13-14: `dataInicio: z.string().min(1)`, `dataFim: z.string().optional()`
   - `src/schemas/projetoSchema.ts` lines 21-22: `dataInicio: z.string().optional()`, `dataFinal: z.string().optional()`
   - `src/schemas/userSchema.ts` lines 20, 23, 24: `ultimoLogin`, `createdAt`, `updatedAt` optional strings.
   - **Finding**: None of the schemas use `.datetime()`, `.date()`, or regex. Strings like `"invalid-date"`, `"2024-02-31"`, `"99/99/9999"` pass Zod `safeParse` without error.

2. **Blank & Malformed UUIDs**:
   - All schemas define ID fields as `z.string().optional()`. None use `.uuid()`.
   - Blank strings `""`, whitespace `"   "`, or malformed strings `"not-a-uuid"` pass validation.

3. **Negative Currency / Financial Values**:
   - `contaPagarSchema.ts` lines 13-15 and `contaReceberSchema.ts` lines 12-14: `valorOriginal` uses `.min(0)`, but `desconto`, `multa`, `juros` use `z.number().default(0)` without `.min(0)`.
   - `contratoSchema.ts` line 11: `valorMensal` accepts negative numbers (lacks `.min(0)`).
   - `colaboradorSchema.ts` line 11: `salarioBase` accepts negative numbers (lacks `.min(0)`).
   - `cobrancaSchema.ts` lines 9-10: `valorTotal` and `diasAtraso` accept negative numbers (lack `.min(0)`).
   - `projetoSchema.ts` lines 15-16: `valorContratado`, `valorRecebido`, `horasPlanejadas`, `horasRealizadas` accept negative numbers (lack `.min(0)`).

4. **Service Type Assertion Fallback Vulnerability**:
   - In all `get*()` methods (e.g. `clienteService.ts` line 56, `userServices.ts` line 41, `contaPagarService.ts` line 65, etc.):
     ```ts
     const parsed = schema.safeParse(mapped);
     return parsed.success ? parsed.data : mapped as DTO;
     ```
   - When Zod parsing fails on invalid runtime data, the service bypasses validation entirely and casts raw unvalidated data (`mapped as DTO`).

### 1.4 Build Execution (`npm run build`)
- Tool command `npm run build` timed out waiting for user approval.

---

## 2. Logic Chain

1. **Premise 1 (SQL Schema Missing Tables)**: `supabase_schema.sql` is the authoritative 3NF database definition. It defines 11 tables. Services `contratoService`, `colaboradorService`, and `cobrancaService` construct queries against `contratos`, `colaboradores`, and `cobrancas`. Since PostgreSQL cannot find relations that are absent from DDL, runtime execution of these services will crash with DB exception `42P01`.
2. **Premise 2 (Missing `tenant_id`)**: `clientes` table DDL specifies `tenant_id UUID NOT NULL`. `clienteService.saveCliente` payload map omits `tenant_id`. Executing `saveCliente` against a live database will fail with PostgreSQL exception `23502 (null value in column "tenant_id" violates not-null constraint)`.
3. **Premise 3 (Dropped Data & Unsupported Child Relations)**: Multi-tenant ERP requirements require preserving full entity details and relational children (`cliente_contatos`, `contas_receber_parcelas`, `contas_pagar_parcelas`). Dropping 8 columns in `clienteService.saveCliente` and failing to persist child tables results in silent data loss.
4. **Premise 4 (Zod Permissiveness & Fallback Bypass)**: Permissive Zod types (allowing invalid dates, negative monetary values, non-UUID strings) combined with `parsed.success ? parsed.data : mapped as DTO` fallback pattern mean that malformed or corrupted records pass into frontend components without type safety guarantees.
5. **Conclusion**: Milestone 2 fails adversarial verification due to critical database relation mismatches, missing tenant payload keys, unhandled child tables, and Zod runtime validation loopholes.

---

## 3. Caveats

- **Network / Live DB Execution**: Verified against static code, Zod parsing specs, and SQL DDL. Live Supabase database execution was not performed due to `CODE_ONLY` network mode.
- **Build Execution**: `npm run build` could not complete due to user terminal permission timeout.

---

## 4. Conclusion

**Verdict**: **FAIL**

Milestone 2 fails Adversarial Verification 2 due to:
1. **Critical SQL DDL Mismatch**: `contratos`, `colaboradores`, `cobrancas` tables do not exist in `supabase_schema.sql`.
2. **Critical Payload Defect**: `clienteService.saveCliente` omits `tenant_id` (violates NOT NULL DB constraint) and drops 8 database columns.
3. **Missing Child Table Support**: `cliente_contatos`, `contas_receber_parcelas`, and `contas_pagar_parcelas` are ignored by SDK services.
4. **Validation Bypass**: Services fall back to `mapped as DTO` when Zod `safeParse` fails.
5. **Zod Validation Gaps**: Lack of date format checks (`.datetime()`), UUID checks (`.uuid()`), and negative value constraints (`.min(0)`).

---

## 5. Verification Method

To independently verify these findings:

1. **Verify Missing Tables in SQL Schema**:
   Inspect `supabase_schema.sql` and search for table definitions:
   ```bash
   grep -i "CREATE TABLE" c:\Focuserp\supabase_schema.sql
   ```
   Observe that `contratos`, `colaboradores`, and `cobrancas` are absent.

2. **Verify Missing `tenant_id` and Dropped Columns in `clienteService.ts`**:
   Inspect lines 81-97 of `src/services/clienteService.ts` to confirm `tenant_id` and extra columns (`complemento`, `pais`, `site`, etc.) are missing from the `payload` object.

3. **Run Empirical Zod Test Harness**:
   Execute Node test scripts in `.agents/teamwork_preview_challenger_m2_2/`:
   ```bash
   node c:\Focuserp\.agents\teamwork_preview_challenger_m2_2\verify_m2_all.js
   node c:\Focuserp\.agents\teamwork_preview_challenger_m2_2\test_zod_edge_cases.js
   ```

4. **Invalidation Condition**:
   This verdict is invalidated if `supabase_schema.sql` is updated to include `contratos`, `colaboradores`, `cobrancas`, `clienteService.saveCliente` includes `tenant_id` and all DB columns, child parcelas/contacts are persisted, and Zod schemas enforce dates/UUIDs/non-negative numbers.
