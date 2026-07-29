-- ==============================================================================
-- FOCUS ERP - DEFINITIVE 3NF DDL & MULTI-TENANT SECURITY (SUPABASE + KEYCLOAK)
-- REMEDIATED PRODUCTION-GRADE SCHEMA (MILESTONE 1 RE-EVALUATION)
-- ==============================================================================

-- 0. EXTENSÕES & RECURSOS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- FUNÇÃO DE TIMESTAMPS AUTOMÁTICOS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

DROP TRIGGER IF EXISTS trg_tenants_updated_at ON tenants;
CREATE TRIGGER trg_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 2. TABELA DE USUÁRIOS (INTEGRAÇÃO KEYCLOAK / AUTH)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    keycloak_sub VARCHAR(255),
    auth_user_id UUID,
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
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_users_tenant_email UNIQUE (tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_users_keycloak_sub ON users(keycloak_sub);

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_clientes_tenant_codigo UNIQUE (tenant_id, codigo),
    CONSTRAINT uq_clientes_tenant_documento UNIQUE (tenant_id, documento)
);

CREATE INDEX IF NOT EXISTS idx_clientes_tenant ON clientes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clientes_documento ON clientes(tenant_id, documento);

DROP TRIGGER IF EXISTS trg_clientes_updated_at ON clientes;
CREATE TRIGGER trg_clientes_updated_at
    BEFORE UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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

CREATE INDEX IF NOT EXISTS idx_cliente_contatos_tenant ON cliente_contatos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cliente_contatos_cliente ON cliente_contatos(cliente_id);

DROP TRIGGER IF EXISTS trg_cliente_contatos_updated_at ON cliente_contatos;
CREATE TRIGGER trg_cliente_contatos_updated_at
    BEFORE UPDATE ON cliente_contatos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 4. TABELA DE FORNECEDORES (3NF)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fornecedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    codigo VARCHAR(50),
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(50),
    categoria VARCHAR(100) DEFAULT 'Geral',
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo', -- 'Ativo', 'Inativo'
    cep VARCHAR(10),
    logradouro VARCHAR(255),
    numero VARCHAR(20),
    complemento VARCHAR(255),
    bairro VARCHAR(100),
    cidade VARCHAR(100) DEFAULT 'São Paulo',
    estado VARCHAR(2) DEFAULT 'SP',
    pais VARCHAR(50) DEFAULT 'Brasil',
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_fornecedores_tenant_cnpj UNIQUE (tenant_id, cnpj)
);

CREATE INDEX IF NOT EXISTS idx_fornecedores_tenant ON fornecedores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_cnpj ON fornecedores(tenant_id, cnpj);

