const { Client } = require('pg');

const connectionString = 'postgresql://postgres:focusOS19964@db.lykwydydrctmjzcvugjd.supabase.co:5432/postgres';

const migrationSQL = `
-- ==============================================================================
-- MIGRATION OFICIAL - FOCUS FINANCIAL INSIGHT / FOCUSERP (SUPABASE POSTGRESQL)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE ORGANIZAÇÕES / TENANTS (MULTI-TENANCY)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_fantasia TEXT NOT NULL,
    razao_social TEXT NOT NULL,
    cnpj TEXT UNIQUE,
    plano TEXT DEFAULT 'Enterprise',
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir tenant padrão se não existir
INSERT INTO tenants (id, nome_fantasia, razao_social, cnpj)
VALUES ('00000000-0000-0000-0000-000000000001', 'Focus Tecnologia', 'Focus Tecnologia LTDA', '00.000.000/0001-00')
ON CONFLICT (id) DO NOTHING;

-- 2. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES tenants(id) ON DELETE RESTRICT,
    keycloak_sub TEXT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    cargo TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE CLIENTES (CRM / COMERCIAL)
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES tenants(id) ON DELETE RESTRICT,
    codigo TEXT,
    tipo TEXT DEFAULT 'Pessoa Jurídica',
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT,
    documento TEXT,
    inscricao_estadual TEXT,
    status TEXT NOT NULL DEFAULT 'Ativo',
    segmento TEXT DEFAULT 'Geral',
    cep TEXT,
    logradouro TEXT,
    numero TEXT,
    bairro TEXT,
    cidade TEXT DEFAULT 'São Paulo',
    estado TEXT DEFAULT 'SP',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA DE CONTATOS DO CLIENTE
CREATE TABLE IF NOT EXISTS cliente_contatos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES tenants(id) ON DELETE RESTRICT,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    cargo TEXT,
    departamento TEXT,
    celular TEXT,
    whatsapp BOOLEAN DEFAULT TRUE,
    email TEXT,
    principal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA DE CONTAS A RECEBER (MÓDULO FINANCEIRO)
CREATE TABLE IF NOT EXISTS contas_receber (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES tenants(id) ON DELETE RESTRICT,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    cliente_nome TEXT,
    numero TEXT NOT NULL,
    descricao TEXT NOT NULL,
    categoria TEXT DEFAULT 'Receita Operacional',
    valor_original NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    valor_recebido NUMERIC(15, 2) DEFAULT 0.00,
    saldo NUMERIC(15, 2) DEFAULT 0.00,
    data_emissao DATE DEFAULT CURRENT_DATE,
    data_vencimento DATE DEFAULT CURRENT_DATE,
    data_recebimento DATE,
    forma_pagamento TEXT DEFAULT 'PIX',
    status TEXT NOT NULL DEFAULT 'Pendente',
    responsavel TEXT DEFAULT 'Administrador',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA DE CONTAS A PAGAR (MÓDULO FINANCEIRO)
CREATE TABLE IF NOT EXISTS contas_pagar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES tenants(id) ON DELETE RESTRICT,
    fornecedor_id UUID,
    fornecedor_nome TEXT NOT NULL,
    numero TEXT NOT NULL,
    descricao TEXT NOT NULL,
    categoria TEXT DEFAULT 'Despesa Operacional',
    valor_original NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    valor_pago NUMERIC(15, 2) DEFAULT 0.00,
    saldo NUMERIC(15, 2) DEFAULT 0.00,
    data_emissao DATE DEFAULT CURRENT_DATE,
    data_vencimento DATE DEFAULT CURRENT_DATE,
    data_pagamento DATE,
    forma_pagamento TEXT DEFAULT 'Boleto',
    status TEXT NOT NULL DEFAULT 'Pendente',
    responsavel TEXT DEFAULT 'Administrador',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABELA DE PROJETOS (MÓDULO PROJETOS)
CREATE TABLE IF NOT EXISTS projetos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES tenants(id) ON DELETE RESTRICT,
    cliente_id TEXT,
    codigo TEXT NOT NULL,
    nome TEXT NOT NULL,
    tipo TEXT DEFAULT 'Software Sob Medida',
    categoria TEXT DEFAULT 'Desenvolvimento',
    responsavel_principal TEXT DEFAULT 'Gerente de Projetos',
    prioridade TEXT DEFAULT 'Média',
    status TEXT DEFAULT 'Planejamento',
    data_inicio DATE DEFAULT CURRENT_DATE,
    data_fim_prevista DATE DEFAULT CURRENT_DATE,
    descricao TEXT,
    valor_contratado NUMERIC(15, 2) DEFAULT 0.00,
    valor_recebido NUMERIC(15, 2) DEFAULT 0.00,
    progresso_global INT DEFAULT 0,
    horas_planejadas INT DEFAULT 0,
    horas_realizadas INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABELA DE COLABORADORES (RECURSOS HUMANOS)
CREATE TABLE IF NOT EXISTS colaboradores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES tenants(id) ON DELETE RESTRICT,
    matricula TEXT,
    nome TEXT NOT NULL,
    cpf TEXT,
    email TEXT,
    cargo TEXT NOT NULL,
    departamento TEXT DEFAULT 'Tecnologia',
    data_admissao DATE DEFAULT CURRENT_DATE,
    tipo_contrato TEXT DEFAULT 'CLT',
    regime TEXT DEFAULT 'Híbrido',
    salario_base NUMERIC(15, 2) DEFAULT 0.00,
    status TEXT DEFAULT 'Ativo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABELA DE AUDITORIA UNIFICADA
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES tenants(id) ON DELETE RESTRICT,
    user_id UUID,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABELA DE ESTADO GENÉRICO (DOCUMENT STORE)
CREATE TABLE IF NOT EXISTS focus_app_state (
    table_name TEXT NOT NULL,
    id TEXT NOT NULL,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (table_name, id)
);

-- ==============================================================================
-- ÍNDICES DE PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_clientes_tenant_status ON clientes(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_contas_receber_vencimento ON contas_receber(data_vencimento, status);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_vencimento ON contas_pagar(data_vencimento, status);
CREATE INDEX IF NOT EXISTS idx_projetos_tenant ON projetos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_colaboradores_tenant ON colaboradores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_focus_app_state_table ON focus_app_state(table_name);

-- ==============================================================================
-- HABILITAR RLS E CONFIGURAR POLÍTICAS PERMISSIVAS PARA ANON E AUTHENTICATED
-- ==============================================================================
DO $$ 
DECLARE
    t text;
    tables text[] := ARRAY['tenants', 'users', 'clientes', 'cliente_contatos', 'contas_receber', 'contas_pagar', 'projetos', 'colaboradores', 'audit_logs', 'focus_app_state'];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
        EXECUTE format('DROP POLICY IF EXISTS "Public access on %I" ON %I;', t, t);
        EXECUTE format('CREATE POLICY "Public access on %I" ON %I FOR ALL USING (true) WITH CHECK (true);', t, t);
    END LOOP;
END $$;

-- Conceder permissões para os roles do Supabase
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
`;

async function runMigration() {
  const dns = require('dns');
  dns.setDefaultResultOrder('ipv4first');

  const client = new Client({
    host: 'db.lykwydydrctmjzcvugjd.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'focusOS19964',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Conectando ao Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    console.log('🚀 Executando Migration SQL...');
    await client.query(migrationSQL);
    console.log('🎉 Migration executada com 100% de sucesso!');

    // Verificar tabelas criadas
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\n📋 Tabelas ativas no Supabase:');
    res.rows.forEach(r => console.log('  ✔️ ' + r.table_name));

    await client.end();
  } catch (err) {
    console.error('❌ Erro na execução da migration:', err);
    process.exit(1);
  }
}

runMigration();
