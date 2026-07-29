# Handoff Report: Milestone 1 Database Architecture & Schema Strategy (3NF, RLS, Keycloak)

## 1. Observation

### 1.1 Legacy Database & Storage Infrastructure
- **`supabase_schema.sql` (lines 7-13)**: The current database structure consists of a single Document Store table `focus_app_state (table_name TEXT, id TEXT, data JSONB, updated_at TIMESTAMPTZ)`.
- **`supabase_schema.sql` (lines 18-31)**: RLS on `focus_app_state` is currently set to public read and write (`USING (true)` and `WITH CHECK (true)`), presenting zero multi-tenant data isolation.
- **`src/hooks/useDataStore.ts` (lines 80-267)**: Data persistence uses a hybrid mechanism. The `clients` table in Supabase is hijacked to store stringified JSON blobs in a `contact_email` column under synthetic UUIDs (`__FOCUS_STATE__<table_name>`) alongside fallback reads/writes to `focus_app_state` and local browser `localStorage`.
- **`tables.txt`**: Lists 99 legacy conceptual tables (`focus_clientes`, `focus_contas_receber`, `focus_contas_pagar`, `focus_projetos`, `focus_usuarios`, etc.) that were serialized as JSONB blobs into the single store.

### 1.2 Identified Domain Entities & Data Structures in `src/`
- **`src/features/clientes/types.ts` & `src/schemas/clienteSchema.ts`**:
  - `Cliente`: `id`, `codigo`, `tipo` ('Pessoa Física' | 'Pessoa Jurídica'), `razaoSocial`, `nomeFantasia`, `documento` (CPF/CNPJ), `inscricaoEstadual`, `inscricaoMunicipal`, `dataFundacaoNascimento`, `status` ('Ativo' | 'Inativo'), `segmento`, `porteEmpresa`, `site`, `observacoes`, `endereco` (cep, logradouro, numero, complemento, bairro, cidade, estado, pais), `contatos` (`Contato[]`), `dataCadastro`, `ultimaAtualizacao`.
- **`src/features/contas-receber/types.ts`**:
  - `TituloReceber`: `id`, `numero`, `cliente`, `descricao`, `categoria`, `valorOriginal`, `valorRecebido`, `saldo`, `dataEmissao`, `dataVencimento`, `dataRecebimento`, `formaPagamento`, `status`, `responsavel`, `desconto`, `multa`, `juros`, `valorLiquido`, `competencia`, `observacoes`, `tags`, `historico`, `parcelas`, `recorrente`, `recorrenciaFrequencia`, `recorrenciaFim`.
- **`src/features/contas-pagar/types.ts`**:
  - `ContaPagar`: `id`, `numero`, `fornecedor`, `descricao`, `categoria`, `valorOriginal`, `valorPago`, `saldo`, `dataEmissao`, `dataVencimento`, `dataPagamento`, `formaPagamento`, `status`, `responsavel`, `desconto`, `multa`, `juros`, `valorFinal`, `competencia`, `observacoes`, `tags`, `historico`, `parcelas`, `recorrente`, `recorrenciaFrequencia`, `recorrenciaFim`.
- **`src/features/projetos/types.ts`**:
  - `Projeto`: `id`, `codigo`, `nome`, `idCliente`, `idContrato`, `tipo`, `categoria`, `responsavelPrincipal`, `prioridade`, `status`, `dataInicio`, `dataFinal`, `descricaoGeral`, `valorContratado`, `valorRecebido`, `saldoRestante`, `progressoGlobal`, `horasPlanejadas`, `horasRealizadas`, `ultimaAtualizacao`.
- **`src/features/usuarios/types.ts`**:
  - `Usuario`: `id`, `foto`, `nome`, `nomeExibicao`, `email`, `telefone`, `cargo`, `departamento`, `matricula`, `status` ('Ativo' | 'Inativo' | 'Bloqueado'), `perfil`, `rolesComplementares`, `mfaHabilitado`, `ultimoLogin`, `tentativasFalhas`, `sessoes`, `permissoes` (`MatrizPermissoes`), `auditoria`.

### 1.3 Authentication & Deployment Configuration
- **`src/lib/supabaseClient.ts`**: Initialized with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- **`.github/workflows/ci-cd.yml`**: Runs `npx tsc --noEmit`, `npm run lint`, and `npm run build` using secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