DROP TRIGGER IF EXISTS trg_fornecedores_updated_at ON fornecedores;
CREATE TRIGGER trg_fornecedores_updated_at
    BEFORE UPDATE ON fornecedores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 5. TABELA DE CONTAS A RECEBER E PARCELAS (FINANCEIRO)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contas_receber (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    numero VARCHAR(50) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) DEFAULT 'Geral',
    valor_original NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    desconto NUMERIC(15,2) DEFAULT 0.00,
    multa NUMERIC(15,2) DEFAULT 0.00,
    juros NUMERIC(15,2) DEFAULT 0.00,
    valor_liquido NUMERIC(15,2) GENERATED ALWAYS AS (valor_original - COALESCE(desconto, 0) + COALESCE(multa, 0) + COALESCE(juros, 0)) STORED,
    valor_recebido NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    saldo NUMERIC(15,2) GENERATED ALWAYS AS ((valor_original - COALESCE(desconto, 0) + COALESCE(multa, 0) + COALESCE(juros, 0)) - valor_recebido) STORED,
    data_emissao DATE NOT NULL,
    data_vencimento DATE NOT NULL,
    data_recebimento DATE,
    forma_pagamento VARCHAR(50) DEFAULT 'PIX',
    status VARCHAR(30) DEFAULT 'Pendente', -- 'Previsto', 'Pendente', 'Recebido', 'Recebido Parcialmente', 'Atrasado', 'Cancelado', 'Renegociado'
    responsavel VARCHAR(255),
    competencia VARCHAR(20),
    observacoes TEXT,
    tags TEXT[] DEFAULT '{}',
    recorrente BOOLEAN DEFAULT false,
    recorrencia_frequencia VARCHAR(30),
    recorrencia_fim DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_contas_receber_tenant_numero UNIQUE (tenant_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_contas_receber_tenant ON contas_receber(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_cliente ON contas_receber(cliente_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_status ON contas_receber(tenant_id, status);

DROP TRIGGER IF EXISTS trg_contas_receber_updated_at ON contas_receber;
CREATE TRIGGER trg_contas_receber_updated_at
    BEFORE UPDATE ON contas_receber
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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

CREATE INDEX IF NOT EXISTS idx_cr_parcelas_tenant ON contas_receber_parcelas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cr_parcelas_conta ON contas_receber_parcelas(conta_receber_id);

-- ------------------------------------------------------------------------------
-- 6. TABELA DE CONTAS A PAGAR E PARCELAS (FINANCEIRO)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contas_pagar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    fornecedor_id UUID REFERENCES fornecedores(id) ON DELETE SET NULL,
    numero VARCHAR(50) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) DEFAULT 'Geral',
    valor_original NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    desconto NUMERIC(15,2) DEFAULT 0.00,
    multa NUMERIC(15,2) DEFAULT 0.00,
    juros NUMERIC(15,2) DEFAULT 0.00,
    valor_final NUMERIC(15,2) GENERATED ALWAYS AS (valor_original - COALESCE(desconto, 0) + COALESCE(multa, 0) + COALESCE(juros, 0)) STORED,
    valor_pago NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    saldo NUMERIC(15,2) GENERATED ALWAYS AS ((valor_original - COALESCE(desconto, 0) + COALESCE(multa, 0) + COALESCE(juros, 0)) - valor_pago) STORED,
    data_emissao DATE NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    forma_pagamento VARCHAR(50) DEFAULT 'PIX',
    status VARCHAR(30) DEFAULT 'Pendente', -- 'Previsto', 'Pendente', 'Pago', 'Pago Parcialmente', 'Vencido', 'Cancelado', 'Renegociado'
    responsavel VARCHAR(255),
    competencia VARCHAR(20),
    observacoes TEXT,
    tags TEXT[] DEFAULT '{}',
    recorrente BOOLEAN DEFAULT false,
    recorrencia_frequencia VARCHAR(30),
    recorrencia_fim DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_contas_pagar_tenant_numero UNIQUE (tenant_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_tenant ON contas_pagar(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_fornecedor ON contas_pagar(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_status ON contas_pagar(tenant_id, status);

DROP TRIGGER IF EXISTS trg_contas_pagar_updated_at ON contas_pagar;
CREATE TRIGGER trg_contas_pagar_updated_at
    BEFORE UPDATE ON contas_pagar
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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

CREATE INDEX IF NOT EXISTS idx_cp_parcelas_tenant ON contas_pagar_parcelas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cp_parcelas_conta ON contas_pagar_parcelas(conta_pagar_id);

-- ------------------------------------------------------------------------------
-- 7. TABELA DE PROJETOS
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
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_projetos_tenant_codigo UNIQUE (tenant_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_projetos_tenant ON projetos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projetos_cliente ON projetos(cliente_id);

DROP TRIGGER IF EXISTS trg_projetos_updated_at ON projetos;
CREATE TRIGGER trg_projetos_updated_at
    BEFORE UPDATE ON projetos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 8. TABELA DE AUDIT LOGS
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
-- 9. FUNÇÃO HELPER E POLÍTICAS RLS (ROW LEVEL SECURITY) - REMEDIADAS
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

-- Habilitar RLS em todas as 11 tabelas
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente_contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_receber ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_receber_parcelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_pagar_parcelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Política de Isolamento Multi-Tenant para Tenants (Sem facade OR auth.jwt() IS NULL)
DROP POLICY IF EXISTS tenant_isolation_tenants ON tenants;
CREATE POLICY tenant_isolation_tenants ON tenants
    FOR SELECT
    USING (
        id = get_auth_tenant_id()
        OR (auth.jwt() ->> 'role') = 'service_role'
    );

-- Dynamic PL/pgSQL Loop para as 10 entidades Scoped por tenant_id
DO $$
DECLARE
    tbl text;
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
            )
            WITH CHECK (
                tenant_id = get_auth_tenant_id()
                OR (auth.jwt() ->> ''role'') = ''service_role''
            )', tbl, tbl);
    END LOOP;
END $$;
