-- ==============================================================================
-- TABELAS RELACIONAIS: CONCILIAÇÃO BANCÁRIA & CONTAS BANCÁRIAS (FOCUS ERP)
-- Sincronização em tempo real entre Desktop e Mobile (iOS/Android)
-- ==============================================================================

-- 1. TABELA DE CONTAS BANCÁRIAS
CREATE TABLE IF NOT EXISTS contas_bancarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    nome_conta VARCHAR(100) NOT NULL,
    banco VARCHAR(100),
    banco_codigo VARCHAR(20),
    banco_nome VARCHAR(100) NOT NULL,
    agencia VARCHAR(20) NOT NULL,
    conta VARCHAR(30),
    digito VARCHAR(10),
    conta_corrente VARCHAR(30) NOT NULL,
    tipo_conta VARCHAR(50) DEFAULT 'Corrente',
    titular VARCHAR(255),
    cnpj VARCHAR(50),
    chave_pix VARCHAR(255),
    saldo_inicial NUMERIC(15,2) DEFAULT 0.00,
    saldo_atual NUMERIC(15,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'Ativa',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Garantir colunas adicionais em contas_bancarias
DO $$ 
BEGIN
    ALTER TABLE contas_bancarias ADD COLUMN IF NOT EXISTS banco VARCHAR(100);
    ALTER TABLE contas_bancarias ADD COLUMN IF NOT EXISTS conta VARCHAR(30);
    ALTER TABLE contas_bancarias ADD COLUMN IF NOT EXISTS digito VARCHAR(10);
    ALTER TABLE contas_bancarias ADD COLUMN IF NOT EXISTS titular VARCHAR(255);
    ALTER TABLE contas_bancarias ADD COLUMN IF NOT EXISTS cnpj VARCHAR(50);
    ALTER TABLE contas_bancarias ADD COLUMN IF NOT EXISTS chave_pix VARCHAR(255);
    ALTER TABLE contas_bancarias ADD COLUMN IF NOT EXISTS tenant_id UUID;
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'contas_bancarias' AND column_name = 'tenant_id') THEN
        ALTER TABLE contas_bancarias ALTER COLUMN tenant_id DROP NOT NULL;
    END IF;
END $$;

-- 2. TABELA DE EXTRATOS E MOVIMENTAÇÕES BANCÁRIAS
CREATE TABLE IF NOT EXISTS extratos_bancarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    conta_bancaria_id UUID REFERENCES contas_bancarias(id) ON DELETE CASCADE,
    data DATE,
    data_movimentacao DATE NOT NULL,
    descricao_banco TEXT NOT NULL,
    historico TEXT,
    documento_ref VARCHAR(100),
    documento VARCHAR(100),
    tipo VARCHAR(20) NOT NULL,
    valor NUMERIC(15,2) NOT NULL,
    status VARCHAR(30) DEFAULT 'Não Conciliado',
    status_conciliacao VARCHAR(30) DEFAULT 'Não Conciliado',
    conta_vinculada_id UUID,
    lancamento_financeiro_id UUID,
    conta_vinculada_tipo VARCHAR(30),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Garantir colunas adicionais em extratos_bancarios
DO $$ 
BEGIN
    ALTER TABLE extratos_bancarios ADD COLUMN IF NOT EXISTS data DATE;
    ALTER TABLE extratos_bancarios ADD COLUMN IF NOT EXISTS historico TEXT;
    ALTER TABLE extratos_bancarios ADD COLUMN IF NOT EXISTS documento VARCHAR(100);
    ALTER TABLE extratos_bancarios ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'Não Conciliado';
    ALTER TABLE extratos_bancarios ADD COLUMN IF NOT EXISTS lancamento_financeiro_id UUID;
    ALTER TABLE extratos_bancarios ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
    ALTER TABLE extratos_bancarios ADD COLUMN IF NOT EXISTS tenant_id UUID;
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'extratos_bancarios' AND column_name = 'tenant_id') THEN
        ALTER TABLE extratos_bancarios ALTER COLUMN tenant_id DROP NOT NULL;
    END IF;
END $$;

-- 3. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_contas_bancarias_status ON contas_bancarias(status);
CREATE INDEX IF NOT EXISTS idx_extratos_bancarios_conta_id ON extratos_bancarios(conta_bancaria_id);
CREATE INDEX IF NOT EXISTS idx_extratos_bancarios_status ON extratos_bancarios(status);
CREATE INDEX IF NOT EXISTS idx_extratos_bancarios_status_conciliacao ON extratos_bancarios(status_conciliacao);
CREATE INDEX IF NOT EXISTS idx_extratos_bancarios_data ON extratos_bancarios(data_movimentacao DESC);
CREATE INDEX IF NOT EXISTS idx_extratos_bancarios_lancamento_id ON extratos_bancarios(lancamento_financeiro_id);

-- 4. POLÍTICAS DE ROW LEVEL SECURITY (RLS)
ALTER TABLE contas_bancarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE extratos_bancarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select on contas_bancarias" ON contas_bancarias;
CREATE POLICY "Public select on contas_bancarias" ON contas_bancarias FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert on contas_bancarias" ON contas_bancarias;
CREATE POLICY "Public insert on contas_bancarias" ON contas_bancarias FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update on contas_bancarias" ON contas_bancarias;
CREATE POLICY "Public update on contas_bancarias" ON contas_bancarias FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete on contas_bancarias" ON contas_bancarias;
CREATE POLICY "Public delete on contas_bancarias" ON contas_bancarias FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public select on extratos_bancarios" ON extratos_bancarios;
CREATE POLICY "Public select on extratos_bancarios" ON extratos_bancarios FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert on extratos_bancarios" ON extratos_bancarios;
CREATE POLICY "Public insert on extratos_bancarios" ON extratos_bancarios FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update on extratos_bancarios" ON extratos_bancarios;
CREATE POLICY "Public update on extratos_bancarios" ON extratos_bancarios FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete on extratos_bancarios" ON extratos_bancarios;
CREATE POLICY "Public delete on extratos_bancarios" ON extratos_bancarios FOR DELETE USING (true);

-- Notificar PostgREST do schema reload
NOTIFY pgrst, 'reload schema';
