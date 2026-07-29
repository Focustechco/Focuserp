# Milestone 2 Remediation Plan & Analysis Report: Zod Schemas & Supabase SDK Services

**Target Agent / Role**: Implementer Agent
**Author**: `teamwork_preview_explorer_m2_rem`
**Date**: 2026-07-29
**Workspace Directory**: `c:\Focuserp\.agents\teamwork_preview_explorer_m2_rem`

---

## Executive Summary

This report delivers a full root-cause analysis and actionable remediation plan for Milestone 2 defects in **Focuserp** (`src/schemas/`, `src/services/`, and `supabase_schema.sql`). The identified defects span database schema misalignments (missing DDL tables and unmapped fields), flawed Zod validations (broken email union logic, unconstrained financial numbers, untyped UUIDs and dates), and dangerous service patterns (false success returns on Supabase errors, unsafe property access, and raw unvalidated type casts).

---

## 1. Observation

### 1.1 Database Schema & Table Alignment Defects
- **Missing Tables in DDL**:
  - `src/services/contratoService.ts` (lines 10-18, 84) queries `contratos`.
  - `src/services/cobrancaService.ts` (lines 10-18, 78) queries `cobrancas`.
  - `src/services/colaboradorService.ts` (lines 10-13, 71) queries `colaboradores`.
  - `supabase_schema.sql` (lines 1-428) defines 11 tables (`tenants`, `users`, `clientes`, `cliente_contatos`, `fornecedores`, `contas_receber`, `contas_receber_parcelas`, `contas_pagar`, `contas_pagar_parcelas`, `projetos`, `audit_logs`). Tables `contratos`, `cobrancas`, `colaboradores` do **NOT exist**.
  - Dynamic RLS PL/pgSQL loop in `supabase_schema.sql` (lines 399-410) excludes `contratos`, `cobrancas`, `colaboradores`.
- **Missing `tenant_id` in Client Schema and Persist Payload**:
  - `supabase_schema.sql` line 82: `tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE`.
  - `src/schemas/clienteSchema.ts` (lines 26-45): `clienteSchema` lacks `tenantId`.
  - `src/services/clienteService.ts` (lines 81-97): `saveCliente` payload omits `tenant_id`.
- **8 Dropped Database Columns in `clienteService.saveCliente`**:
  - `supabase_schema.sql` defines: `inscricao_estadual` (l.88), `inscricao_municipal` (l.89), `data_fundacao_nascimento` (l.90), `porte_empresa` (l.93), `site` (l.94), `observacoes` (l.95), `complemento` (l.101), `pais` (l.105).
  - `src/services/clienteService.ts` lines 81-97: payload excludes ALL 8 fields.
- **Child Tables / Contatos Persistence**:
  - Table `cliente_contatos` is defined in `supabase_schema.sql` (lines 122-136).
  - `clienteService.saveCliente` does not write to `cliente_contatos`. `clienteService.getClientes` hardcodes dummy contact objects (lines 40-51) instead of querying `cliente_contatos`.

### 1.2 Zod Validation Defects (`src/schemas/`)
- **Flawed Email Validation Logic**:
  - `src/schemas/clienteSchema.ts` (line 22): `email: z.string().email('...').or(z.string().default(''))`
  - `src/schemas/colaboradorSchema.ts` (line 8): `email: z.string().email('...').or(z.string().default(''))`
  - `src/schemas/fornecedorSchema.ts` (line 10): `email: z.string().email('...').or(z.string().default(''))`
  - *Observation*: `.or(z.string())` matches ANY string (e.g. `"not-an-email"`).
- **Missing `.min(0)` Financial & Quantity Constraints**:
  - `cobrancaSchema.ts`: `valorTotal` (l.9), `diasAtraso` (l.10) lack `.min(0)`.
  - `colaboradorSchema.ts`: `salarioBase` (l.11) lacks `.min(0)`.
  - `contratoSchema.ts`: `valorMensal` (l.11) lacks `.min(0)`.
  - `contaPagarSchema.ts`: `desconto` (l.13), `multa` (l.14), `juros` (l.15), `valorPago` (l.17) lack `.min(0)`.
  - `contaReceberSchema.ts`: `desconto` (l.12), `multa` (l.13), `juros` (l.14), `valorRecebido` (l.16) lack `.min(0)`.
  - `projetoSchema.ts`: `orcamentoEstimado` (l.14), `valorContratado` (l.15), `valorRecebido` (l.16), `horasPlanejadas` (l.24), `horasRealizadas` (l.25) lack `.min(0)`.
