-- ==============================================================================
-- TABELA RELACIONAL: COBRANÇAS MULTICANAL (FOCUS ERP)
-- Sincronização em tempo real entre Desktop e Mobile (iOS/Android)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS cobrancas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    cliente_nome VARCHAR(255),
    titulo_id UUID REFERENCES contas_receber(id) ON DELETE SET NULL,
    titulo_referencia VARCHAR(100),
    valor_total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    valor NUMERIC(15,2) DEFAULT 0.00,
    vencimento DATE,
    data_vencimento DATE,
    dias_atraso INT DEFAULT 0,
    etapa_atual VARCHAR(100) DEFAULT 'Lembrete Preventivo',
    status VARCHAR(30) DEFAULT 'Pendente',
    status_cobranca VARCHAR(50) DEFAULT 'Pendente',
    status_entrega VARCHAR(50) DEFAULT 'Pendente',
    status_leitura VARCHAR(50) DEFAULT 'Não lida',
    canal JSONB DEFAULT '["WhatsApp", "E-mail"]'::jsonb,
    data_hora_envio TIMESTAMPTZ,
    data_hora_pagamento TIMESTAMPTZ,
    responsavel VARCHAR(255) DEFAULT 'Usuário Focus',
    mensagem_personalizada TEXT,
    pix_copia_e_cola TEXT,
    qr_code_pix TEXT,
    linha_digitavel TEXT,
    link_boleto TEXT,
    agendamento TIMESTAMPTZ,
    lembretes_programados JSONB DEFAULT '[]'::jsonb,
    resposta_cliente TEXT,
    classificacao_resposta VARCHAR(100),
    timeline JSONB DEFAULT '[]'::jsonb,
    historico_interacoes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Garantir que todas as colunas existem mesmo se a tabela já tiver sido criada anteriormente
DO $$ 
BEGIN
    ALTER TABLE cobrancas ADD COLUMN IF NOT EXISTS valor NUMERIC(15,2) DEFAULT 0.00;
    ALTER TABLE cobrancas ADD COLUMN IF NOT EXISTS vencimento DATE;
    ALTER TABLE cobrancas ADD COLUMN IF NOT EXISTS data_vencimento DATE;
    ALTER TABLE cobrancas ADD COLUMN IF NOT EXISTS status_cobranca VARCHAR(50) DEFAULT 'Pendente';
    ALTER TABLE cobrancas ADD COLUMN IF NOT EXISTS status_entrega VARCHAR(50) DEFAULT 'Pendente';
    ALTER TABLE cobrancas ADD COLUMN IF NOT EXISTS status_leitura VARCHAR(50) DEFAULT 'Não lida';
    ALTER TABLE cobrancas ADD COLUMN IF NOT EXISTS canal JSONB DEFAULT '["WhatsApp", "E-mail"]'::jsonb;
    ALTER TABLE cobrancas ADD COLUMN IF NOT EXISTS data_hora_envio TIMESTAMPTZ;
    ALTER TABLE cobrancas ADD COLUMN IF NOT EXISTS data_hora_pagamento TIMESTAMPTZ;
    ALTER TABLE cobrancas ADD COLUMN IF NOT EXISTS responsavel VARCHAR(255) DEFAULT 'Usuário Focus';
    ALTER TABLE cobrancas ADD COLUMN IF NOT EXISTS mensagem_personalizada TEXT;
    ALTER TABLE cobrancas ADD COLUMN IF NOT EXISTS pix_copia_e_cola TEXT;
    ALTER TABLE cobrancas ADD COLUMN IF NOT EXISTS qr_code_pix TEXT;
    ALTER TABLE cobrancas ADD COLUMN IF NOT EXISTS linha_digitavel TEXT;
    ALTER TABLE cobrancas ADD COLUMN IF NOT EXISTS link_boleto TEXT;
    ALTER TABLE cobrancas ADD COLUMN IF NOT EXISTS agendamento TIMESTAMPTZ;
    ALTER TABLE cobrancas ADD COLUMN IF NOT EXISTS lembretes_programados JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE cobrancas ADD COLUMN IF NOT EXISTS resposta_cliente TEXT;
    ALTER TABLE cobrancas ADD COLUMN IF NOT EXISTS classificacao_resposta VARCHAR(100);
    ALTER TABLE cobrancas ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE cobrancas ADD COLUMN IF NOT EXISTS tenant_id UUID;
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'cobrancas' AND column_name = 'tenant_id') THEN
        ALTER TABLE cobrancas ALTER COLUMN tenant_id DROP NOT NULL;
    END IF;
END $$;

-- Índices de Performance
CREATE INDEX IF NOT EXISTS idx_cobrancas_cliente_id ON cobrancas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_titulo_id ON cobrancas(titulo_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_status ON cobrancas(status);
CREATE INDEX IF NOT EXISTS idx_cobrancas_status_cobranca ON cobrancas(status_cobranca);
CREATE INDEX IF NOT EXISTS idx_cobrancas_created_at ON cobrancas(created_at DESC);

-- Habilitar RLS com políticas abertas para anon/authenticated
ALTER TABLE cobrancas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select on cobrancas" ON cobrancas;
CREATE POLICY "Public select on cobrancas" ON cobrancas FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert on cobrancas" ON cobrancas;
CREATE POLICY "Public insert on cobrancas" ON cobrancas FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update on cobrancas" ON cobrancas;
CREATE POLICY "Public update on cobrancas" ON cobrancas FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete on cobrancas" ON cobrancas;
CREATE POLICY "Public delete on cobrancas" ON cobrancas FOR DELETE USING (true);

-- Notificar PostgREST do schema reload
NOTIFY pgrst, 'reload schema';