---

## 2. Logic Chain

1. **Need for 3NF Relational Schema**:
   - The current JSONB blob store (`focus_app_state`) and synthetic stringified `clients` rows hinder indexing, SQL queries, integrity constraints, and multi-tenant security.
   - Normalizing into PostgreSQL 3NF tables (`tenants`, `users`, `clientes`, `cliente_contatos`, `contas_receber`, `contas_receber_parcelas`, `contas_pagar`, `contas_pagar_parcelas`, `projetos`, `audit_logs`) guarantees data integrity, foreign key cascades, proper column typing (`NUMERIC`, `DATE`, `TIMESTAMPTZ`, `UUID`), and high-performance querying.

2. **Multi-Tenant RLS Enforcement (`auth.jwt() ->> 'tenant_id'`)**:
   - Every domain table must include `tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE`.
   - By creating a PostgreSQL STABLE function `get_auth_tenant_id()`, RLS policies evaluate `(auth.jwt() ->> 'tenant_id')::uuid`.
   - For local development / unauthenticated fallback, the policy allows queries if `auth.jwt()` is null or if `(auth.jwt() ->> 'role') = 'service_role'`.

3. **Keycloak JWT Integration**:
   - Keycloak issues JWT tokens containing custom claims, specifically `tenant_id`, `email`, `preferred_username`, and `realm_access.roles`.
   - Supabase Auth accepts Keycloak JWTs when configured with Keycloak's JWKS URI (`/realms/{realm}/protocol/openid-connect/certs`).
   - The frontend passes the Keycloak Access Token via the Supabase client headers. Supabase decodes the JWT and passes the claims to PostgreSQL's `auth.jwt()` context.

---

## 3. Caveats

- **Keycloak Custom Mapper**: Keycloak must be configured with a Protocol Mapper (User Attribute or Hardcoded claim) to include `"tenant_id": "<uuid>"` in the Access Token claims.
- **Development/Anon Fallback**: In environments where Keycloak is not yet active, the RLS helper function handles NULL JWTs gracefully so local development or seed scripts do not crash.
- **Generated/Calculated Columns**: Columns like `saldo` in `contas_receber` (`valor_original - valor_recebido`) and `contas_pagar` (`valor_original - valor_pago`) use PostgreSQL `GENERATED ALWAYS AS (...) STORED` to avoid drift.

---

## 4. Conclusion

Below is the definitive, production-ready DDL SQL schema specification to replace `supabase_schema.sql` for Milestone 1.

