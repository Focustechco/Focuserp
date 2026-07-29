# Handoff Report — Adversarial Verification 1 (Milestone 2)

**Verdict**: **FAIL**  
**Role**: Empirical Challenger (Critic / Specialist)  
**Target**: Zod Schemas (`src/schemas/*`) & Supabase Services (`src/services/*`) & Database Schema (`supabase_schema.sql`)

---

## 1. Observation

### 1.1 Compilation Verification (Task 4)
- **Command**: `npm run build`
- **Result**: `✓ built in 2.45s`
- **Details**: TypeScript compilation and Nitro server build passed cleanly without build errors.

### 1.2 Database Schema Alignment Discrepancies (Task 3)
- **Observed**:
  - `contratoService.ts:11` references `supabase.from('contratos')` and line 84 performs `upsert` on `'contratos'`.
  - `cobrancaService.ts:11` references `supabase.from('cobrancas')` and line 78 performs `upsert` on `'cobrancas'`.
  - `colaboradorService.ts:11` references `supabase.from('colaboradores')` and line 71 performs `upsert` on `'colaboradores'`.
  - Inspection of `supabase_schema.sql` (lines 1-428) reveals tables: `tenants`, `users`, `clientes`, `cliente_contatos`, `fornecedores`, `contas_receber`, `contas_receber_parcelas`, `contas_pagar`, `contas_pagar_parcelas`, `projetos`, and `audit_logs`.
  - **Missing SQL Tables**: Tables `contratos`, `cobrancas`, and `colaboradores` **DO NOT EXIST** in `supabase_schema.sql`.
- **Observed in `clienteService.ts`**:
  - `supabase_schema.sql:82`: `tenant_id UUID NOT NULL REFERENCES tenants(id)`
  - `clienteService.ts:81-97`:
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
  - **Missing Column in Payload**: `tenant_id` is missing from the payload object created in `saveCliente()`.
- **Observed Dropped Fields**:
  - `clienteService.ts: saveCliente()` drops schema fields `inscricaoEstadual`, `inscricaoMunicipal`, `dataFundacaoNascimento`, `porteEmpresa`, `site`, `observacoes`, `endereco.complemento`, `endereco.pais`.
  - `contaPagarService.ts`: `contaPagarSchema` defines `centroCusto`, but `contas_pagar` table in `supabase_schema.sql` lacks `centro_custo` column and `saveContaPagar()` drops it.
  - `projetoService.ts`: `projetoSchema` defines `orcamentoEstimado` and `getProjetos()` attempts `item.orcamento_estimado`, but `projetos` table in `supabase_schema.sql` lacks `orcamento_estimado` column and `saveProjeto()` drops it.

### 1.3 Schema Boundary & Validation Defects (Task 1)
- **Flawed Email Validation Pattern**:
  - `clienteSchema.ts:22`: `email: z.string().email('E-mail do contato é inválido').or(z.string().default(''))`
  - `colaboradorSchema.ts:8`: `email: z.string().email('E-mail inválido').or(z.string().default(''))`
  - `fornecedorSchema.ts:10`: `email: z.string().email('E-mail inválido').or(z.string().default(''))`
  - When passed an invalid email string like `"invalid-email-string"`, Zod fails `.email()`, but evaluates `.or(z.string().default(''))`. Since `"invalid-email-string"` is a string, `z.string()` accepts it! Invalid email strings pass validation without error.
- **Unconstrained Numeric Boundaries**:
  - `cobrancaSchema.ts`: `valorTotal` and `diasAtraso` lack `.min(0)` constraints (accept negative values).
  - `colaboradorSchema.ts`: `salarioBase` lacks `.min(0)` constraint (accepts negative numbers).
  - `projetoSchema.ts`: `horasPlanejadas` and `horasRealizadas` lack `.min(0)` constraints.
- **Strict Enums Operating Correctly**:
  - Enums in `clienteSchema` (`tipo`, `status`), `cobrancaSchema` (`status`), `colaboradorSchema` (`status`), `contaPagarSchema` (`status`), `contaReceberSchema` (`status`), `contratoSchema` (`status`), `fornecedorSchema` (`status`), `projetoSchema` (`prioridade`, `status`), and `userSchema` (`status`) correctly reject invalid enum strings (e.g. `'INVALID'`, `'BLOQUEADO'`, `'PAGO'`).

### 1.4 Service Execution & Error Handling Defects (Task 2)
- **Unhandled Property Access Crash in `clienteService.ts`**:
  - Line 24: `codigo: item.codigo || 'CLI-' + item.id.slice(0, 4).toUpperCase()`
  - If a DB record returns `item.id` as `null` or `undefined`, `item.id.slice()` throws `TypeError: Cannot read properties of undefined (reading 'slice')`. The `try...catch` block in `getClientes()` catches the unhandled exception and returns `[]`, silently losing all client records.