- **Unvalidated Date & UUID Strings**:
  - Optional IDs (`id`, `tenantId`, `clienteId`, `fornecedorId`, etc.) and dates (`dataInicio`, `dataVencimento`, etc.) across all schema files are untyped plain strings.

### 1.3 Service Safety & Error Handling Defects (`src/services/`)
- **Unsafe String Method Crash**:
  - `src/services/clienteService.ts` line 24: `item.id.slice(0, 4)`. Throws `TypeError` if `item.id` is null/undefined.
- **Unsafe `mapped as DTO` Type Casting on Parsing Failure**:
  - Used in 10 services (`clienteService.ts` l.56, `contratoService.ts` l.43, `cobrancaService.ts` l.40, `colaboradorService.ts` l.32, `contaPagarService.ts` l.65, `contaReceberService.ts` l.66, `fornecedorService.ts` l.41, `projetoService.ts` l.55, `auditLogService.ts` l.41, `userService.ts` l.41):
    `return parsed.success ? parsed.data : mapped as DTO;`
- **False Success Returns on Supabase API Errors**:
  - All `save*` and `delete*` service methods intercept Supabase errors, log a `console.warn`, and return a mock/success DTO without throwing an error (e.g. `clienteService.ts` l.100-102, 112-114; `contratoService.ts` l.85-87, 97-99; `cobrancaService.ts` l.79-81; `colaboradorService.ts` l.72-74, 84-86; `contaPagarService.ts` l.118-120, 130-132; `contaReceberService.ts` l.119-121, 129-131; `fornecedorService.ts` l.90-92, 102-104; `projetoService.ts` l.112-114, 124-126; `userService.ts` l.134-136; `auditLogService.ts` l.80-82).

---

## 2. Logic Chain

1. **Database Table Missing Risk**:
   - Querying non-existent tables (`contratos`, `cobrancas`, `colaboradores`) causes PostgreSQL error `42P01` (`relation "..." does not exist`) in Supabase environment.
   - Adding DDL for these 3 tables and updating the PL/pgSQL RLS loop ensures tenant isolation and query execution success.

2. **Data Truncation & NULL Constraint Violations**:
   - `supabase_schema.sql` defines `tenant_id` on `clientes` as `NOT NULL`. Excluding `tenant_id` in `clienteService.saveCliente` triggers SQL NULL violations or RLS policy blocks.
   - Dropping 8 client columns (`complemento`, `pais`, `inscricao_estadual`, `inscricao_municipal`, `data_fundacao_nascimento`, `porte_empresa`, `site`, `observacoes`) causes permanent loss of client details submitted via forms.

3. **Zod Validation Bypass**:
   - `z.string().email().or(z.string())` allows any string through the second union branch. Changing this to `z.union([z.string().email(), z.literal('')])` restricts values strictly to valid email strings or empty strings.
   - Adding `.min(0)` prevents negative currency values from corrupting financial totals.
   - Adding `z.string().uuid()` and ISO date regex prevents invalid database key formats.

4. **False Success & Unsafe Cast Risks**:
   - When Supabase returns an error (e.g. database connectivity issue or RLS denial), suppressing it with `console.warn` tricks UI components into thinking persistence succeeded. Mutation methods MUST throw errors.
   - Returning `mapped as DTO` when `safeParse` fails bypasses Zod validation completely. Parsing errors MUST be logged and invalid records filtered out.
   - `item.id.slice(0, 4)` crashes runtime when `item.id` is missing. Replacing with optional chaining `item.id?.slice(0, 4) || crypto.randomUUID()` prevents application failure.

---

## 3. Caveats

- **Scope Limits**: Investigation focused on schema/service alignment in `src/schemas/`, `src/services/`, and `supabase_schema.sql`. UI component state management in `features/` was inspected for service contracts but not rewritten.
- **Assumptions**: The system uses Keycloak / Supabase Auth multi-tenant architecture where `tenant_id` is supplied in JWT or via DTO session state.
- **Alternative Considered**: Modifying service methods to fall back to `clients` table for contracts/colaboradores was rejected in favor of adding formal DDL to `supabase_schema.sql`, preserving clean 3NF database design.

---

## 4. Conclusion & Concrete Code Remediation Specification

### Step 1: Update `supabase_schema.sql`
Add table DDLs for `contratos`, `cobrancas`, `colaboradores`, enable RLS, add triggers, and update the RLS dynamic policy array:

