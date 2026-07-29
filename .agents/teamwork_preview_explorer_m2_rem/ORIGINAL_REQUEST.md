## 2026-07-29T15:23:30Z
<USER_REQUEST>
You are teamwork_preview_explorer assigned to analyze the remediation strategy for Milestone 2 (Zod Schemas & Supabase SDK Services) defects in Focuserp.

Working directory for your metadata: c:\Focuserp\.agents\teamwork_preview_explorer_m2_rem

### Task
Analyze the defect reports from Challengers M2_1 and M2_2, inspect `src/schemas/`, `src/services/`, and `supabase_schema.sql`, and produce a detailed fix specification for all identified issues.

### Identified Defects to Address:

1. **Database Schema & Table Alignment**:
   - `contratoService.ts`, `cobrancaService.ts`, `colaboradorService.ts` query tables `contratos`, `cobrancas`, `colaboradores`. Check if DDL in `supabase_schema.sql` needs DDL statements for `contratos`, `cobrancas`, `colaboradores` or if services need to target existing tables (`clients` fallback or SQL table DDL additions if missing).
   - `clienteService.saveCliente` omits `tenant_id` (which is `NOT NULL` in `supabase_schema.sql`), and `clienteSchema.ts` lacks `tenantId`. Add `tenantId` (optional UUID) to `clienteSchema.ts` and `tenant_id` mapping in `saveCliente`.
   - `clienteService.saveCliente` drops 8 DB columns: `complemento`, `pais`, `inscricao_estadual`, `inscricao_municipal`, `data_fundacao_nascimento`, `porte_empresa`, `site`, `observacoes`. Map ALL fields in payload.
   - Child tables: ensure child tables or array fields in DTOs are mapped cleanly.

2. **Zod Validation Fixes**:
   - Flawed Email Validation: `contatoSchema`, `colaboradorSchema`, `fornecedorSchema` use `.or(z.string().default(''))` which matches ANY string (e.g. `"not-an-email"`). Fix to `z.union([z.string().email(), z.literal('')])` or `z.string().email().or(z.literal(''))` across all schemas.
   - Date Validation: Validate ISO dates or non-empty strings cleanly without crashing.
   - UUID Validation: Optional UUID validation (`z.string().uuid().optional().or(z.literal(''))`).
   - Financial Validation: Add `.min(0)` to all currency / financial / quantity fields (`valorOriginal`, `valorPago`, `valorRecebido`, `salarioBase`, `valorTotal`, `valorMensal`, `juros`, `multa`, `desconto`, `diasAtraso`, `valorContratado`).

3. **Service Error Handling & Safety**:
   - `clienteService.ts` crash fix: `item.id.slice(0, 4)` -> safe optional chaining `item.id?.slice(0, 4) || crypto.randomUUID()`.
   - Service Type Safety: Eliminate `mapped as DTO` raw unvalidated fallbacks when `safeParse` fails. Log parse errors and apply safe default values or filter invalid records.
   - False Success Fix: `save*`, `delete*`, and action methods MUST throw errors when Supabase returns an error (`if (error) throw new Error(...)`) instead of logging `console.warn` and returning success DTOs.

### Deliverable
Write your analysis and step-by-step remediation plan in:
`c:\Focuserp\.agents\teamwork_preview_explorer_m2_rem\handoff.md`
</USER_REQUEST>
