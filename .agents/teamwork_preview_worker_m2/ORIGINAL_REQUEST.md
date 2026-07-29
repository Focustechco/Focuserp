## 2026-07-29T18:13:05Z
You are teamwork_preview_worker assigned to execute Milestone 2: Zod Schemas & Supabase SDK Services for Focuserp.

Working directory for your metadata: c:\Focuserp\.agents\teamwork_preview_worker_m2

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

### Objective
Implement strongly typed Zod Schemas in `src/schemas/` and Supabase SDK Services in `src/services/` as specified in `c:\Focuserp\.agents\teamwork_preview_explorer_m2\handoff.md` and `c:\Focuserp\supabase_schema.sql`.

### Tasks

1. **Zod Schemas (`src/schemas/`)**:
   Create or verify all Zod schema modules and export their DTO types:
   - `clienteSchema.ts` (Verify existing, ensure compatibility)
   - `userSchema.ts`: `userSchema`, `activeUserSchema`, `UserDTO`, `ActiveUserDTO`
   - `contaReceberSchema.ts`: `contaReceberSchema`, `ContaReceberDTO`
   - `contaPagarSchema.ts`: `contaPagarSchema`, `ContaPagarDTO`
   - `projetoSchema.ts`: `projetoSchema`, `ProjetoDTO`
   - `contratoSchema.ts`: `contratoSchema`, `ContratoDTO`
   - `colaboradorSchema.ts`: `colaboradorSchema`, `ColaboradorDTO`
   - `fornecedorSchema.ts`: `fornecedorSchema`, `FornecedorDTO`
   - `cobrancaSchema.ts`: `cobrancaSchema`, `CobrancaDTO`
   - `auditLogSchema.ts`: `auditLogSchema`, `AuditLogDTO`
   - `index.ts`: Barrel export exporting all schemas and DTO types from `src/schemas/`.

2. **Supabase SDK Services (`src/services/`)**:
   Implement type-safe Supabase SDK services wrapping `@/lib/supabaseClient` with Zod validation and snake_case 3NF database column mappings (`tenant_id`, `razao_social`, `nome_fantasia`, `valor_original`, `valor_pago`, `valor_recebido`, `saldo_devedor`, `net_balance`, `data_vencimento`, `data_pagamento`, etc.):
   - `clienteService.ts` (Verify existing, ensure exports)
   - `userService.ts`: `getUsers()`, `getCurrentUser()`, `saveUser()`, `updateUserProfile()`
   - `contaReceberService.ts`: `getContasReceber()`, `saveContaReceber()`, `deleteContaReceber()`, `baixarTitulo()`
   - `contaPagarService.ts`: `getContasPagar()`, `saveContaPagar()`, `deleteContaPagar()`, `pagarConta()`
   - `projetoService.ts`: `getProjetos()`, `getProjetoById()`, `saveProjeto()`, `deleteProjeto()`, `updateProgresso()`
   - `contratoService.ts`: `getContratos()`, `saveContrato()`, `deleteContrato()`
   - `colaboradorService.ts`: `getColaboradores()`, `saveColaborador()`, `deleteColaborador()`
   - `fornecedorService.ts`: `getFornecedores()`, `saveFornecedor()`, `deleteFornecedor()`
   - `cobrancaService.ts`: `getCobrancas()`, `saveCobranca()`, `avancarEtapaCobranca()`
   - `auditLogService.ts`: `getAuditLogs()`, `logAction()`
   - `index.ts`: Barrel export exporting all services from `src/services/`.

3. **Build & Type-Check Verification**:
   - Run `npx tsc --noEmit` to verify zero static type errors.
   - Run `npm run build` to verify production bundle compilation.

4. **Deliver Handoff Report**:
   Write `handoff.md` in `c:\Focuserp\.agents\teamwork_preview_worker_m2\handoff.md` with:
   - Summary of implemented schemas and services
   - Results of `npx tsc --noEmit` and `npm run build`
   - File paths created/modified.
