## 2026-07-29T18:26:06Z
You are teamwork_preview_worker assigned to execute Milestone 2 Iteration 2 Remediation for Zod Schemas & Supabase SDK Services in Focuserp.

Working directory for your metadata: c:\Focuserp\.agents\teamwork_preview_worker_m2_rem

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

### Objective
Implement the complete remediation specification in `c:\Focuserp\.agents\teamwork_preview_explorer_m2_rem\handoff.md`.

### Remediation Tasks

1. **Database DDL (`supabase_schema.sql`)**:
   - Add table DDLs for `contratos`, `cobrancas`, `colaboradores` with primary keys, `tenant_id`, indexes, foreign keys, `updated_at` triggers, RLS activation (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`), and update the dynamic PL/pgSQL RLS policy array to include `contratos`, `cobrancas`, `colaboradores`.

2. **Zod Validation Schemas (`src/schemas/`)**:
   - Update `clienteSchema.ts`, `colaboradorSchema.ts`, `fornecedorSchema.ts` to replace flawed `.or(z.string().default(''))` with `z.union([z.string().email('E-mail inválido'), z.literal('')])`.
   - Add `tenantId: z.union([z.string().uuid(), z.literal('')]).optional()` to `clienteSchema.ts` and all entity schemas requiring `tenantId`.
   - Add `.min(0)` financial and quantity bounds across all currency, salary, interest, penalty, discount, days late, and hours fields (`valorOriginal`, `valorPago`, `valorRecebido`, `salarioBase`, `valorTotal`, `valorMensal`, `juros`, `multa`, `desconto`, `diasAtraso`, `valorContratado`, `orcamentoEstimado`, `horasPlanejadas`, `horasRealizadas`).

3. **Supabase SDK Services (`src/services/`)**:
   - `clienteService.ts`:
     - Fix `.slice` crash: `item.id?.slice(0, 4) || crypto.randomUUID().slice(0, 4)`.
     - Update `saveCliente` payload to include `tenant_id` and all 8 missing client DB columns (`complemento`, `pais`, `inscricao_estadual`, `inscricao_municipal`, `data_fundacao_nascimento`, `porte_empresa`, `site`, `observacoes`).
     - Save and query `cliente_contatos` child records.
   - Standardize Error Handling across ALL 10 services (`clienteService`, `userService`, `contaReceberService`, `contaPagarService`, `projetoService`, `contratoService`, `colaboradorService`, `fornecedorService`, `cobrancaService`, `auditLogService`):
     - In all `save*`, `delete*`, and mutation methods: MUST `if (error) throw new Error(...)` instead of returning mock success DTOs.
     - In all `get*` methods: Safe parsing with `safeParse` result filtering (log parse errors and filter out invalid records instead of returning raw `mapped as DTO` unvalidated casts).

4. **Build Verification**:
   - Execute `npx tsc --noEmit` and `npm run build` to verify zero static type errors and successful production bundle compilation.

5. **Deliver Handoff Report**:
   Write your handoff report at `c:\Focuserp\.agents\teamwork_preview_worker_m2_rem\handoff.md` summarizing implemented changes and build results.
