-- ==============================================================================
-- FOCUS ERP - TABELA RELACIONAL DE FOTOS DE PERFIL DOS COLABORADORES (RH)
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Adicionar colunas de foto e perfil na tabela colaboradores (se não existirem)
ALTER TABLE IF EXISTS public.colaboradores 
    ADD COLUMN IF NOT EXISTS foto TEXT,
    ADD COLUMN IF NOT EXISTS foto_url TEXT,
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS telefone TEXT,
    ADD COLUMN IF NOT EXISTS rg TEXT,
    ADD COLUMN IF NOT EXISTS data_nascimento DATE,
    ADD COLUMN IF NOT EXISTS nome_social TEXT,
    ADD COLUMN IF NOT EXISTS metodo_pagamento JSONB,
    ADD COLUMN IF NOT EXISTS documentos JSONB;

-- 2. Criar a Tabela Relacional Dedicada para Fotos dos Colaboradores
CREATE TABLE IF NOT EXISTS public.colaborador_fotos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colaborador_id UUID NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
    colaborador_matricula TEXT,
    colaborador_email TEXT,
    foto_url TEXT,
    foto_base64 TEXT,
    tipo_imagem TEXT DEFAULT 'image/jpeg',
    tamanho_bytes BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_colaborador_foto UNIQUE (colaborador_id)
);

-- 3. Índices Relacionais para Busca Rápida e Performance
CREATE INDEX IF NOT EXISTS idx_colaborador_fotos_colaborador_id ON public.colaborador_fotos(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_colaborador_fotos_email ON public.colaborador_fotos(colaborador_email);
CREATE INDEX IF NOT EXISTS idx_colaborador_fotos_matricula ON public.colaborador_fotos(colaborador_matricula);

-- 4. Desabilitar RLS e Conceder Permissões para Sincronização Total (Desktop & Mobile)
ALTER TABLE public.colaborador_fotos DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.colaborador_fotos TO anon, authenticated, service_role;