```sql
-- ------------------------------------------------------------------------------
-- 10. TABELA DE CONTRATOS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contratos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    numero_contrato VARCHAR(50) NOT NULL,
    objeto_contrato TEXT NOT NULL,
    valor_total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_mensal NUMERIC(15,2) DEFAULT 0.00,
    tipo_contrato VARCHAR(100) DEFAULT 'Prestação de Serviços',
    data_inicio DATE NOT NULL,
    data_fim DATE,
    status VARCHAR(30) DEFAULT 'Ativo',
    renovacao_automatica BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_contratos_tenant_numero UNIQUE (tenant_id, numero_contrato)
);
CREATE INDEX IF NOT EXISTS idx_contratos_tenant ON contratos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contratos_cliente ON contratos(cliente_id);
DROP TRIGGER IF EXISTS trg_contratos_updated_at ON contratos;
CREATE TRIGGER trg_contratos_updated_at BEFORE UPDATE ON contratos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 11. TABELA DE COBRANÇAS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cobrancas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    titulo_id UUID,
    valor_total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    dias_atraso INT DEFAULT 0,
    etapa_atual VARCHAR(100) DEFAULT 'Lembrete Preventivo',
    status VARCHAR(30) DEFAULT 'Em Aberto',
    historico_interacoes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cobrancas_tenant ON cobrancas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_cliente ON cobrancas(cliente_id);
DROP TRIGGER IF EXISTS trg_cobrancas_updated_at ON cobrancas;
CREATE TRIGGER trg_cobrancas_updated_at BEFORE UPDATE ON cobrancas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 12. TABELA DE COLABORADORES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS colaboradores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    nome_completo VARCHAR(255) NOT NULL,
    cpf VARCHAR(20),
    email VARCHAR(255),
    cargo VARCHAR(100) DEFAULT 'Colaborador',
    departamento VARCHAR(100) DEFAULT 'Geral',
    salario_base NUMERIC(15,2) DEFAULT 0.00,
    data_admissao DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_colaboradores_tenant ON colaboradores(tenant_id);
DROP TRIGGER IF EXISTS trg_colaboradores_updated_at ON colaboradores;
CREATE TRIGGER trg_colaboradores_updated_at BEFORE UPDATE ON colaboradores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Enable & PL/pgSQL Policy Array update
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobrancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;

-- Update dynamic policy loop array to include new tables:
tables text[] := ARRAY[
    'users',
    'clientes',
    'cliente_contatos',
    'fornecedores',
    'contas_receber',
    'contas_receber_parcelas',
    'contas_pagar',
    'contas_pagar_parcelas',
    'projetos',
    'audit_logs',
    'contratos',
    'cobrancas',
    'colaboradores'
];
```

---

### Step 2: Remediate Zod Validation Schemas (`src/schemas/`)

#### 2.1 Standard Helpers (`src/schemas/helpers.ts` or inline)
```ts
export const optionalUuid = z.union([z.string().uuid('UUID inválido'), z.literal('')]).optional();
export const optionalEmail = z.union([z.string().email('E-mail inválido'), z.literal('')]).optional().default('');
export const optionalDate = z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Data inválida'), z.literal('')]).optional();
```

#### 2.2 `src/schemas/clienteSchema.ts`
- Add `tenantId: optionalUuid` to `clienteSchema`.
- Fix email validation in `contatoSchema`: `email: optionalEmail`.
- Add `id: optionalUuid` to `contatoSchema`.

#### 2.3 `src/schemas/colaboradorSchema.ts`
- `email: optionalEmail`
- `salarioBase: z.number().min(0, 'Salário base deve ser maior ou igual a zero').default(0)`
- `id: optionalUuid`, `tenantId: optionalUuid`

#### 2.4 `src/schemas/fornecedorSchema.ts`
- `email: optionalEmail`
- `id: optionalUuid`, `tenantId: optionalUuid`

#### 2.5 `src/schemas/contratoSchema.ts`
- `valorTotal: z.number().min(0, 'Valor total deve ser maior ou igual a zero')`
- `valorMensal: z.number().min(0, 'Valor mensal deve ser maior ou igual a zero').default(0)`

#### 2.6 `src/schemas/cobrancaSchema.ts`
- `valorTotal: z.number().min(0, 'Valor total deve ser maior ou igual a zero').default(0)`
- `diasAtraso: z.number().min(0, 'Dias de atraso deve ser maior ou igual a zero').default(0)`

#### 2.7 `src/schemas/contaPagarSchema.ts`
- `valorOriginal: z.number().min(0, 'Valor original deve ser maior ou igual a zero')`
- `desconto: z.number().min(0).default(0)`, `multa: z.number().min(0).default(0)`, `juros: z.number().min(0).default(0)`, `valorPago: z.number().min(0).default(0)`

#### 2.8 `src/schemas/contaReceberSchema.ts`
- `valorOriginal: z.number().min(0, 'Valor original deve ser maior ou igual a zero')`
- `desconto: z.number().min(0).default(0)`, `multa: z.number().min(0).default(0)`, `juros: z.number().min(0).default(0)`, `valorRecebido: z.number().min(0).default(0)`