- **Silent Validation Bypass**:
  - Across all 10 services, when mapping database rows to DTOs:
    ```ts
    const parsed = schema.safeParse(mapped);
    return parsed.success ? parsed.data : (mapped as DTO);
    ```
  - When `parsed.success` is `false` (malformed data), the services return `mapped as DTO` instead of filtering out or handling corrupt rows. Corrupt records bypass Zod guarantees.
- **False Success Reporting on Upsert Errors**:
  - In `saveCliente`, `saveContaPagar`, `saveContaReceber`, `saveProjeto`, `saveUser`, `saveContrato`, `saveFornecedor`, `saveCobranca`, `saveColaborador`:
    ```ts
    const { error } = await supabase.from('...').upsert(payload);
    if (error) {
      console.warn('[service] Fallback upsert devido a erro:', error.message);
    }
    return { ...validated, id };
    ```
  - When database upsert fails (e.g. RLS policy violation or network failure), the services log a warning but still return the object as if saved successfully. Caller code cannot detect database save failures.

---

## 2. Logic Chain

1. **Premise 1**: A service SDK layer in a production multi-tenant architecture must interact with valid, existing database tables defined in the schema DDL (`supabase_schema.sql`).
   - **Observation**: `contratoService`, `cobrancaService`, and `colaboradorService` target tables `contratos`, `cobrancas`, and `colaboradores`.
   - **Observation**: `supabase_schema.sql` contains no definitions for these 3 tables.
   - **Deduction**: Running any database queries against `contratoService`, `cobrancaService`, or `colaboradorService` will result in database errors (`relation does not exist`).

2. **Premise 2**: Multi-tenant RLS and table constraints in `supabase_schema.sql` require mandatory non-null foreign keys (such as `tenant_id`).
   - **Observation**: Table `clientes` defines `tenant_id UUID NOT NULL`.
   - **Observation**: `clienteService.saveCliente()` constructs `payload` without `tenant_id`.
   - **Deduction**: All `saveCliente()` calls to Supabase will fail database constraint validation.

3. **Premise 3**: Zod schemas are intended to guarantee input sanitization and type validity.
   - **Observation**: `contatoSchema`, `colaboradorSchema`, and `fornecedorSchema` use `z.string().email().or(z.string().default(''))`.
   - **Deduction**: Invalid email strings pass validation because `.or(z.string())` matches any string.

4. **Premise 4**: Data mapper methods must handle missing/null properties gracefully without throwing unhandled TypeErrors.
   - **Observation**: `clienteService.ts:24` calls `item.id.slice(0, 4)` without checking if `item.id` is null or undefined.
   - **Deduction**: Null `item.id` causes `getClientes()` to throw a `TypeError` and silently return empty arrays `[]`.

---

## 3. Caveats

- **Network Environment**: Verifications were conducted in a CODE_ONLY environment with local source files and build tools; live network calls to a remote Supabase deployment were simulated via SQL DDL and service code structure analysis.
- No other caveats.

---

## 4. Conclusion

Milestone 2 implementation passes build compilation (`npm run build`), but fails empirical verification due to 6 critical issues:
1. 3 SDK services reference non-existent database tables (`contratos`, `cobrancas`, `colaboradores`).
2. `clienteService.saveCliente` omits required `tenant_id` column in upsert payloads.
3. 3 Zod schemas contain a flawed email validation OR-clause that accepts invalid email strings.
4. `clienteService.ts:24` contains an unhandled `TypeError` vulnerability when `item.id` is missing.
5. Service mapping functions silently return unvalidated malformed records (`mapped as DTO`) when Zod validation fails.
6. `save*` service methods falsely report success to caller code even when Supabase operations fail.

**Verdict**: **FAIL**

---

## 5. Verification Method

To independently verify these findings:

1. **Compilation Check**:
   ```bash
   npm run build
   ```
   (Confirms clean build, 0 compilation errors).

2. **Database Alignment Inspection**:
   - Inspect `supabase_schema.sql` for `CREATE TABLE` statements. Verify absence of `contratos`, `cobrancas`, and `colaboradores`.
   - Compare `clienteService.ts:81-97` payload with `clientes` definition at `supabase_schema.sql:80-111`. Note missing `tenant_id`.

3. **Schema Email Fallback Verification**:
   - Execute test harness `c:\Focuserp\test_harness\test_schemas.ts` or run in node:
     ```ts
     import { clienteSchema } from './src/schemas/clienteSchema';
     const r = clienteSchema.safeParse({
       codigo: 'C1', tipo: 'Pessoa Jurídica', razaoSocial: 'R', nomeFantasia: 'F', documento: 'D',
       endereco: {}, contatos: [{ nome: 'N', email: 'invalid-email-string' }]
     });
     console.log(r.success); // Prints TRUE (Flaw confirmed)
     ```
