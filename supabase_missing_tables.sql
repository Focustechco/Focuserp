-- ==============================================================================
-- FOCUS ERP - CRIAÇÃO DE TODAS AS TABELAS RELACIONAIS FALTANTES (POSTGRESQL / SUPABASE)
-- EXECUTE ESTE SCRIPT NO SQL EDITOR DO SUPABASE PARA ATIVAR O BANCO COMPLETO
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Função trigger de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 1. MÓDULO COMERCIAL (12 Tabelas)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comercial_equipe (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    cargo VARCHAR(100) DEFAULT 'Consultor Comercial',
    email VARCHAR(255),
    telefone VARCHAR(50),
    meta_mensal NUMERIC(15,2) DEFAULT 0.00,
    comissao_percentual NUMERIC(5,2) DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'Ativo',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comercial_metas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    periodo VARCHAR(50) NOT NULL,
    valor_alvo NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor_alcancado NUMERIC(15,2) DEFAULT 0.00,
    responsavel_id UUID,
    responsavel_nome VARCHAR(255),
    status VARCHAR(30) DEFAULT 'Em Andamento',
    data_inicio DATE,
    data_fim DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comercial_okrs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    objetivo TEXT,
    progresso NUMERIC(5,2) DEFAULT 0.00,
    trimestre VARCHAR(20),
    ano INT DEFAULT 2026,
    status VARCHAR(30) DEFAULT 'Em Andamento',
    key_results JSONB DEFAULT '[]'::jsonb,
    responsavel VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comercial_regras_comissao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) DEFAULT 'Percentual Fixo',
    percentual_base NUMERIC(5,2) DEFAULT 0.00,
    faixas JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(30) DEFAULT 'Ativa',
    descricao TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comercial_registros_comissao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    colaborador_id UUID,
    colaborador_nome VARCHAR(255) NOT NULL,
    venda_id UUID,
    venda_identificador VARCHAR(100),
    cliente_nome VARCHAR(255),
    valor_venda NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    percentual_aplicado NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    valor_comissao NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    status_pagamento VARCHAR(30) DEFAULT 'Pendente',
    data_competencia DATE NOT NULL DEFAULT CURRENT_DATE,
    data_pagamento DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comercial_servicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) DEFAULT 'Consultoria',
    preco_base NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    unidade VARCHAR(30) DEFAULT 'Hora',
    descricao TEXT,
    status VARCHAR(30) DEFAULT 'Ativo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comercial_tabelas_preco (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    multiplicador_desconto NUMERIC(5,2) DEFAULT 0.00,
    vigencia_inicio DATE,
    vigencia_fim DATE,
    status VARCHAR(30) DEFAULT 'Ativa',
    itens JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comercial_scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    etapa VARCHAR(100) DEFAULT 'Prospecção',
    canal VARCHAR(50) DEFAULT 'WhatsApp',
    objetivo TEXT,
    conteudo TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comercial_estrategias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    pilar VARCHAR(100),
    meta TEXT,
    plano_acao TEXT,
    status VARCHAR(30) DEFAULT 'Em Execução',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comercial_playbooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    versao VARCHAR(20) DEFAULT '1.0',
    categoria VARCHAR(100) DEFAULT 'Onboarding Comercial',
    modulos JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(30) DEFAULT 'Ativo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comercial_atividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    contato_nome VARCHAR(255),
    empresa_nome VARCHAR(255),
    data_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
    duracao_minutos INT DEFAULT 30,
    resultado TEXT,
    proximo_passo TEXT,
    data_proximo_follow_up DATE,
    responsavel VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comercial_agenda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) DEFAULT 'Reunião',
    data_agendamento TIMESTAMPTZ NOT NULL,
    cliente_lead VARCHAR(255),
    responsavel VARCHAR(255),
    status VARCHAR(30) DEFAULT 'Agendado',
    detalhes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 2. MÓDULO CRM (7 Tabelas)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_oportunidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    cliente_nome VARCHAR(255) NOT NULL,
    lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
    etapa VARCHAR(100) NOT NULL DEFAULT 'Prospecção',
    valor NUMERIC(15,2) DEFAULT 0.00,
    probabilidade INT DEFAULT 50,
    data_previsao_fechamento DATE,
    responsavel_nome VARCHAR(255),
    clickup_task_id VARCHAR(100),
    clickup_status VARCHAR(100),
    origem VARCHAR(100) DEFAULT 'Direta',
    descricao TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20),
    segmento VARCHAR(100) DEFAULT 'Tecnologia',
    porte VARCHAR(50) DEFAULT 'Médio',
    site VARCHAR(255),
    telefone VARCHAR(50),
    endereco JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(30) DEFAULT 'Ativa',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_contatos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    empresa_id UUID REFERENCES crm_empresas(id) ON DELETE SET NULL,
    empresa_nome VARCHAR(255),
    nome VARCHAR(255) NOT NULL,
    cargo VARCHAR(100),
    email VARCHAR(255),
    telefone VARCHAR(50),
    canal_preferencial VARCHAR(50) DEFAULT 'WhatsApp',
    decisor BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_interacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    oportunidade_id UUID REFERENCES crm_oportunidades(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
    tipo VARCHAR(50) NOT NULL,
    resumo TEXT NOT NULL,
    detalhes TEXT,
    data_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
    responsavel VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_atividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    oportunidade_id UUID REFERENCES crm_oportunidades(id) ON DELETE SET NULL,
    titulo VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) DEFAULT 'Tarefa',
    data_prevista DATE NOT NULL,
    concluida BOOLEAN DEFAULT false,
    responsavel VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_clickup_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    api_token TEXT NOT NULL,
    team_id VARCHAR(100),
    team_name VARCHAR(255),
    workspace_id VARCHAR(100),
    space_id VARCHAR(100),
    space_name VARCHAR(255),
    list_id VARCHAR(100),
    list_name VARCHAR(255),
    ativo BOOLEAN DEFAULT true,
    ultimo_sync TIMESTAMPTZ,
    status_mapping JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    data_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
    tipo VARCHAR(50) DEFAULT 'Inbound ClickUp',
    status VARCHAR(30) DEFAULT 'Sucesso',
    detalhes TEXT,
    registros_afetados INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 3. MÓDULO CUSTOMER SUCCESS (CS) (10 Tabelas)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cs_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    health_score INT NOT NULL DEFAULT 100,
    health_status VARCHAR(30) DEFAULT 'excelente',
    nps_score INT DEFAULT 10,
    nps_categoria VARCHAR(30) DEFAULT 'promotor',
    onboarding_progresso NUMERIC(5,2) DEFAULT 0.00,
    onboarding_status VARCHAR(30) DEFAULT 'em_andamento',
    data_renovacao DATE,
    status_renovacao VARCHAR(30) DEFAULT 'em_dia',
    mrr_atual NUMERIC(15,2) DEFAULT 0.00,
    csm_responsavel VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cs_onboardings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    cs_customer_id UUID REFERENCES cs_customers(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    etapa_nome VARCHAR(255) NOT NULL,
    ordem INT DEFAULT 1,
    responsavel VARCHAR(255),
    concluido BOOLEAN DEFAULT false,
    data_conclusao DATE,
    checklist JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cs_health_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    cs_customer_id UUID REFERENCES cs_customers(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    fator_nome VARCHAR(255) NOT NULL,
    peso NUMERIC(5,2) DEFAULT 1.0,
    nota INT DEFAULT 10,
    impacto VARCHAR(30) DEFAULT 'positivo',
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cs_nps_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    cs_customer_id UUID REFERENCES cs_customers(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    nota INT NOT NULL,
    categoria VARCHAR(30) DEFAULT 'promotor',
    feedback TEXT,
    contato_nome VARCHAR(255),
    data_pesquisa DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cs_renewals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    cs_customer_id UUID REFERENCES cs_customers(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    valor_atual NUMERIC(15,2) DEFAULT 0.00,
    valor_renovacao NUMERIC(15,2) DEFAULT 0.00,
    data_renovacao DATE NOT NULL,
    probabilidade INT DEFAULT 80,
    status VARCHAR(30) DEFAULT 'em_dia',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cs_expansions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    cs_customer_id UUID REFERENCES cs_customers(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    tipo_expansao VARCHAR(50) DEFAULT 'Upsell',
    valor_estimado NUMERIC(15,2) DEFAULT 0.00,
    estagio VARCHAR(50) DEFAULT 'Identificado',
    probabilidade INT DEFAULT 50,
    detalhes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cs_churn_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    cs_customer_id UUID REFERENCES cs_customers(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    data_churn DATE NOT NULL DEFAULT CURRENT_DATE,
    motivo_principal VARCHAR(255) NOT NULL,
    mrr_perdido NUMERIC(15,2) DEFAULT 0.00,
    licoes_aprendidas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cs_action_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    cs_customer_id UUID REFERENCES cs_customers(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    objetivo TEXT,
    prazo DATE,
    responsavel VARCHAR(255),
    status VARCHAR(30) DEFAULT 'em_andamento',
    acoes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cs_timelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    cs_customer_id UUID REFERENCES cs_customers(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    data_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
    autor VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cs_tasks_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    cs_customer_id UUID REFERENCES cs_customers(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    tipo VARCHAR(50) DEFAULT 'Reunião QBR',
    pauta TEXT NOT NULL,
    data_hora TIMESTAMPTZ NOT NULL,
    participantes JSONB DEFAULT '[]'::jsonb,
    ata TEXT,
    status VARCHAR(30) DEFAULT 'agendada',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 4. MÓDULO DESENVOLVIMENTO & ENGENHARIA (9 Tabelas)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dev_sprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    meta TEXT,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'Planejada',
    velocity NUMERIC(8,2) DEFAULT 0,
    pontos_planejados NUMERIC(8,2) DEFAULT 0,
    pontos_entregues NUMERIC(8,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dev_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    produto_id UUID,
    versao_semver VARCHAR(50) NOT NULL,
    data_release DATE DEFAULT CURRENT_DATE,
    status VARCHAR(30) DEFAULT 'Planejada',
    changelog JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dev_git_repos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    provider VARCHAR(50) DEFAULT 'GitHub',
    branch_padrao VARCHAR(100) DEFAULT 'main',
    status VARCHAR(30) DEFAULT 'Ativo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dev_git_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    repo_id UUID REFERENCES dev_git_repos(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) DEFAULT 'feature',
    autor VARCHAR(255),
    status_pr VARCHAR(50) DEFAULT 'Em Aberto',
    ultima_atualizacao TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dev_deploys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    ambiente VARCHAR(50) NOT NULL DEFAULT 'Produção',
    versao VARCHAR(50) NOT NULL,
    data_deploy TIMESTAMPTZ NOT NULL DEFAULT now(),
    autor VARCHAR(255),
    status VARCHAR(30) DEFAULT 'Sucesso',
    commit_hash VARCHAR(100),
    logs TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dev_qa_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    modulo VARCHAR(100),
    tipo VARCHAR(50) DEFAULT 'Funcional',
    passos JSONB DEFAULT '[]'::jsonb,
    resultado_esperado TEXT,
    status VARCHAR(30) DEFAULT 'Pendente',
    executor VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dev_bugs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    gravidade VARCHAR(30) DEFAULT 'Média',
    status VARCHAR(30) DEFAULT 'Aberto',
    passos_reproduzir TEXT,
    responsavel VARCHAR(255),
    sprint_id UUID REFERENCES dev_sprints(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dev_cicd_pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    repo VARCHAR(255),
    status VARCHAR(30) DEFAULT 'Sucesso',
    duracao_segundos INT DEFAULT 120,
    data_execucao TIMESTAMPTZ DEFAULT now(),
    etapas JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 5. MÓDULO SUPORTE & HELPDESK (3 Tabelas Auxiliares)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suporte_mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    chamado_id UUID,
    autor_nome VARCHAR(255) NOT NULL,
    autor_papel VARCHAR(50) DEFAULT 'Suporte',
    conteudo TEXT NOT NULL,
    tipo_mensagem VARCHAR(30) DEFAULT 'Publico',
    anexos JSONB DEFAULT '[]'::jsonb,
    data_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS suporte_kb_artigos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) DEFAULT 'Geral',
    conteudo TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    visualizacoes INT DEFAULT 0,
    util_sim INT DEFAULT 0,
    util_nao INT DEFAULT 0,
    status VARCHAR(30) DEFAULT 'Publicado',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS suporte_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    chamado_id UUID,
    tipo VARCHAR(50) NOT NULL,
    evento VARCHAR(255) NOT NULL,
    autor VARCHAR(255),
    data_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 6. MÓDULO RH AVANÇADO (6 Tabelas Extras)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rh_beneficios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) DEFAULT 'Alimentação',
    fornecedor VARCHAR(255),
    valor_empresa NUMERIC(15,2) DEFAULT 0.00,
    valor_colaborador NUMERIC(15,2) DEFAULT 0.00,
    colaboradores_vinculados JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(30) DEFAULT 'Ativo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rh_ponto_registros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
    colaborador_nome VARCHAR(255) NOT NULL,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    entrada_1 TIME,
    saida_1 TIME,
    entrada_2 TIME,
    saida_2 TIME,
    total_horas NUMERIC(5,2) DEFAULT 8.0,
    horas_extras NUMERIC(5,2) DEFAULT 0.0,
    status VARCHAR(30) DEFAULT 'Normal',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rh_desempenho_ciclos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    ano INT DEFAULT 2026,
    periodo VARCHAR(50) DEFAULT '1º Semestre',
    status VARCHAR(30) DEFAULT 'Em Andamento',
    criterios JSONB DEFAULT '[]'::jsonb,
    colaboradores_avaliados JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rh_onboarding_processos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
    colaborador_nome VARCHAR(255) NOT NULL,
    cargo VARCHAR(100),
    data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    checklist JSONB DEFAULT '[]'::jsonb,
    progresso NUMERIC(5,2) DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'Em Andamento',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rh_treinamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    instrutor VARCHAR(255),
    carga_horaria_horas NUMERIC(5,2) DEFAULT 10,
    data_inicio DATE,
    data_fim DATE,
    status VARCHAR(30) DEFAULT 'Planejado',
    participantes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 7. MÓDULO FISCAL (1 Tabela)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fiscal_documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL DEFAULT 'NFS-e',
    numero VARCHAR(50) NOT NULL,
    serie VARCHAR(20) DEFAULT '1',
    chave_acesso VARCHAR(100),
    data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
    data_entrada DATE DEFAULT CURRENT_DATE,
    entidade_tipo VARCHAR(50) DEFAULT 'Cliente',
    entidade_id UUID,
    entidade_nome VARCHAR(255) NOT NULL,
    entidade_cnpj_cpf VARCHAR(20),
    projeto_id UUID,
    projeto_nome VARCHAR(255),
    centro_custo VARCHAR(100),
    valor_total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    impostos JSONB DEFAULT '[]'::jsonb,
    retencoes JSONB DEFAULT '[]'::jsonb,
    anexos JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(30) DEFAULT 'Emitido',
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 8. MÓDULO INTEGRAÇÕES & WEBHOOKS (4 Tabelas)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS integracoes_conectores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    categoria VARCHAR(100) DEFAULT 'Financeiro',
    status VARCHAR(30) DEFAULT 'Ativo',
    credenciais_config JSONB DEFAULT '{}'::jsonb,
    ultimo_sync TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS integracoes_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    metodo VARCHAR(10) DEFAULT 'POST',
    token_secreto VARCHAR(255),
    eventos TEXT[] DEFAULT '{}',
    status VARCHAR(30) DEFAULT 'Ativo',
    ultimo_disparo TIMESTAMPTZ,
    status_ultimo_disparo INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS integracoes_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    conector_id VARCHAR(100),
    chave_mascarada VARCHAR(100) NOT NULL,
    escopos TEXT[] DEFAULT '{}',
    status VARCHAR(30) DEFAULT 'Ativa',
    ultimo_uso TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS integracoes_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    conector_id VARCHAR(100),
    nome_conector VARCHAR(255),
    modulo_origem VARCHAR(100),
    status_code INT DEFAULT 200,
    mensagem TEXT,
    payload_resumo JSONB DEFAULT '{}'::jsonb,
    data_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 9. ASSINATURAS, MARKETING AUXILIAR & COBRANÇAS (6 Tabelas)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assinaturas_modelos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) DEFAULT 'Contrato de Serviços',
    conteudo_template TEXT NOT NULL,
    campos_preenchimento JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(30) DEFAULT 'Ativo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assinaturas_certificados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) DEFAULT 'A1',
    titular VARCHAR(255) NOT NULL,
    emissor VARCHAR(255),
    validade_fim DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'Válido',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_posts_editorial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    canal VARCHAR(100) NOT NULL,
    data_publicacao DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'Planejado',
    conteudo TEXT,
    midia_url TEXT,
    autor VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_ativos_midia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) DEFAULT 'Imagem',
    canal VARCHAR(100),
    url TEXT NOT NULL,
    tamanho_bytes BIGINT DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_anuncios_ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    plataforma VARCHAR(100) NOT NULL DEFAULT 'Google Ads',
    nome_campanha VARCHAR(255) NOT NULL,
    orcamento_diario NUMERIC(15,2) DEFAULT 0.00,
    gasto_total NUMERIC(15,2) DEFAULT 0.00,
    cliques INT DEFAULT 0,
    conversoes INT DEFAULT 0,
    cpc NUMERIC(8,2) DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'Ativa',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_planejamento_seo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    palavra_chave VARCHAR(255) NOT NULL,
    volume_busca INT DEFAULT 0,
    posicao_ranking INT,
    url_alvo VARCHAR(500),
    prioridade VARCHAR(30) DEFAULT 'Alta',
    status VARCHAR(30) DEFAULT 'Otimizando',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cobrancas_reguas_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    canal VARCHAR(50) DEFAULT 'WhatsApp',
    dias_gatilho INT DEFAULT 0,
    template_mensagem TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 10. HABILITAÇÃO AUTOMÁTICA DE TRIGGERS E POLÍTICAS
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    t text;
    table_list text[] := ARRAY[
        'comercial_equipe', 'comercial_metas', 'comercial_okrs', 'comercial_regras_comissao',
        'comercial_registros_comissao', 'comercial_servicos', 'comercial_tabelas_preco',
        'comercial_scripts', 'comercial_estrategias', 'comercial_playbooks', 'comercial_atividades',
        'comercial_agenda', 'crm_oportunidades', 'crm_empresas', 'crm_contatos', 'crm_interacoes',
        'crm_atividades', 'crm_clickup_config', 'crm_sync_logs', 'cs_customers', 'cs_onboardings',
        'cs_health_factors', 'cs_nps_surveys', 'cs_renewals', 'cs_expansions', 'cs_churn_records',
        'cs_action_plans', 'cs_timelines', 'cs_tasks_meetings', 'dev_sprints', 'dev_versions',
        'dev_git_repos', 'dev_git_branches', 'dev_deploys', 'dev_qa_tests', 'dev_bugs',
        'dev_cicd_pipelines', 'suporte_mensagens', 'suporte_kb_artigos', 'suporte_timeline',
        'rh_beneficios', 'rh_ponto_registros', 'rh_desempenho_ciclos', 'rh_onboarding_processos',
        'rh_treinamentos', 'fiscal_documentos', 'integracoes_conectores', 'integracoes_webhooks',
        'integracoes_api_keys', 'integracoes_logs', 'assinaturas_modelos', 'assinaturas_certificados',
        'marketing_posts_editorial', 'marketing_ativos_midia', 'marketing_anuncios_ads',
        'marketing_planejamento_seo', 'cobrancas_reguas_templates'
    ];
BEGIN
    FOREACH t IN ARRAY table_list
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I;', t, t);
        EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();', t, t);
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
        EXECUTE format('DROP POLICY IF EXISTS "Public access on %I" ON %I;', t, t);
        EXECUTE format('CREATE POLICY "Public access on %I" ON %I FOR ALL USING (true) WITH CHECK (true);', t, t);
    END LOOP;
END $$;