#### 2.9 `src/schemas/projetoSchema.ts`
- `orcamentoEstimado: z.number().min(0).optional().default(0)`
- `valorContratado: z.number().min(0).default(0)`, `valorRecebido: z.number().min(0).default(0)`
- `horasPlanejadas: z.number().min(0).default(0)`, `horasRealizadas: z.number().min(0).default(0)`

---

### Step 3: Remediate SDK Service Implementations (`src/services/`)

#### 3.1 `src/services/clienteService.ts`
1. Fix `.slice` crash:
   `codigo: item.codigo || 'CLI-' + (item.id?.slice(0, 4) || crypto.randomUUID().slice(0, 4)).toUpperCase()`
2. Update `saveCliente` to include `tenant_id` and all 8 previously dropped columns:
   ```ts
   const payload = {
     id,
     tenant_id: validated.tenantId,
     codigo: validated.codigo,
     tipo: validated.tipo,
     razao_social: validated.razaoSocial,
     nome_fantasia: validated.nomeFantasia,
     documento: validated.documento,
     inscricao_estadual: validated.inscricaoEstadual,
     inscricao_municipal: validated.inscricaoMunicipal,
     data_fundacao_nascimento: validated.dataFundacaoNascimento,
     status: validated.status,
     segmento: validated.segmento,
     porte_empresa: validated.porteEmpresa,
     site: validated.site,
     observacoes: validated.observacoes,
     cep: validated.endereco.cep,
     logradouro: validated.endereco.logradouro,
     numero: validated.endereco.numero,
     complemento: validated.endereco.complemento,
     bairro: validated.endereco.bairro,
     cidade: validated.endereco.cidade,
     estado: validated.endereco.estado,
     pais: validated.endereco.pais,
     updated_at: new Date().toISOString()
   };
   ```
3. Map `cliente_contatos` persistence in `saveCliente` and query `cliente_contatos` in `getClientes`.
4. Fix false success:
   ```ts
   const { error } = await supabase.from('clientes').upsert(payload);
   if (error) {
     console.error('[clienteService.saveCliente] Erro ao salvar cliente:', error);
     throw new Error(`Falha ao salvar cliente: ${error.message}`);
   }
   ```
5. Eliminate `mapped as ClienteDTO` cast on parse failure:
   Filter invalid parsed items and log parsing format error.

#### 3.2 Standardize Error Handling & Type Safety Across ALL Services
Apply the following strict pattern to `contratoService`, `cobrancaService`, `colaboradorService`, `contaPagarService`, `contaReceberService`, `fornecedorService`, `projetoService`, `userService`, `auditLogService`:

**1. Query Fetch Pattern (`get*`)**:
```ts
if (!error && data && data.length > 0) {
  const result: DTO[] = [];
  for (const item of data) {
    const mapped = { ... };
    const parsed = schema.safeParse(mapped);
    if (parsed.success) {
      result.push(parsed.data);
    } else {
      console.error(`[serviceName.get] Schema validation error for item ${item.id}:`, parsed.error.format());
    }
  }
  return result;
}
```

**2. Mutation Methods (`save*`, `delete*`, `pagarConta`, `baixarTitulo`, `avancarEtapaCobranca`, etc.)**:
```ts
const { error } = await supabase.from('table_name').upsert(payload);
if (error) {
  console.error(`[serviceName.save] Supabase error:`, error);
  throw new Error(`Falha ao salvar no banco de dados: ${error.message}`);
}
```

---

## 5. Verification Method

1. **Static Analysis & Type Checking**:
   - Run `npx tsc --noEmit` to verify all Zod DTO inferences match service payload objects.
   - Run `npm run lint` to verify clean code formatting.
2. **Schema Validation Tests**:
   - Attempt to parse `"not-an-email"` in `contatoSchema`, `colaboradorSchema`, `fornecedorSchema` — must FAIL validation.
   - Attempt to parse negative financial numbers (e.g. `valorTotal: -50`) — must FAIL validation.
3. **Service & Database Safety Tests**:
   - Call `saveCliente` with full client payload — verify `tenant_id`, `complemento`, `pais`, `inscricao_estadual`, `inscricao_municipal`, `data_fundacao_nascimento`, `porte_empresa`, `site`, `observacoes` are present in payload.
   - Simulate a Supabase error on `save*` or `delete*` — verify method THROWS an error instead of returning mock success DTO.
   - Verify `contratos`, `cobrancas`, `colaboradores` DDL execute without errors on Supabase PostgreSQL engine.