```sql
-- ==============================================================================
-- FOCUS ERP - DDL RELACIONAL 3NF & SEGURANÇA MULTI-TENANT (SUPABASE + KEYCLOAK)
-- ==============================================================================

-- 0. Extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. TABELA DE TENANTS (ORGANIZAÇÕES / EMPRESAS MULTI-TENANT)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    documento VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'ativo',
    plano VARCHAR(50) NOT NULL DEFAULT 'standard',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 2. TABELA DE USUÁRIOS (INTEGRAÇÃO KEYCLOAK / AUTH)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    keycloak_sub VARCHAR(255) UNIQUE,
    auth_user_id UUID UNIQUE,
    nome VARCHAR(255) NOT NULL,
    nome_exibicao VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    telefone VARCHAR(50),
    foto TEXT,
    cargo VARCHAR(100),
    departamento VARCHAR(100),
    matricula VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo', -- 'Ativo', 'Inativo', 'Bloqueado'
    perfil VARCHAR(50) NOT NULL DEFAULT 'Financeiro',
    roles_complementares TEXT[] DEFAULT '{}',
    mfa_habilitado BOOLEAN NOT NULL DEFAULT false,
    ultimo_login TIMESTAMPTZ,
    tentativas_falhas INT NOT NULL DEFAULT 0,
    permissoes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_keycloak_sub ON users(keycloak_sub);

-- ------------------------------------------------------------------------------
-- 3. TABELA DE CLIENTES E CONTATOS (3NF)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    tipo VARCHAR(30) NOT NULL DEFAULT 'Pessoa Jurídica', -- 'Pessoa Física', 'Pessoa Jurídica'
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255) NOT NULL,
    documento VARCHAR(20) NOT NULL, -- CPF/CNPJ
    inscricao_estadual VARCHAR(50),
    inscricao_municipal VARCHAR(50),
    data_fundacao_nascimento DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo', -- 'Ativo', 'Inativo'
    segmento VARCHAR(100) DEFAULT 'Geral',
    porte_empresa VARCHAR(50),
    site VARCHAR(255),
    observacoes TEXT,
    
    -- Endereço Incorporado (3NF)
    cep VARCHAR(10),
    logradouro VARCHAR(255),
    numero VARCHAR(20),
    complemento VARCHAR(255),
    bairro VARCHAR(100),
    cidade VARCHAR(100) DEFAULT 'São Paulo',
    estado VARCHAR(2) DEFAULT 'SP',
    pais VARCHAR(50) DEFAULT 'Brasil',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clientes_tenant ON clientes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clientes_documento ON clientes(tenant_id, documento);

CREATE TABLE IF NOT EXISTS cliente_contatos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    cargo VARCHAR(100) DEFAULT 'Responsável',
    departamento VARCHAR(100) DEFAULT 'Geral',
    telefone VARCHAR(50),
    celular VARCHAR(50),
    whatsapp BOOLEAN NOT NULL DEFAULT true,
    email VARCHAR(255),
    principal BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cliente_contatos_cliente ON cliente_contatos(cliente_id);

-- ------------------------------------------------------------------------------
-- 4. TABELA DE CONTAS A RECEBER E PARCELAS (FINANCEIRO)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contas_receber (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    numero VARCHAR(50) NOT NULL,
    cliente_nome VARCHAR(255),
    descricao VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) DEFAULT 'Geral',
    valor_original NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_recebido NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    saldo NUMERIC(15,2) GENERATED ALWAYS AS (valor_original - valor_recebido) STORED,
    data_emissao DATE NOT NULL,
    data_vencimento DATE NOT NULL,
    data_recebimento DATE,
    forma_pagamento VARCHAR(50) DEFAULT 'PIX',
    status VARCHAR(30) DEFAULT 'Pendente', -- 'Previsto', 'Pendente', 'Recebido', 'Recebido Parcialmente', 'Atrasado', 'Cancelado', 'Renegociado'
    responsavel VARCHAR(255),
    desconto NUMERIC(15,2) DEFAULT 0.00,
    multa NUMERIC(15,2) DEFAULT 0.00,
    juros NUMERIC(15,2) DEFAULT 0.00,
    valor_liquido NUMERIC(15,2),
    competencia VARCHAR(20),
    observacoes TEXT,
    tags TEXT[] DEFAULT '{}',
    recorrente BOOLEAN DEFAULT false,
    recorrencia_frequencia VARCHAR(30),
    recorrencia_fim DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contas_receber_tenant ON contas_receber(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_cliente ON contas_receber(cliente_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_status ON contas_receber(tenant_id, status);

CREATE TABLE IF NOT EXISTS contas_receber_parcelas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    conta_receber_id UUID NOT NULL REFERENCES contas_receber(id) ON DELETE CASCADE,
    numero INT NOT NULL,
    valor NUMERIC(15,2) NOT NULL,
    vencimento DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'Pendente',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cr_parcelas_conta ON contas_receber_parcelas(conta_receber_id);

-- ------------------------------------------------------------------------------
-- 5. TABELA DE CONTAS A PAGAR E PARCELAS (FINANCEIRO)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contas_pagar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    fornecedor_id UUID,
    numero VARCHAR(50) NOT NULL,
    fornecedor VARCHAR(255) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) DEFAULT 'Geral',
    valor_original NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_pago NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    saldo NUMERIC(15,2) GENERATED ALWAYS AS (valor_original - valor_pago) STORED,
    data_emissao DATE NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    forma_pagamento VARCHAR(50) DEFAULT 'PIX',
    status VARCHAR(30) DEFAULT 'Pendente', -- 'Previsto', 'Pendente', 'Pago', 'Pago Parcialmente', 'Vencido', 'Cancelado', 'Renegociado'
    responsavel VARCHAR(255),
    desconto NUMERIC(15,2) DEFAULT 0.00,
    multa NUMERIC(15,2) DEFAULT 0.00,
    juros NUMERIC(15,2) DEFAULT 0.00,
    valor_final NUMERIC(15,2),
    competencia VARCHAR(20),
    observacoes TEXT,
    tags TEXT[] DEFAULT '{}',
    recorrente BOOLEAN DEFAULT false,
    recorrencia_frequencia VARCHAR(30),
    recorrencia_fim DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_tenant ON contas_pagar(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_status ON contas_pagar(tenant_id, status);

CREATE TABLE IF NOT EXISTS contas_pagar_parcelas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    conta_pagar_id UUID NOT NULL REFERENCES contas_pagar(id) ON DELETE CASCADE,
    numero INT NOT NULL,
    valor NUMERIC(15,2) NOT NULL,
    vencimento DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'Pendente',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cp_parcelas_conta ON contas_pagar_parcelas(conta_pagar_id);

-- ------------------------------------------------------------------------------
-- 6. TABELA DE PROJETOS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projetos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    codigo VARCHAR(50) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    id_contrato VARCHAR(100),
    tipo VARCHAR(100) NOT NULL,
    categoria VARCHAR(100),
    responsavel_principal VARCHAR(255),
    prioridade VARCHAR(20) DEFAULT 'Média', -- 'Baixa', 'Média', 'Alta', 'Crítica'
    status VARCHAR(30) DEFAULT 'Planejamento',
    data_inicio DATE,
    data_final DATE,
    descricao_geral TEXT,
    valor_contratado NUMERIC(15,2) DEFAULT 0.00,
    valor_recebido NUMERIC(15,2) DEFAULT 0.00,
    saldo_restante NUMERIC(15,2) GENERATED ALWAYS AS (valor_contratado - valor_recebido) STORED,
    progresso_global NUMERIC(5,2) DEFAULT 0.00,
    horas_planejadas NUMERIC(10,2) DEFAULT 0.00,
    horas_realizadas NUMERIC(10,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projetos_tenant ON projetos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projetos_cliente ON projetos(cliente_id);

-- ------------------------------------------------------------------------------
-- 7. TABELA DE AUDIT LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    data_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
    acao VARCHAR(100) NOT NULL,
    modulo VARCHAR(100) NOT NULL,
    ip VARCHAR(45),
    dispositivo TEXT,
    detalhes TEXT,
    detalhes_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_modulo ON audit_logs(tenant_id, modulo);

-- ------------------------------------------------------------------------------
-- 8. FUNÇÃO HELPER E POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ------------------------------------------------------------------------------

-- Função para extrair o tenant_id do JWT do Keycloak/Supabase Auth
CREATE OR REPLACE FUNCTION get_auth_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(auth.jwt() ->> 'tenant_id', '')::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Habilitar RLS em todas as tabelas
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente_contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_receber ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_receber_parcelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_pagar_parcelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Política de Isolamento Multi-Tenant para Tenants
DROP POLICY IF EXISTS tenant_isolation_tenants ON tenants;
CREATE POLICY tenant_isolation_tenants ON tenants
    FOR SELECT
    USING (
        id = get_auth_tenant_id()
        OR (auth.jwt() ->> 'role') = 'service_role'
        OR auth.jwt() IS NULL
    );

-- Macros de Políticas RLS para Entidades Scoped por tenant_id
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'users',
        'clientes',
        'cliente_contatos',
        'contas_receber',
        'contas_receber_parcelas',
        'contas_pagar',
        'contas_pagar_parcelas',
        'projetos',
        'audit_logs'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_all_%I ON %I', tbl, tbl);
        EXECUTE format('
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
            )', tbl, tbl);
    END LOOP;
END $$;
```

---

## 5. Verification Method

To verify the DDL strategy and schema design:

1. **DDL Syntax & Execution Verification**:
   - Execute the SQL script above in Supabase SQL Editor or a local PostgreSQL instance.
   - Verify table creation: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`.
2. **RLS Policy Verification**:
   - Query policies: `SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE schemaname = 'public';`.
   - Ensure all 10 target tables have active policies checking `get_auth_tenant_id()`.
3. **Foreign Key & Constraint Verification**:
   - Confirm foreign key constraints on `tenant_id` for all domain tables using `information_schema.table_constraints`.
4. **Static Typecheck & Build Pipeline**:
   - Run `npx tsc --noEmit` and `npm run build` to ensure project integrity remains green.
