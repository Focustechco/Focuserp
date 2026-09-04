-- ==============================================================================
-- FOCUS ERP - SCHEMA COMPLETO E FUNCIONAL DO BANCO DE DADOS (SUPABASE / POSTGRESQL)
-- TODAS AS TABELAS RELACIONAIS PARA TODOS OS MÓDULOS DA APLICAÇÃO
-- ==============================================================================

-- 0. EXTENSÕES & UTILITÁRIOS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- FUNÇÃO TRIGGER DE ATUALIZAÇÃO AUTOMÁTICA DE UPDATED_AT
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 1. TENANTS & EMPRESA
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    documento VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'ativo',
    plano VARCHAR(50) NOT NULL DEFAULT 'enterprise',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS empresa_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20) NOT NULL,
    inscricao_estadual VARCHAR(50),
    inscricao_municipal VARCHAR(50),
    regime_tributario VARCHAR(100) DEFAULT 'Lucro Presumido',
    cnae_principal VARCHAR(50),
    email_contato VARCHAR(255),
    telefone_contato VARCHAR(50),
    site VARCHAR(255),
    logo_url TEXT,
    cor_primaria VARCHAR(50) DEFAULT '#0F172A',
    moeda_padrao VARCHAR(10) DEFAULT 'BRL',
    cep VARCHAR(10),
    logradouro VARCHAR(255),
    numero VARCHAR(20),
    complemento VARCHAR(255),
    bairro VARCHAR(100),
    cidade VARCHAR(100) DEFAULT 'São Paulo',
    estado VARCHAR(2) DEFAULT 'SP',
    pais VARCHAR(50) DEFAULT 'Brasil',
    dados_bancarios JSONB DEFAULT '[]'::jsonb,
    configuracoes_gerais JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 2. USUÁRIOS E PERMISSÕES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
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
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo',
    perfil VARCHAR(50) NOT NULL DEFAULT 'Financeiro',
    roles_complementares TEXT[] DEFAULT '{}',
    mfa_habilitado BOOLEAN NOT NULL DEFAULT false,
    ultimo_login TIMESTAMPTZ,
    permissoes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permissoes_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    nome_cargo VARCHAR(100) NOT NULL,
    departamento VARCHAR(100) NOT NULL,
    nivel_acesso VARCHAR(50) NOT NULL DEFAULT 'Padrão',
    modulos_permitidos JSONB DEFAULT '{}'::jsonb,
    acoes_especiais JSONB DEFAULT '{}'::jsonb,
    descricao TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 3. CADASTROS BÁSICOS: CLIENTES E FORNECEDORES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    codigo VARCHAR(50),
    tipo VARCHAR(30) NOT NULL DEFAULT 'Pessoa Jurídica',
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255) NOT NULL,
    documento VARCHAR(20) NOT NULL,
    inscricao_estadual VARCHAR(50),
    inscricao_municipal VARCHAR(50),
    data_fundacao_nascimento DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo',
    segmento VARCHAR(100) DEFAULT 'Geral',
    porte_empresa VARCHAR(50),
    site VARCHAR(255),
    observacoes TEXT,
    cep VARCHAR(10),
    logradouro VARCHAR(255),
    numero VARCHAR(20),
    complemento VARCHAR(255),
    bairro VARCHAR(100),
    cidade VARCHAR(100) DEFAULT 'São Paulo',
    estado VARCHAR(2) DEFAULT 'SP',
    pais VARCHAR(50) DEFAULT 'Brasil',
    contatos JSONB DEFAULT '[]'::jsonb,
    recorrencias JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fornecedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    codigo VARCHAR(50),
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20) NOT NULL,
    documento VARCHAR(20),
    email VARCHAR(255),
    telefone VARCHAR(50),
    categoria VARCHAR(100) DEFAULT 'Geral',
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo',
    tipo VARCHAR(30) DEFAULT 'Pessoa Jurídica',
    cep VARCHAR(10),
    logradouro VARCHAR(255),
    numero VARCHAR(20),
    complemento VARCHAR(255),
    bairro VARCHAR(100),
    cidade VARCHAR(100) DEFAULT 'São Paulo',
    estado VARCHAR(2) DEFAULT 'SP',
    pais VARCHAR(50) DEFAULT 'Brasil',
    contatos JSONB DEFAULT '[]'::jsonb,
    dados_bancarios JSONB DEFAULT '[]'::jsonb,
    pix_chave VARCHAR(100),
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 4. CONTROLADORIA: PLANO DE CONTAS & CENTROS DE CUSTO
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS centros_custo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    departamento VARCHAR(100),
    responsavel_nome VARCHAR(255),
    responsavel_email VARCHAR(255),
    orcamento_mensal NUMERIC(15,2) DEFAULT 0.00,
    orcamento_anual NUMERIC(15,2) DEFAULT 0.00,
    gasto_acumulado NUMERIC(15,2) DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo',
    descricao TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plano_contas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL DEFAULT 'Despesa',
    natureza VARCHAR(50) DEFAULT 'Operacional',
    categoria_pai_id UUID REFERENCES plano_contas(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo',
    cor VARCHAR(50) DEFAULT '#64748B',
    descricao TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 5. FINANCEIRO: CONTAS A PAGAR, RECEBER, PARCELAS & COBRANÇAS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contas_pagar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    fornecedor_id UUID REFERENCES fornecedores(id) ON DELETE SET NULL,
    fornecedor_nome VARCHAR(255),
    numero VARCHAR(50) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) DEFAULT 'Geral',
    centro_custo VARCHAR(100),
    centro_custo_id UUID REFERENCES centros_custo(id) ON DELETE SET NULL,
    valor_original NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    desconto NUMERIC(15,2) DEFAULT 0.00,
    multa NUMERIC(15,2) DEFAULT 0.00,
    juros NUMERIC(15,2) DEFAULT 0.00,
    valor_pago NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    saldo NUMERIC(15,2) DEFAULT 0.00,
    data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    forma_pagamento VARCHAR(50) DEFAULT 'Boleto',
    status VARCHAR(30) DEFAULT 'Pendente',
    responsavel VARCHAR(255),
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contas_receber (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    cliente_nome VARCHAR(255),
    numero VARCHAR(50) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) DEFAULT 'Geral',
    centro_custo VARCHAR(100),
    centro_custo_id UUID REFERENCES centros_custo(id) ON DELETE SET NULL,
    valor_original NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    desconto NUMERIC(15,2) DEFAULT 0.00,
    multa NUMERIC(15,2) DEFAULT 0.00,
    juros NUMERIC(15,2) DEFAULT 0.00,
    valor_recebido NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    saldo NUMERIC(15,2) DEFAULT 0.00,
    data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
    data_vencimento DATE NOT NULL,
    data_recebimento DATE,
    forma_pagamento VARCHAR(50) DEFAULT 'PIX',
    status VARCHAR(30) DEFAULT 'Pendente',
    responsavel VARCHAR(255),
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cobrancas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    cliente_nome VARCHAR(255),
    titulo_id UUID REFERENCES contas_receber(id) ON DELETE SET NULL,
    titulo_referencia VARCHAR(100),
    valor_total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    dias_atraso INT DEFAULT 0,
    etapa_atual VARCHAR(100) DEFAULT 'Lembrete Preventivo',
    status VARCHAR(30) DEFAULT 'Pendente',
    historico_interacoes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 6. BANCOS & CONCILIAÇÃO BANCÁRIA
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contas_bancarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    nome_conta VARCHAR(100) NOT NULL,
    banco_codigo VARCHAR(20),
    banco_nome VARCHAR(100) NOT NULL,
    agencia VARCHAR(20) NOT NULL,
    conta_corrente VARCHAR(30) NOT NULL,
    tipo_conta VARCHAR(50) DEFAULT 'Conta Corrente PJ',
    saldo_inicial NUMERIC(15,2) DEFAULT 0.00,
    saldo_atual NUMERIC(15,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'Ativa',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS extratos_bancarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    conta_bancaria_id UUID REFERENCES contas_bancarias(id) ON DELETE CASCADE,
    data_movimentacao DATE NOT NULL,
    descricao_banco TEXT NOT NULL,
    documento_ref VARCHAR(100),
    tipo VARCHAR(20) NOT NULL,
    valor NUMERIC(15,2) NOT NULL,
    status_conciliacao VARCHAR(30) DEFAULT 'Pendente',
    conta_vinculada_id UUID,
    conta_vinculada_tipo VARCHAR(30),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agenda_eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    data_inicio TIMESTAMPTZ NOT NULL,
    data_fim TIMESTAMPTZ,
    valor NUMERIC(15,2),
    status VARCHAR(30) DEFAULT 'Agendado',
    responsavel VARCHAR(255),
    descricao TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 7. PATRIMÔNIO, ESTOQUE & TI (ITAM)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS equipamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    codigo_patrimonial VARCHAR(100) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(255) NOT NULL,
    numero_serie VARCHAR(150),
    data_aquisicao DATE,
    valor_compra NUMERIC(15,2) DEFAULT 0.00,
    garantia_meses INT DEFAULT 12,
    situacao VARCHAR(50) DEFAULT 'Disponível',
    departamento VARCHAR(100),
    colaborador_id UUID,
    colaborador_nome VARCHAR(255),
    local_fisica VARCHAR(255) DEFAULT 'Estoque Central TI',
    notebook_specs JSONB DEFAULT '{}'::jsonb,
    monitor_specs JSONB DEFAULT '{}'::jsonb,
    timeline JSONB DEFAULT '[]'::jsonb,
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS estoque_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    codigo VARCHAR(100) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(100) NOT NULL DEFAULT 'Geral',
    quantidade NUMERIC(10,2) NOT NULL DEFAULT 0,
    quantidade_minima NUMERIC(10,2) DEFAULT 0,
    valor_unitario NUMERIC(15,2) DEFAULT 0.00,
    estado_conservacao VARCHAR(50) DEFAULT 'Bom',
    localizacao VARCHAR(255) DEFAULT 'Almoxarifado Central',
    status VARCHAR(50) DEFAULT 'Disponível',
    responsavel_nome VARCHAR(255),
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS licencas_software (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    fabricante VARCHAR(150) NOT NULL,
    plano VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) DEFAULT 'Assinatura',
    quantidade_total INT NOT NULL DEFAULT 1,
    quantidade_usada INT NOT NULL DEFAULT 0,
    quantidade_disponivel INT GENERATED ALWAYS AS (quantidade_total - quantidade_usada) STORED,
    data_compra DATE,
    vencimento DATE,
    valor NUMERIC(15,2) DEFAULT 0.00,
    responsavel_nome VARCHAR(255),
    centro_custo_nome VARCHAR(150),
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patrimonios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    numero_patrimonial VARCHAR(100) NOT NULL,
    codigo_interno VARCHAR(100),
    categoria VARCHAR(100) NOT NULL,
    valor_compra NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_atual NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    vida_util_anos INT DEFAULT 5,
    depreciacao_acumulada NUMERIC(15,2) DEFAULT 0.00,
    estado_conservacao VARCHAR(50) DEFAULT 'Bom',
    situacao VARCHAR(50) DEFAULT 'Ativo',
    centro_custo_nome VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS movimentacoes_patrimonio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    equipamento_id UUID REFERENCES equipamentos(id) ON DELETE SET NULL,
    equipamento_nome VARCHAR(255),
    estoque_item_id UUID REFERENCES estoque_itens(id) ON DELETE SET NULL,
    estoque_item_nome VARCHAR(255),
    usuario_id UUID,
    usuario_nome VARCHAR(255) DEFAULT 'Administrador',
    data_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
    origem VARCHAR(255),
    destino VARCHAR(255),
    responsavel_nome VARCHAR(255),
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS manutencoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    equipamento_id UUID REFERENCES equipamentos(id) ON DELETE SET NULL,
    equipamento_codigo VARCHAR(100),
    equipamento_nome VARCHAR(255),
    tipo VARCHAR(50) NOT NULL,
    data_abertura DATE NOT NULL DEFAULT CURRENT_DATE,
    data_conclusao DATE,
    descricao TEXT NOT NULL,
    valor NUMERIC(15,2) DEFAULT 0.00,
    responsavel_nome VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Em Execução',
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    data_fim DATE,
    status VARCHAR(50) DEFAULT 'Em Progresso',
    responsavel_nome VARCHAR(255),
    localizacao VARCHAR(255),
    itens JSONB DEFAULT '[]'::jsonb,
    divergencias_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 8. PRODUTOS FOCUS & TECNOLOGIA
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS produtos_focus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    descricao_breve TEXT,
    status VARCHAR(50) DEFAULT 'Ativo',
    versao_atual VARCHAR(50) DEFAULT '1.0.0',
    icone VARCHAR(50),
    metricas JSONB DEFAULT '{}'::jsonb,
    planos JSONB DEFAULT '[]'::jsonb,
    roadmap JSONB DEFAULT '[]'::jsonb,
    releases JSONB DEFAULT '[]'::jsonb,
    funcionalidades JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projetos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    codigo VARCHAR(50) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    id_contrato VARCHAR(100),
    tipo VARCHAR(100) NOT NULL,
    categoria VARCHAR(100),
    responsavel_principal VARCHAR(255),
    prioridade VARCHAR(20) DEFAULT 'Média',
    status VARCHAR(30) DEFAULT 'Planejamento',
    data_inicio DATE,
    data_final DATE,
    descricao_geral TEXT,
    valor_contratado NUMERIC(15,2) DEFAULT 0.00,
    valor_recebido NUMERIC(15,2) DEFAULT 0.00,
    progresso_global NUMERIC(5,2) DEFAULT 0.00,
    horas_planejadas NUMERIC(10,2) DEFAULT 0.00,
    horas_realizadas NUMERIC(10,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agenda_entregas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
    projeto_nome VARCHAR(255),
    cliente_nome VARCHAR(255),
    titulo_entrega VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) DEFAULT 'Marco',
    data_prevista DATE NOT NULL,
    data_realizada DATE,
    status VARCHAR(50) DEFAULT 'Pendente',
    responsavel VARCHAR(255),
    descricao TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dev_backlog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    produto_id UUID REFERENCES produtos_focus(id) ON DELETE SET NULL,
    titulo VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) DEFAULT 'Feature',
    prioridade VARCHAR(30) DEFAULT 'Média',
    status VARCHAR(50) DEFAULT 'Backlog',
    estimativa_horas NUMERIC(8,2) DEFAULT 0,
    responsavel_nome VARCHAR(255),
    descricao TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS suporte_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    protocolo VARCHAR(50) NOT NULL,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    cliente_nome VARCHAR(255) NOT NULL,
    assunto VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) DEFAULT 'Dúvida',
    prioridade VARCHAR(30) DEFAULT 'Média',
    status VARCHAR(50) DEFAULT 'Aberto',
    atendente_nome VARCHAR(255),
    sla_horas INT DEFAULT 24,
    mensagens JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 9. RH & PESSOAS (GESTÃO AVANÇADA)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS colaboradores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    matricula VARCHAR(50),
    nome VARCHAR(255) NOT NULL,
    nome_completo VARCHAR(255),
    cpf VARCHAR(20),
    email VARCHAR(255),
    email_corporativo VARCHAR(255),
    telefone VARCHAR(50),
    cargo VARCHAR(100) DEFAULT 'Especialista',
    departamento VARCHAR(100) DEFAULT 'Tecnologia',
    tipo_contrato VARCHAR(50) DEFAULT 'CLT',
    salario NUMERIC(15,2) DEFAULT 0.00,
    data_admissao DATE DEFAULT CURRENT_DATE,
    status VARCHAR(30) DEFAULT 'Ativo',
    beneficios JSONB DEFAULT '[]'::jsonb,
    dados_bancarios JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rh_folha_pagamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    competencia VARCHAR(20) NOT NULL,
    colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
    colaborador_nome VARCHAR(255) NOT NULL,
    salario_base NUMERIC(15,2) NOT NULL,
    proventos NUMERIC(15,2) DEFAULT 0.00,
    descontos NUMERIC(15,2) DEFAULT 0.00,
    valor_liquido NUMERIC(15,2) NOT NULL,
    status VARCHAR(30) DEFAULT 'Pendente',
    data_pagamento DATE,
    detalhes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rh_ferias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
    colaborador_nome VARCHAR(255) NOT NULL,
    periodo_aquisitivo_inicio DATE NOT NULL,
    periodo_aquisitivo_fim DATE NOT NULL,
    data_inicio DATE NOT NULL,
    data_retorno DATE NOT NULL,
    dias INT NOT NULL DEFAULT 30,
    status VARCHAR(30) DEFAULT 'Agendada',
    adiantamento_13 BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_success (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    cliente_nome VARCHAR(255) NOT NULL,
    csm_responsavel VARCHAR(255),
    health_score INT DEFAULT 85,
    status_saude VARCHAR(30) DEFAULT 'Saudável',
    nps_score INT,
    mrr_atual NUMERIC(15,2) DEFAULT 0.00,
    engajamento_nivel VARCHAR(50) DEFAULT 'Alto',
    planos_acao JSONB DEFAULT '[]'::jsonb,
    historico_touchpoints JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 10. VENDAS, CRM, COMERCIAL & MARKETING
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    empresa VARCHAR(255),
    email VARCHAR(255),
    telefone VARCHAR(50),
    origem VARCHAR(100) DEFAULT 'Inbound / Site',
    estagio VARCHAR(50) DEFAULT 'Prospecção',
    valor_estimado NUMERIC(15,2) DEFAULT 0.00,
    responsavel_nome VARCHAR(255),
    temperatura VARCHAR(30) DEFAULT 'Morno',
    interacoes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS propostas_comerciais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    numero VARCHAR(50) NOT NULL,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    cliente_nome VARCHAR(255) NOT NULL,
    valor_total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    validade_dias INT DEFAULT 15,
    data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'Em Aberto',
    itens JSONB DEFAULT '[]'::jsonb,
    condicoes_pagamento TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_campanhas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    canal VARCHAR(100) NOT NULL,
    orcamento NUMERIC(15,2) DEFAULT 0.00,
    gasto_atual NUMERIC(15,2) DEFAULT 0.00,
    leads_gerados INT DEFAULT 0,
    conversoes INT DEFAULT 0,
    roi NUMERIC(8,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Ativa',
    data_inicio DATE,
    data_fim DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 11. GESTÃO DE DOCUMENTOS (DMS) & CONTRATOS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contratos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    cliente_nome VARCHAR(255),
    numero_contrato VARCHAR(50) NOT NULL,
    objeto_contrato TEXT NOT NULL,
    tipo_contrato VARCHAR(100) DEFAULT 'Recorrente',
    valor_total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_mensalidade NUMERIC(15,2) DEFAULT 0.00,
    data_inicio DATE NOT NULL,
    data_fim DATE,
    status VARCHAR(30) DEFAULT 'Ativo',
    vigencia_indeterminada BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dms_pastas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    pasta_pai_id UUID REFERENCES dms_pastas(id) ON DELETE CASCADE,
    modulo_vinculado VARCHAR(100),
    caminho_completo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dms_documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    pasta_id UUID REFERENCES dms_pastas(id) ON DELETE CASCADE,
    nome_arquivo VARCHAR(255) NOT NULL,
    extensao VARCHAR(20),
    tamanho_bytes BIGINT DEFAULT 0,
    url_storage TEXT NOT NULL,
    tipo_documento VARCHAR(100) DEFAULT 'Geral',
    entidade_tipo VARCHAR(50),
    entidade_id UUID,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assinaturas_digitais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    documento_id UUID REFERENCES dms_documentos(id) ON DELETE SET NULL,
    titulo_documento VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pendente',
    signatarios JSONB DEFAULT '[]'::jsonb,
    audit_trail JSONB DEFAULT '[]'::jsonb,
    link_assinatura TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 12. SISTEMA, NOTIFICAÇÕES & AUDIT LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notificacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'info',
    lida BOOLEAN NOT NULL DEFAULT false,
    link_redirecionamento TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    usuario_nome VARCHAR(255),
    acao VARCHAR(100) NOT NULL,
    modulo VARCHAR(100) NOT NULL,
    ip VARCHAR(45),
    dispositivo TEXT,
    detalhes TEXT,
    detalhes_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 13. ÍNDICES DE PERFORMANCE E INTEGRIDADE
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_clientes_documento ON clientes(documento);
CREATE INDEX IF NOT EXISTS idx_fornecedores_cnpj ON fornecedores(cnpj);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_vencimento ON contas_pagar(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_receber_vencimento ON contas_receber(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_equipamentos_patrimonio ON equipamentos(codigo_patrimonial);
CREATE INDEX IF NOT EXISTS idx_estoque_codigo ON estoque_itens(codigo);
CREATE INDEX IF NOT EXISTS idx_contratos_numero ON contratos(numero_contrato);
CREATE INDEX IF NOT EXISTS idx_notificacoes_user_lida ON notificacoes(user_id, lida);
CREATE INDEX IF NOT EXISTS idx_audit_logs_modulo ON audit_logs(modulo);

-- ------------------------------------------------------------------------------
-- 14. HABILITAÇÃO DE TRIGGERS AUTOMÁTICOS DE DATA
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    t text;
    table_list text[] := ARRAY[
        'tenants', 'empresa_config', 'users', 'permissoes_roles', 'clientes', 'fornecedores',
        'centros_custo', 'plano_contas', 'contas_pagar', 'contas_receber', 'cobrancas',
        'contas_bancarias', 'agenda_eventos', 'equipamentos', 'estoque_itens', 'licencas_software',
        'patrimonios', 'manutencoes', 'inventarios', 'produtos_focus', 'agenda_entregas',
        'dev_backlog', 'suporte_tickets', 'colaboradores', 'rh_folha_pagamento', 'rh_ferias',
        'customer_success', 'crm_leads', 'propostas_comerciais', 'marketing_campanhas',
        'contratos', 'dms_pastas', 'dms_documentos', 'assinaturas_digitais'
    ];
BEGIN
    FOREACH t IN ARRAY table_list
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I;', t, t);
        EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();', t, t);
    END LOOP;
END $$;
