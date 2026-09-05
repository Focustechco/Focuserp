import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { safeSetItem, safeGetItem, safeRemoveItem } from '@/lib/safeStorage';
import { userService } from '@/services/userService';

/**
 * Helper to ensure a string is a valid UUID for PostgreSQL uuid columns.
 */
function toValidUuid(idStr?: string): string {
  if (!idStr) return crypto.randomUUID();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(idStr)) return idStr;
  return crypto.randomUUID();
}

function toNullableValidUuid(idStr?: string | null): string | null {
  if (!idStr || typeof idStr !== 'string') return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(idStr) ? idStr : null;
}

function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  const map = new Map<string, T>();
  items.forEach((item) => {
    if (item && item.id) {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values());
}

const DMS_FOLDER_NAMES = [
  'Clientes',
  'Projetos',
  'RH',
  'Colaboradores',
  'Folha de Pagamento',
  'Contratos de Trabalho',
  'Atestados e Licenças',
  'Produtos Focus',
  'Manuais e Guias',
];

function isDmsFolderObject(item: any): boolean {
  if (!item || typeof item !== 'object') return false;
  // Categorias do Plano de Contas e Centros de Custo nunca são pastas do DMS
  if (
    item.codigo !== undefined || 
    item.natureza !== undefined || 
    item.tipo === 'Despesa' || 
    item.tipo === 'Receita' || 
    item.saldoAcumuladoMensal !== undefined || 
    item.departamento !== undefined ||
    item.responsavel !== undefined
  ) {
    return false;
  }
  if (item.caminhoCompleto || item.moduloVinculado) return true;
  if (item.nome && DMS_FOLDER_NAMES.includes(item.nome) && !item.codigo && !item.tipo && !item.clienteId && !item.valorContratado && !item.numeroContrato) {
    return true;
  }
  return false;
}

function isValidItem(table: string, item: any): boolean {
  if (!item || typeof item !== 'object') return false;
  if (!item.id || typeof item.id !== 'string') return false;

  // Rejeitar pastas do DMS injetadas por colisão em outros módulos
  if (table !== 'focus_dms_pastas' && isDmsFolderObject(item)) {
    return false;
  }

  // Profile rows de usuário pertencem ao userService e não devem aparecer em outras tabelas
  if (!table.includes('usuario') && !table.includes('user') && item.name && typeof item.name === 'string' && item.name.startsWith('__USER_PROFILE__')) {
    return false;
  }

  if (table.includes('plano_contas') || table.includes('categorias')) {
    return Boolean(item.nome && typeof item.nome === 'string' && item.nome.trim().length > 0);
  }
  if (table.includes('centro_custos') || table.includes('centro-de-custos')) {
    return Boolean(item.nome && typeof item.nome === 'string' && item.nome.trim().length > 0);
  }

  if (table.includes('contas_receber') || table.includes('receber')) {
    const hasCliente = Boolean(item.cliente || item.clienteNome || item.cliente_nome);
    const hasDesc = Boolean(item.descricao);
    const hasValor = Number(item.valorOriginal ?? item.valor ?? 0) > 0;
    const hasNum = Boolean(item.numero && !item.numero.startsWith('REC-0000'));
    return hasCliente || hasDesc || hasValor || hasNum;
  }
  if (table.includes('contas_pagar') || table.includes('pagar')) {
    const hasForn = Boolean(item.fornecedor || item.fornecedorNome || item.fornecedor_nome);
    const hasDesc = Boolean(item.descricao);
    const hasValor = Number(item.valorOriginal ?? item.valor ?? 0) > 0;
    return hasForn || hasDesc || hasValor;
  }
  if (table.includes('fornecedores')) {
    const name = item.nomeFantasia || item.razaoSocial || item.name || item.nome;
    return Boolean(name && name.trim() !== '' && name !== 'Fornecedor Sem Nome');
  }
  if (table.includes('contratos')) {
    const hasContractData = Boolean(item.numeroContrato || item.objetoContrato || item.objeto || item.valorTotal || item.valorMensalidade || item.tipoContrato);
    if (!hasContractData && !item.nome) return false;
    if (DMS_FOLDER_NAMES.includes(item.nome)) return false;
    return true;
  }
  if (table.includes('projetos')) {
    if (DMS_FOLDER_NAMES.includes(item.nome) && !item.clienteId && !item.valorContratado) return false;
    return Boolean(item.nome && typeof item.nome === 'string' && item.nome.trim().length > 0);
  }
  if (table.includes('produtos')) {
    if (DMS_FOLDER_NAMES.includes(item.nome) && !item.preco && !item.categoria) return false;
    return Boolean((item.nome || item.name) && typeof (item.nome || item.name) === 'string');
  }
  if (table.includes('notificacoes')) {
    return Boolean(item.titulo && typeof item.titulo === 'string' && item.titulo.trim().length > 0);
  }
  if (table.includes('cobrancas') || table.includes('cobranca')) {
    return Boolean(item.id && (item.cliente || item.valor !== undefined || item.tituloReferencia));
  }

  if (table.includes('equipamento')) {
    return Boolean(item.id && (item.codigoPatrimonial || item.modelo || item.marca || item.categoria || item.nome));
  }
  if (table.includes('estoque') || table.includes('almoxarifado')) {
    return Boolean(item.id && (item.nome || item.descricao || item.codigo || item.categoria || item.localizacao || item.titulo || item.itemNome));
  }
  if (table.includes('licenca') || table.includes('software')) {
    return Boolean(item.id && (item.nome || item.fabricante || item.plano || item.software));
  }
  if (table.includes('patrimonio') || table.includes('ativo')) {
    return Boolean(item.id && (item.numeroPatrimonial || item.codigoInterno || item.categoria || item.nome || item.descricao));
  }
  if (table.includes('movimentac')) {
    return Boolean(item.id && (item.tipo || item.dataHora || item.equipamentoNome || item.estoqueItemNome || item.usuarioNome));
  }
  if (table.includes('inventario')) {
    return Boolean(item.id && (item.titulo || item.dataInicio || item.responsavelNome));
  }
  if (table.includes('manutenc')) {
    return Boolean(item.id && (item.equipamentoNome || item.equipamentoCodigo || item.descricao || item.tipo));
  }

  // Expurgar dados mockados residuais antigos em RH, Comercial e Assinaturas
  const LEGACY_MOCK_IDS = [
    'fer-1', 'fer-2', 'fer-3',
    'ben-1', 'ben-2', 'ben-3',
    'ciclo-1', 'ciclo-2',
    'doc-rh-1', 'doc-rh-2',
    'onb-1', 'onb-2', 'onb-3',
    'ponto-1', 'ponto-2', 'ponto-3',
    'treina-1', 'treina-2',
    'colab-1', 'colab-2', 'colab-3', 'colab-101', 'colab-102', 'colab-103', 'colab-104', 'colab-105', 'colab-106',
    'doc-sign-1', 'doc-sign-2', 'doc-sign-3',
    'mod-1', 'mod-2', 'mod-3',
    'cert-1', 'cert-2',
    'meta-1', 'meta-2', 'meta-3',
    'okr-1', 'okr-2',
    'prod-1', 'prod-2',
    'serv-1',
    'tab-1', 'tab-2',
    'prop-1', 'prop-2',
    'sc-1', 'sc-2',
    'pb-1', 'pb-2',
    'atv-1', 'atv-2', 'atv-3',
    'ag-1', 'ag-2', 'ag-3',
    'rc-1', 'rc-2',
    'reg-com-1', 'reg-com-2'
  ];

  if (item.id && LEGACY_MOCK_IDS.includes(item.id)) {
    return false;
  }

  // Verificar nomes de colaboradores mockados específicos do RH
  if (table.startsWith('focus_rh_') || table.includes('ferias') || table.includes('colaborador')) {
    const nomeColab = item.colaboradorNome || item.colaborador || item.nomeCompleto || item.nome || '';
    if (['Mariana Souza', 'Lucas Rodrigues', 'Carlos Eduardo Oliveira', 'TechCorp'].includes(nomeColab)) {
      return false;
    }
  }

  return true;
}

/**
 * Retorna todas as chaves candidatas de armazenamento local para uma dada tabela/módulo
 */
export function getCandidateKeysForTable(table: string): string[] {
  const keys = new Set<string>([`focus_app_${table}`, table, `focus_${table}`]);

  if (table.includes('equipamento')) {
    [
      'focus_itam_equipamentos',
      'focus_app_focus_itam_equipamentos',
      'focus_equipamentos',
      'focus_app_equipamentos',
      'equipamentos',
      'focus_itam_equipamento',
      'focus_equipamento',
      'focus_patrimonio_equipamentos',
      'focus_app_patrimonio_equipamentos',
      'focus_app_focus_equipamentos',
    ].forEach((k) => keys.add(k));
  }

  if (table.includes('estoque') || table.includes('almoxarifado')) {
    [
      'focus_itam_estoque_itens',
      'focus_app_focus_itam_estoque_itens',
      'focus_estoque_itens',
      'focus_app_estoque_itens',
      'focus_estoque',
      'focus_app_estoque',
      'estoque_itens',
      'estoque',
      'focus_itam_estoque',
      'focus_app_itam_estoque',
      'focus_almoxarifado',
      'focus_app_almoxarifado',
      'focus_itens_estoque',
      'focus_app_itens_estoque',
      'focus_app_focus_estoque_itens',
      'focus_app_focus_estoque',
    ].forEach((k) => keys.add(k));
  }

  if (table.includes('licenca') || table.includes('software')) {
    [
      'focus_itam_licencas',
      'focus_app_focus_itam_licencas',
      'focus_licencas',
      'focus_app_licencas',
      'licencas',
      'focus_licenca',
      'focus_app_licenca',
      'focus_softwares',
      'focus_software_licencas',
      'focus_app_focus_licencas',
    ].forEach((k) => keys.add(k));
  }

  if (table.includes('patrimonio') || table.includes('ativo')) {
    [
      'focus_itam_patrimonios',
      'focus_app_focus_itam_patrimonios',
      'focus_patrimonios',
      'focus_app_patrimonios',
      'focus_patrimonio',
      'focus_app_patrimonio',
      'patrimonios',
      'patrimonio',
      'focus_ativos',
      'focus_app_ativos',
      'focus_ativos_patrimonio',
      'focus_app_focus_patrimonios',
    ].forEach((k) => keys.add(k));
  }

  if (table.includes('movimentac')) {
    [
      'focus_itam_movimentacoes',
      'focus_app_focus_itam_movimentacoes',
      'focus_movimentacoes',
      'focus_app_movimentacoes',
      'movimentacoes',
      'focus_movimentacao',
      'focus_app_focus_movimentacoes',
    ].forEach((k) => keys.add(k));
  }

  if (table.includes('inventario')) {
    [
      'focus_itam_inventarios',
      'focus_app_focus_itam_inventarios',
      'focus_inventarios',
      'focus_app_inventarios',
      'inventarios',
      'focus_inventario',
      'focus_app_focus_inventarios',
    ].forEach((k) => keys.add(k));
  }

  if (table.includes('manutenc')) {
    [
      'focus_itam_manutencoes',
      'focus_app_focus_itam_manutencoes',
      'focus_manutencoes',
      'focus_app_manutencoes',
      'manutencoes',
      'focus_manutencao',
      'focus_app_focus_manutencoes',
    ].forEach((k) => keys.add(k));
  }

  if (table.includes('conta') && table.includes('bancari')) {
    [
      'focus_contas_bancarias',
      'focus_app_focus_contas_bancarias',
      'contas_bancarias',
      'focus_app_contas_bancarias',
    ].forEach((k) => keys.add(k));
  }

  if (table.includes('extrato')) {
    [
      'focus_extratos',
      'focus_app_focus_extratos',
      'extratos_bancarios',
      'focus_extratos_bancarios',
      'focus_app_extratos_bancarios',
      'extratos',
    ].forEach((k) => keys.add(k));
  }

  return Array.from(keys);
}

/**
 * Helper to safely read from localStorage and auto-heal contaminated cache with multi-key recovery
 */
function readLocalCache<T>(table: string, fallback: T[]): T[] {
  if (typeof window === 'undefined') return fallback;
  try {
    const keysToTry = getCandidateKeysForTable(table);
    const aggregatedItems = new Map<string, any>();

    for (const k of keysToTry) {
      const raw = safeGetItem(k);
      if (raw !== null && raw !== undefined) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            // Auto-heal: se o cache foi contaminado por pastas do DMS, expurgar a chave
            if (table !== 'focus_dms_pastas' && parsed.some(isDmsFolderObject)) {
              safeRemoveItem(k);
              continue;
            }

            const valid = parsed.filter((it) => isValidItem(table, it));
            valid.forEach((it) => {
              if (it && it.id && !aggregatedItems.has(String(it.id))) {
                aggregatedItems.set(String(it.id), it);
              }
            });
          }
        } catch {}
      }
    }

    if (aggregatedItems.size > 0) {
      return Array.from(aggregatedItems.values());
    }
  } catch {}
  return fallback;
}

/**
 * Helper to safely write to localStorage across all candidate aliases
 */
function writeLocalCache<T>(table: string, items: T[]) {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(items);
    const keys = getCandidateKeysForTable(table);
    for (const k of keys) {
      safeSetItem(k, serialized);
    }
  } catch {}
}

function toSnakeCasePayload(table: string, item: any): any {
  const isDms = table.includes('dms') || table.includes('pasta') || table.includes('document');
  const validId = isDms ? String(item.id) : toValidUuid(item.id);
  const base: any = { id: validId, updated_at: new Date().toISOString() };

  if (table.includes('dms_pasta') || table === 'dms_pastas' || table === 'focus_dms_pastas') {
    return {
      id: String(item.id),
      nome: item.nome,
      parent_id: item.parentId || item.parent_id || null,
      caminho_completo: item.caminhoCompleto || item.caminho_completo || `/${item.nome}`,
      modulo_vinculado: item.moduloVinculado || item.modulo_vinculado || null,
      data_criacao: item.dataCriacao || item.data_criacao || new Date().toISOString(),
      criado_por: item.criadoPor || item.criado_por || 'Sistema',
      updated_at: new Date().toISOString(),
    };
  }

  if (table.includes('dms_doc') || table === 'dms_documentos' || table === 'focus_dms_documentos') {
    return {
      id: String(item.id),
      codigo: item.codigo || `DOC-${String(item.id).slice(0, 6).toUpperCase()}`,
      nome: item.nome,
      extensao: item.extensao || item.nome?.split('.').pop() || 'pdf',
      tamanho: item.tamanho || '1.0 MB',
      tamanho_bytes: Number(item.tamanhoBytes ?? item.tamanho_bytes ?? 0) || 0,
      pasta_id: item.pastaId || item.pasta_id || 'root',
      caminho_pasta: item.caminhoPasta || item.caminho_pasta || '/',
      modulo_origem: item.moduloOrigem || item.modulo_origem || 'Geral',
      tags: Array.isArray(item.tags) ? item.tags : [],
      categoria: item.categoria || 'Geral',
      responsavel_upload: item.responsavelUpload || item.responsavel_upload || 'Sistema',
      data_upload: item.dataUpload || item.data_upload || new Date().toISOString(),
      versao_atual: item.versaoAtual || item.versao_atual || '1.0',
      favorito: Boolean(item.favorito),
      status: item.status || 'Ativo',
      historico_versoes: Array.isArray(item.historicoVersoes) ? item.historicoVersoes : [],
      url_conteudo: (item.urlConteudo && item.urlConteudo.startsWith('data:') && item.urlConteudo.length > 2000) ? null : (item.urlConteudo || item.url_conteudo || null),
      cliente_id: toNullableValidUuid(item.clienteId || item.cliente_id),
      projeto_id: toNullableValidUuid(item.projetoId || item.projeto_id),
      contrato_id: toNullableValidUuid(item.contratoId || item.contrato_id),
      colaborador_id: toNullableValidUuid(item.colaboradorId || item.colaborador_id),
      updated_at: new Date().toISOString(),
    };
  }

  if (table.includes('notificac')) {
    return {
      ...base,
      titulo: item.titulo || 'Notificação',
      mensagem: item.descricao || item.mensagem || '',
      descricao: item.descricao || item.mensagem || '',
      origem: item.origem || 'Sistema',
      tipo: item.tipo || 'Informação',
      prioridade: item.prioridade || 'Normal',
      lida: Boolean(item.lida),
      arquivada: Boolean(item.arquivada),
      data_criacao: item.dataCriacao || item.data_criacao || new Date().toISOString(),
      responsavel: item.responsavel || 'Sistema',
      usuario_destino: item.usuarioDestino || item.usuario_destino || 'Você',
      target_url: item.targetUrl || item.target_url || item.link_redirecionamento || '/',
      link_redirecionamento: item.targetUrl || item.target_url || item.link_redirecionamento || '/',
      entidade_id: toNullableValidUuid(item.entidadeId || item.entidade_id),
    };
  }

  if (table.includes('equipamento')) {
    return {
      ...base,
      codigo_patrimonial: item.codigoPatrimonial || item.codigo_patrimonial || `PAT-${validId.slice(0, 4).toUpperCase()}`,
      categoria: item.categoria || 'Outros',
      marca: item.marca || 'Genérico',
      modelo: item.modelo || item.nome || 'Equipamento',
      numero_serie: item.numeroSerie || item.numero_serie || null,
      data_aquisicao: item.dataAquisicao || item.data_aquisicao || new Date().toISOString().split('T')[0],
      valor_compra: Number(item.valorCompra ?? item.valor_compra ?? item.valor ?? 0) || 0,
      garantia_meses: Number(item.garantiaMeses ?? item.garantia_meses ?? 12) || 12,
      situacao: item.situacao || 'Disponível',
      departamento: item.departamento || null,
      colaborador_id: toNullableValidUuid(item.colaboradorId || item.colaborador_id),
      colaborador_nome: item.colaboradorNome || item.colaborador_nome || null,
      local_fisica: item.localFisica || item.local_fisica || 'Estoque Central',
      notebook_specs: item.notebookSpecs || item.notebook_specs || {},
      monitor_specs: item.monitorSpecs || item.monitor_specs || {},
      timeline: Array.isArray(item.timeline) ? item.timeline : [],
      observacoes: item.observacoes || null,
    };
  }

  if (table.includes('estoque') || table.includes('almoxarifado')) {
    return {
      ...base,
      codigo: item.codigo || `EST-${validId.slice(0, 4).toUpperCase()}`,
      nome: item.nome || item.titulo || item.itemNome || 'Item de Estoque',
      descricao: item.descricao || null,
      categoria: item.categoria || 'Geral',
      quantidade: Number(item.quantidade ?? 0) || 0,
      quantidade_minima: Number(item.quantidadeMinima ?? item.quantidade_minima ?? 0) || 0,
      valor_unitario: Number(item.valorUnitario ?? item.valor_unitario ?? 0) || 0,
      estado_conservacao: item.estadoConservacao || item.estado_conservacao || 'Bom',
      localizacao: item.localizacao || 'Almoxarifado Central',
      status: item.status || 'Disponível',
      responsavel_nome: item.responsavelNome || item.responsavel_nome || null,
      observacoes: item.observacoes || null,
    };
  }

  if (table.includes('licenca') || table.includes('software')) {
    return {
      ...base,
      software: item.software || item.nome || 'Software',
      fabricante: item.fabricante || 'Fabricante',
      tipo_licenca: item.tipoLicenca || item.tipo_licenca || item.plano || 'SaaS',
      quantidade_total: Number(item.quantidadeTotal ?? item.quantidadeContratada ?? item.quantidade ?? 1) || 1,
      quantidade_em_uso: Number(item.quantidadeEmUso ?? 0) || 0,
      valor_unitario: Number(item.valorUnitario ?? item.valor ?? 0) || 0,
      data_expiracao: item.dataExpiracao || item.dataRenovacao || null,
      status: item.status || 'Ativa',
    };
  }

  if (table.includes('patrimonio') || table.includes('ativo')) {
    return {
      ...base,
      codigo_patrimonial: item.codigoPatrimonial || item.numeroPatrimonial || item.codigoInterno || `PAT-${validId.slice(0, 4).toUpperCase()}`,
      nome: item.nome || item.descricao || 'Ativo Patrimonial',
      categoria: item.categoria || 'Geral',
      valor: Number(item.valor ?? item.valorAquisicao ?? item.valorCompra ?? 0) || 0,
      data_aquisicao: item.dataAquisicao || new Date().toISOString().split('T')[0],
      localizacao: item.localizacao || 'Sede Principal',
      status: item.status || 'Ativo',
      responsavel: item.responsavel || item.responsavelNome || null,
    };
  }

  if (table.includes('centros_custo') || table.includes('centro_custos')) {
    return {
      ...base,
      codigo: item.codigo || `CC-${validId.slice(0, 4).toUpperCase()}`,
      nome: item.nome || 'Centro de Custo',
      departamento: item.departamento || 'Geral',
      responsavel_nome: item.responsavelNome || item.responsavel_nome || item.responsavel || null,
      orcamento_mensal: Number(item.orcamentoMensal ?? item.orcamento_mensal ?? 0) || 0,
      gasto_acumulado: Number(item.gastoAcumulado ?? item.gasto_acumulado ?? 0) || 0,
      status: item.status || 'Ativo',
      descricao: item.descricao || null,
    };
  }

  if (table.includes('plano_contas') || table.includes('categorias')) {
    return {
      ...base,
      codigo: item.codigo || `PC-${validId.slice(0, 4).toUpperCase()}`,
      nome: item.nome || 'Categoria',
      tipo: item.tipo || 'Despesa',
      natureza: item.natureza || 'Operacional',
      status: item.status || 'Ativo',
      cor: item.cor || '#64748B',
      descricao: item.descricao || null,
    };
  }

  if (table.includes('cobrancas') || table.includes('cobranca')) {
    return {
      ...base,
      cliente_id: toNullableValidUuid(item.clienteId),
      cliente_nome: item.clienteNome || item.cliente || 'Cliente',
      valor: Number(item.valor ?? item.valorTotal ?? 0) || 0,
      status: item.status || 'Pendente',
      data_vencimento: item.dataVencimento || item.vencimento || new Date().toISOString().split('T')[0],
      forma_pagamento: item.formaPagamento || 'Boleto',
      link_pagamento: item.linkPagamento || null,
    };
  }

  if (table.includes('produtos')) {
    return {
      ...base,
      codigo: item.codigo || `PRD-${validId.slice(0, 4).toUpperCase()}`,
      nome: item.nome || 'Produto Focus',
      categoria: item.categoria || 'SaaS',
      descricao_breve: item.descricaoBreve || item.descricao_breve || item.descricao || null,
      status: item.status || 'Ativo',
      versao_atual: item.versaoAtual || item.versao_atual || '1.0.0',
      planos: Array.isArray(item.planos) ? item.planos : [],
      roadmap: Array.isArray(item.roadmap) ? item.roadmap : [],
      releases: Array.isArray(item.releases) ? item.releases : [],
      funcionalidades: Array.isArray(item.funcionalidades) ? item.funcionalidades : [],
    };
  }

  if (table.includes('contas_bancarias') || table.includes('conta_bancaria')) {
    return {
      ...base,
      nome_conta: item.titular || item.nomeConta || item.banco || 'Conta Bancária',
      banco_nome: item.banco || item.bancoNome || 'Banco',
      banco_codigo: item.bancoCodigo || item.digito || '000',
      agencia: item.agencia || '',
      conta_corrente: item.conta ? `${item.conta}${item.digito ? `-${item.digito}` : ''}` : (item.contaCorrente || ''),
      tipo_conta: item.tipoConta || item.tipo_conta || 'Corrente',
      titular: item.titular || '',
      cnpj: item.cnpj || '',
      chave_pix: item.chavePix || item.chave_pix || '',
      saldo_inicial: Number(item.saldoInicial ?? item.saldo_inicial ?? 0) || 0,
      saldo_atual: Number(item.saldoAtual ?? item.saldo_atual ?? 0) || 0,
      status: item.status || 'Ativa',
    };
  }

  if (table.includes('extratos_bancarios') || table.includes('extrato')) {
    return {
      ...base,
      conta_bancaria_id: toNullableValidUuid(item.contaBancariaId || item.conta_bancaria_id),
      data_movimentacao: item.data || item.dataMovimentacao || item.data_movimentacao || new Date().toISOString().split('T')[0],
      descricao_banco: item.historico || item.descricaoBanco || item.descricao_banco || 'Movimentação Bancária',
      documento_ref: item.documento || item.documentoRef || item.documento_ref || null,
      tipo: item.tipo || 'Crédito',
      valor: Number(item.valor ?? 0) || 0,
      status_conciliacao: item.status || item.statusConciliacao || item.status_conciliacao || 'Não Conciliado',
      conta_vinculada_id: toNullableValidUuid(item.lancamentoFinanceiroId || item.contaVinculadaId || item.conta_vinculada_id),
      conta_vinculada_tipo: item.contaVinculadaTipo || item.conta_vinculada_tipo || null,
    };
  }

  return { ...item, id: validId, updated_at: new Date().toISOString() };
}

function fromSnakeCaseRow(table: string, row: any): any {
  if (!row) return row;

  if (table.includes('dms_pasta') || table === 'dms_pastas' || table === 'focus_dms_pastas') {
    return {
      ...row,
      id: String(row.id),
      parentId: row.parent_id ?? row.parentId ?? null,
      caminhoCompleto: row.caminho_completo || row.caminhoCompleto || `/${row.nome}`,
      moduloVinculado: row.modulo_vinculado || row.moduloVinculado,
      dataCriacao: row.data_criacao || row.created_at || row.dataCriacao,
      criadoPor: row.criado_por || row.criadoPor || 'Sistema',
    };
  }

  if (table.includes('dms_doc') || table === 'dms_documentos' || table === 'focus_dms_documentos') {
    return {
      ...row,
      id: String(row.id),
      tamanhoBytes: Number(row.tamanho_bytes ?? row.tamanhoBytes ?? 0),
      pastaId: row.pasta_id || row.pastaId,
      caminhoPasta: row.caminho_pasta || row.caminhoPasta,
      moduloOrigem: row.modulo_origem || row.moduloOrigem,
      responsavelUpload: row.responsavel_upload || row.responsavelUpload,
      dataUpload: row.data_upload || row.created_at || row.dataUpload,
      dataUltimaAlteracao: row.updated_at || row.data_upload || row.dataUpload,
      versaoAtual: row.versao_atual || row.versaoAtual || '1.0',
      urlConteudo: row.url_conteudo || row.urlConteudo,
      historicoVersoes: Array.isArray(row.historico_versoes) ? row.historico_versoes : (row.historicoVersoes || []),
      clienteId: row.cliente_id || row.clienteId,
      projetoId: row.projeto_id || row.projetoId,
      contratoId: row.contrato_id || row.contratoId,
      colaboradorId: row.colaborador_id || row.colaboradorId,
    };
  }

  if (table.includes('notificac')) {
    return {
      ...row,
      id: String(row.id),
      titulo: row.titulo || 'Notificação',
      descricao: row.descricao || row.mensagem || '',
      origem: row.origem || 'Sistema',
      tipo: row.tipo || 'Informação',
      prioridade: row.prioridade || 'Normal',
      lida: Boolean(row.lida),
      arquivada: Boolean(row.arquivada),
      dataCriacao: row.data_criacao || row.created_at || new Date().toISOString(),
      responsavel: row.responsavel || 'Sistema',
      usuarioDestino: row.usuario_destino || 'Você',
      targetUrl: row.target_url || row.link_redirecionamento || '/',
      entidadeId: row.entidade_id || undefined,
    };
  }

  if (table.includes('equipamento')) {
    return {
      ...row,
      id: String(row.id),
      codigoPatrimonial: row.codigo_patrimonial || row.codigoPatrimonial,
      valorCompra: Number(row.valor_compra ?? row.valorCompra ?? 0) || 0,
      garantiaMeses: Number(row.garantia_meses ?? row.garantiaMeses ?? 12),
      dataAquisicao: row.data_aquisicao || row.dataAquisicao,
      localFisica: row.local_fisica || row.localFisica,
      colaboradorNome: row.colaborador_nome || row.colaboradorNome,
      colaboradorId: row.colaborador_id || row.colaboradorId,
      notebookSpecs: row.notebook_specs || row.notebookSpecs,
      monitorSpecs: row.monitor_specs || row.monitorSpecs,
      timeline: Array.isArray(row.timeline) ? row.timeline : [],
    };
  }
  if (table.includes('estoque') || table.includes('almoxarifado')) {
    return {
      ...row,
      id: String(row.id),
      quantidade: Number(row.quantidade ?? 0) || 0,
      quantidadeMinima: Number(row.quantidade_minima ?? row.quantidadeMinima ?? 0) || 0,
      valorUnitario: Number(row.valor_unitario ?? row.valorUnitario ?? 0) || 0,
      estadoConservacao: row.estado_conservacao || row.estadoConservacao || 'Bom',
      responsavelNome: row.responsavel_nome || row.responsavelNome,
    };
  }
  if (table.includes('licenca') || table.includes('software')) {
    return {
      ...row,
      id: String(row.id),
      software: row.software || row.nome || 'Software',
      fabricante: row.fabricante || 'Fabricante',
      tipoLicenca: row.tipo_licenca || row.plano || 'SaaS',
      quantidadeTotal: Number(row.quantidade_total ?? 1) || 1,
      quantidadeEmUso: Number(row.quantidade_em_uso ?? 0) || 0,
      valorUnitario: Number(row.valor_unitario ?? 0) || 0,
      dataExpiracao: row.data_expiracao,
    };
  }
  if (table.includes('patrimonio') || table.includes('ativo')) {
    return {
      ...row,
      id: String(row.id),
      codigoPatrimonial: row.codigo_patrimonial || row.numeroPatrimonial,
      valor: Number(row.valor ?? 0) || 0,
      dataAquisicao: row.data_aquisicao,
    };
  }
  if (table.includes('centros_custo') || table.includes('centro_custos')) {
    return {
      ...row,
      id: String(row.id),
      responsavelNome: row.responsavel_nome || row.responsavelNome,
      orcamentoMensal: Number(row.orcamento_mensal ?? row.orcamentoMensal ?? 0) || 0,
      gastoAcumulado: Number(row.gasto_acumulado ?? row.gastoAcumulado ?? 0) || 0,
    };
  }
  if (table.includes('cobrancas') || table.includes('cobranca')) {
    return {
      ...row,
      id: String(row.id),
      clienteNome: row.cliente_nome || row.cliente,
      clienteId: row.cliente_id,
      valor: Number(row.valor ?? 0) || 0,
      dataVencimento: row.data_vencimento,
      formaPagamento: row.forma_pagamento,
      linkPagamento: row.link_pagamento,
    };
  }
  if (table.includes('produtos')) {
    return {
      ...row,
      id: String(row.id),
      descricaoBreve: row.descricao_breve || row.descricaoBreve,
      versaoAtual: row.versao_atual || row.versaoAtual,
    };
  }
  if (table.includes('contas_bancarias') || table.includes('conta_bancaria')) {
    const rawConta = row.conta_corrente || row.conta || '';
    const parts = rawConta.includes('-') ? rawConta.split('-') : [rawConta, ''];
    return {
      ...row,
      id: String(row.id),
      banco: row.banco_nome || row.banco || 'Banco',
      agencia: row.agencia || '',
      conta: parts[0] || rawConta,
      digito: parts[1] || row.banco_codigo || row.digito || '',
      tipoConta: row.tipo_conta || row.tipoConta || 'Corrente',
      titular: row.titular || row.nome_conta || '',
      cnpj: row.cnpj || '',
      chavePix: row.chave_pix || row.chavePix || '',
      saldoInicial: Number(row.saldo_inicial ?? row.saldoInicial ?? 0) || 0,
      saldoAtual: Number(row.saldo_atual ?? row.saldoAtual ?? 0) || 0,
      status: row.status || 'Ativa',
    };
  }
  if (table.includes('extratos_bancarios') || table.includes('extrato')) {
    return {
      ...row,
      id: String(row.id),
      contaBancariaId: row.conta_bancaria_id || row.contaBancariaId || '',
      data: row.data_movimentacao || row.data || row.created_at || new Date().toISOString().split('T')[0],
      historico: row.descricao_banco || row.historico || 'Movimentação Bancária',
      documento: row.documento_ref || row.documento || '',
      valor: Number(row.valor ?? 0) || 0,
      tipo: row.tipo || 'Crédito',
      status: row.status_conciliacao || row.status || 'Não Conciliado',
      lancamentoFinanceiroId: row.conta_vinculada_id || row.lancamentoFinanceiroId || undefined,
    };
  }
  return row;
}

/**
 * Hook de Persistência 100% Relacional com Isolamento Estrito de Tabelas no Supabase / PostgreSQL.
 * Sincronização em tempo real entre Desktop e Mobile (iOS/Android).
 */
export function useLocalStorageState<T extends { id: string }>(
  table: string,
  initialValue: T[] = []
) {
  const [data, setData] = useState<T[]>(() => readLocalCache(table, initialValue));
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isClientsTable = table === 'clients' || table === 'clientes' || table === 'focus_clientes';
  const isUsersTable = table === 'focus_usuarios' || table === 'users' || table === 'usuarios';
  const isContasReceber = table === 'focus_contas_receber' || table === 'contas_receber';
  const isContasPagar = table === 'focus_contas_pagar' || table === 'contas_pagar';
  const isContratos = table === 'focus_contratos' || table === 'contratos';
  const isProjetos = table === 'focus_projetos' || table === 'projetos';
  const isFornecedores = table === 'focus_fornecedores' || table === 'fornecedores';
  const isColaboradores = table === 'focus_colaboradores' || table === 'colaboradores' || table === 'focus_rh_colaboradores';

  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);

  // Determinar a tabela primária real no PostgreSQL do Supabase
  const primaryDbTable = isContasReceber
    ? 'contas_receber'
    : isContasPagar
    ? 'contas_pagar'
    : isContratos
    ? 'contratos'
    : isProjetos
    ? 'projetos'
    : isFornecedores
    ? 'fornecedores'
    : isColaboradores
    ? 'colaboradores'
    : isClientsTable
    ? 'clientes'
    : isUsersTable
    ? 'users'
    : table === 'focus_cobrancas' || table === 'cobrancas'
    ? 'cobrancas'
    : table === 'focus_centro_custos' || table === 'centros_custo' || table === 'centro_custos'
    ? 'centros_custo'
    : table === 'focus_plano_contas' || table === 'plano_contas' || table === 'categorias'
    ? 'plano_contas'
    : table.includes('equipamento')
    ? 'equipamentos'
    : table.includes('estoque') || table.includes('almoxarifado')
    ? 'estoque_itens'
    : table.includes('licenca') || table.includes('software')
    ? 'licencas_software'
    : table.includes('patrimonio') || table.includes('ativo')
    ? 'patrimonios'
    : table.includes('movimentac')
    ? 'movimentacoes_patrimonio'
    : table.includes('manutenc')
    ? 'manutencoes'
    : table.includes('inventario')
    ? 'inventarios'
    : table === 'focus_produtos' || table === 'produtos_focus' || table === 'produtos'
    ? 'produtos_focus'
    : table === 'focus_agenda_entregas' || table === 'agenda_entregas'
    ? 'agenda_entregas'
    : table === 'focus_crm_leads' || table === 'crm_leads'
    ? 'crm_leads'
    : table === 'focus_marketing_campanhas' || table === 'marketing_campanhas'
    ? 'marketing_campanhas'
    : table === 'focus_dms_documentos' || table === 'dms_documentos'
    ? 'dms_documentos'
    : table === 'focus_dms_pastas' || table === 'dms_pastas'
    ? 'dms_pastas'
    : table === 'focus_assinaturas' || table === 'assinaturas_digitais'
    ? 'assinaturas_digitais'
    : table === 'focus_empresa_config' || table === 'empresa_config'
    ? 'empresa_config'
    : table === 'focus_notificacoes' || table === 'notificacoes'
    ? 'notificacoes'
    : table === 'focus_contas_bancarias' || table === 'contas_bancarias'
    ? 'contas_bancarias'
    : table === 'focus_extratos' || table === 'extratos_bancarios' || table === 'extratos'
    ? 'extratos_bancarios'
    : null;

  // ---------------------------------------------------------------------------
  // Sincronizar com o Banco de Dados Real no Supabase
  // ---------------------------------------------------------------------------
  const syncToCloud = useCallback(
    async (items: T[]) => {
      try {
        if (isUsersTable) {
          await userService.saveAllUsers(items as any);
          return;
        }

        // 1. Gravação direta e isolada na tabela relacional correspondente no PostgreSQL
        if (isContasReceber) {
          const payload = items.map((item: any) => {
            const validId = toValidUuid(item.id);
            item.id = validId;
            return {
              id: validId,
              numero: item.numero || item.codigo || `REC-${validId.slice(0, 4).toUpperCase()}`,
              cliente_nome: item.cliente || item.clienteNome || 'Cliente',
              cliente_id: toNullableValidUuid(item.clienteId),
              descricao: item.descricao || 'Recebimento de título',
              categoria: item.categoria || 'Receita Operacional',
              valor_original: Number(item.valorOriginal ?? item.valor ?? 0) || 0,
              valor_recebido: Number(item.valorRecebido ?? 0) || 0,
              data_emissao: item.dataEmissao || new Date().toISOString().split('T')[0],
              data_vencimento: item.dataVencimento || item.vencimento || new Date().toISOString().split('T')[0],
              data_recebimento: item.dataRecebimento || null,
              forma_pagamento: item.formaPagamento || 'PIX',
              status: item.status || 'Pendente',
              responsavel: item.responsavel || 'Administrador',
              updated_at: new Date().toISOString(),
            };
          });
          const dedupedPayload = deduplicateById(payload);
          if (dedupedPayload.length > 0) {
            const { error: upsertErr } = await supabase.from('contas_receber').upsert(dedupedPayload, { onConflict: 'id' });
            if (upsertErr) {
              const safePayload = dedupedPayload.map(p => ({ ...p, cliente_id: null }));
              await supabase.from('contas_receber').upsert(safePayload, { onConflict: 'id' });
            }
          }
        } else if (isContasPagar) {
          const payload = items.map((item: any) => {
            const validId = toValidUuid(item.id);
            item.id = validId;
            return {
              id: validId,
              numero: item.numero || item.codigo || `PAG-${validId.slice(0, 4).toUpperCase()}`,
              fornecedor_nome: item.fornecedor || item.fornecedorNome || 'Fornecedor',
              fornecedor_id: toNullableValidUuid(item.fornecedorId),
              descricao: item.descricao || 'Despesa operacional',
              categoria: item.categoria || 'Despesa Operacional',
              valor_original: Number(item.valorOriginal ?? item.valor ?? 0) || 0,
              valor_pago: Number(item.valorPago ?? 0) || 0,
              data_emissao: item.dataEmissao || new Date().toISOString().split('T')[0],
              data_vencimento: item.dataVencimento || item.vencimento || new Date().toISOString().split('T')[0],
              data_pagamento: item.dataPagamento || null,
              forma_pagamento: item.formaPagamento || 'Boleto',
              status: item.status || 'Pendente',
              responsavel: item.responsavel || 'Administrador',
              updated_at: new Date().toISOString(),
            };
          });
          const dedupedPayload = deduplicateById(payload);
          if (dedupedPayload.length > 0) {
            const { error: upsertErr } = await supabase.from('contas_pagar').upsert(dedupedPayload, { onConflict: 'id' });
            if (upsertErr) {
              const safePayload = dedupedPayload.map(p => ({ ...p, fornecedor_id: null }));
              await supabase.from('contas_pagar').upsert(safePayload, { onConflict: 'id' });
            }
          }
        } else if (isContratos) {
          const payload = items.map((item: any) => {
            const validId = toValidUuid(item.id);
            item.id = validId;
            return {
              id: validId,
              numero_contrato: item.numeroContrato || item.numero || `CTR-${validId.slice(0, 4).toUpperCase()}`,
              cliente_id: toNullableValidUuid(item.clienteId),
              objeto_contrato: item.objetoContrato || item.nome || 'Prestação de Serviços',
              tipo_contrato: item.tipoContrato || 'Recorrente',
              valor_total: Number(item.valorTotal ?? item.valor ?? 0) || 0,
              data_inicio: item.dataInicio || new Date().toISOString().split('T')[0],
              data_fim: item.dataFim || null,
              status: item.status || 'Ativo',
              updated_at: new Date().toISOString(),
            };
          });
          const dedupedPayload = deduplicateById(payload);
          if (dedupedPayload.length > 0) {
            const { error: upsertErr } = await supabase.from('contratos').upsert(dedupedPayload, { onConflict: 'id' });
            if (upsertErr) {
              const safePayload = dedupedPayload.map(p => ({ ...p, cliente_id: null }));
              await supabase.from('contratos').upsert(safePayload, { onConflict: 'id' });
            }
          }
        } else if (isProjetos) {
          const payload = items.map((item: any) => {
            const validId = toValidUuid(item.id);
            item.id = validId;
            return {
              id: validId,
              codigo: item.codigo || `PRJ-${validId.slice(0, 4).toUpperCase()}`,
              nome: item.nome || item.titulo || 'Novo Projeto',
              cliente_id: toNullableValidUuid(item.clienteId),
              tipo: item.tipo || 'Desenvolvimento',
              categoria: item.categoria || 'Geral',
              prioridade: item.prioridade || 'Média',
              status: item.status || 'Planejamento',
              valor_recebido: Number(item.valorRecebido ?? item.valorContratado ?? item.valor ?? 0) || 0,
              data_inicio: item.dataInicio || new Date().toISOString().split('T')[0],
              descricao: item.descricao || item.descricaoGeral || '',
              updated_at: new Date().toISOString(),
            };
          });
          const dedupedPayload = deduplicateById(payload);
          if (dedupedPayload.length > 0) {
            const { error: upsertErr } = await supabase.from('projetos').upsert(dedupedPayload, { onConflict: 'id' });
            if (upsertErr) {
              const safePayload = dedupedPayload.map(p => ({ ...p, cliente_id: null }));
              await supabase.from('projetos').upsert(safePayload, { onConflict: 'id' });
            }
          }
        } else if (isFornecedores) {
          const payload = items.map((item: any) => {
            const validId = toValidUuid(item.id);
            item.id = validId;
            return {
              id: validId,
              razao_social: item.razaoSocial || item.nome || 'Fornecedor',
              nome_fantasia: item.nomeFantasia || item.razaoSocial || item.nome || 'Fornecedor',
              codigo: item.codigo || `FOR-${validId.slice(0, 4).toUpperCase()}`,
              cnpj: item.cnpj || item.documento || '00.000.000/0001-00',
              email: item.email || item.contatos?.[0]?.email || null,
              telefone: item.telefone || item.contatos?.[0]?.celular || null,
              categoria: item.categoria || 'Geral',
              status: item.status === 'Inativo' ? 'Inativo' : 'Ativo',
              updated_at: new Date().toISOString(),
            };
          });
          const dedupedPayload = deduplicateById(payload);
          if (dedupedPayload.length > 0) {
            await supabase.from('fornecedores').upsert(dedupedPayload, { onConflict: 'id' });
          }
        } else if (isColaboradores) {
          const payload = items.map((item: any) => {
            const validId = toValidUuid(item.id);
            item.id = validId;
            const photo = item.foto || item.fotoUrl || item.avatarUrl || item.fotoBase64 || null;
            return {
              id: validId,
              matricula: item.matricula || `FC-${validId.slice(0, 4).toUpperCase()}`,
              nome: item.nome || item.nomeCompleto || item.name || 'Colaborador',
              cargo: item.cargo || 'Especialista',
              departamento: item.departamento || 'Tecnologia',
              email: item.email || item.emailCorporativo || null,
              cpf: item.cpf || item.documento || null,
              tipo_contrato: item.tipoContrato || item.tipo_contrato || 'CLT',
              regime: item.regime || 'Híbrido',
              salario_base: item.salarioBase || item.salario || 0,
              status: item.status || 'Ativo',
              foto: photo,
              avatar_url: photo,
              data_admissao: item.dataAdmissao || item.data_admissao || new Date().toISOString().split('T')[0],
              updated_at: new Date().toISOString(),
            };
          });
          const dedupedPayload = deduplicateById(payload);
          if (dedupedPayload.length > 0) {
            try {
              await supabase.from('colaboradores').upsert(dedupedPayload, { onConflict: 'id' });
            } catch {
              const safePayload = dedupedPayload.map(p => ({
                id: p.id,
                matricula: p.matricula,
                nome: p.nome,
                email: p.email,
                cargo: p.cargo,
                departamento: p.departamento,
                status: p.status,
                updated_at: p.updated_at,
              }));
              await supabase.from('colaboradores').upsert(safePayload, { onConflict: 'id' });
            }

            // Upsert na tabela relacional colaborador_fotos
            for (const item of dedupedPayload) {
              if (item.foto) {
                try {
                  await supabase.from('colaborador_fotos').upsert({
                    colaborador_id: item.id,
                    colaborador_matricula: item.matricula,
                    colaborador_email: item.email,
                    foto_base64: item.foto,
                    updated_at: new Date().toISOString(),
                  }, { onConflict: 'colaborador_id' });
                } catch {}
              }
            }
          }
        } else if (isClientsTable) {
          const payloadClients = items.map((item: any) => {
            const validId = toValidUuid(item.id);
            item.id = validId;
            return {
              id: validId,
              name: item.nomeFantasia || item.razaoSocial || item.name || 'Novo Cliente',
              status: String(item.status || 'ativo').toLowerCase() === 'inativo' ? 'inativo' : 'ativo',
              contact_email: item.contatos?.[0]?.email || item.email || item.contact_email || null,
              contact_phone: item.contatos?.[0]?.celular || item.telefone || item.contact_phone || null,
              updated_at: new Date().toISOString(),
            };
          });
          const payloadClientes = items.map((item: any) => {
            const validId = toValidUuid(item.id);
            const end = item.endereco || {};
            return {
              id: validId,
              codigo: item.codigo || `CLI-${validId.slice(0, 4).toUpperCase()}`,
              razao_social: item.razaoSocial || item.nomeFantasia || item.name || 'Cliente',
              nome_fantasia: item.nomeFantasia || item.razaoSocial || item.name || 'Cliente',
              documento: item.documento || item.cnpj || item.cpf || '00.000.000/0001-00',
              inscricao_estadual: item.inscricaoEstadual || item.inscricao_estadual || 'Isento',
              tipo: item.tipo || 'Pessoa Jurídica',
              status: String(item.status || 'Ativo') === 'Inativo' ? 'Inativo' : 'Ativo',
              segmento: item.segmento || 'Geral',
              cep: end.cep || item.cep || null,
              logradouro: end.logradouro || item.logradouro || null,
              numero: end.numero || item.numero || null,
              bairro: end.bairro || item.bairro || null,
              cidade: end.cidade || item.cidade || null,
              estado: end.estado || item.estado || null,
              updated_at: new Date().toISOString(),
            };
          });
          const dedupedClients = deduplicateById(payloadClients);
          const dedupedClientes = deduplicateById(payloadClientes);
          if (dedupedClients.length > 0) {
            await supabase.from('clients').upsert(dedupedClients, { onConflict: 'id' });
          }
          if (dedupedClientes.length > 0) {
            await supabase.from('clientes').upsert(dedupedClientes, { onConflict: 'id' });
          }
        } else if (primaryDbTable) {
          const payload = items.map((item: any) => toSnakeCasePayload(primaryDbTable, item));
          const deduped = deduplicateById(payload);
          if (deduped.length > 0) {
            const { error: upsertErr } = await supabase.from(primaryDbTable).upsert(deduped, { onConflict: 'id' });
            if (upsertErr && primaryDbTable === 'notificacoes') {
              const minimalPayload = deduped.map((n: any) => ({
                id: n.id,
                titulo: n.titulo,
                mensagem: n.mensagem || n.descricao || '',
                tipo: n.tipo || 'info',
                lida: Boolean(n.lida),
                link_redirecionamento: n.link_redirecionamento || n.target_url || '/',
              }));
              await supabase.from('notificacoes').upsert(minimalPayload, { onConflict: 'id' });
            }
          }
        }
      } catch (err: any) {
        console.warn(`[Supabase] Erro ao sincronizar '${table}' com o banco de dados:`, err?.message);
      }
    },
    [isClientsTable, isColaboradores, isContasPagar, isContasReceber, isContratos, isFornecedores, isProjetos, isUsersTable, primaryDbTable, table]
  );

  // ---------------------------------------------------------------------------
  // Sync Data on Client Mount & Realtime Cloud Database
  // ---------------------------------------------------------------------------
  useEffect(() => {
    isMountedRef.current = true;

    // 1. Carregamento inicial imediato com dados limpos
    const localCached = readLocalCache(table, initialValue);
    if (isMountedRef.current && localCached.length > 0) {
      setData(localCached);
    }

    const fetchData = async () => {
      if (isFetchingRef.current) return;
      const now = Date.now();
      if (now - lastFetchTimeRef.current < 2000) return;
      isFetchingRef.current = true;
      lastFetchTimeRef.current = now;
      try {
        if (isUsersTable) {
          const dbUsers = await userService.getUsers();
          if (isMountedRef.current && Array.isArray(dbUsers)) {
            setData(dbUsers as unknown as T[]);
            writeLocalCache(table, dbUsers);
            setError(null);
          }
          return;
        }

        if (isContasReceber) {
          const { data: dbRows, error: dbErr } = await supabase
            .from('contas_receber')
            .select('*')
            .order('data_vencimento', { ascending: true });

          if (!isMountedRef.current) return;

          if (!dbErr && Array.isArray(dbRows)) {
            const rawDeletedIds = safeGetItem('focus_app_deleted_contas_receber_ids');
            const deletedSet = new Set<string>(rawDeletedIds ? JSON.parse(rawDeletedIds) : []);

            const mapped = dbRows
              .filter((item: any) => item && !deletedSet.has(String(item.id)) && (item.cliente_nome || item.cliente || item.descricao || Number(item.valor_original || 0) > 0))
              .map((item: any) => {
                const valorOrig = Number(item.valor_original ?? item.valorOriginal ?? 0) || 0;
                const valorRec = Number(item.valor_recebido ?? item.valorRecebido ?? 0) || 0;
                return {
                  id: String(item.id),
                  numero: item.numero || `REC-${String(item.id).slice(0, 4).toUpperCase()}`,
                  cliente: item.cliente_nome || item.cliente || 'Cliente',
                  clienteId: item.cliente_id || item.clienteId,
                  descricao: item.descricao || 'Recebimento de título',
                  categoria: item.categoria || 'Receita Operacional',
                  centroCustoNome: item.centro_custo || item.centroCustoNome || item.centroCusto || '',
                  valorOriginal: valorOrig,
                  valorRecebido: valorRec,
                  saldo: Number(item.saldo ?? (valorOrig - valorRec)) || 0,
                  dataEmissao: item.data_emissao || new Date().toISOString().split('T')[0],
                  dataVencimento: item.data_vencimento || new Date().toISOString().split('T')[0],
                  dataRecebimento: item.data_recebimento || null,
                  formaPagamento: item.forma_pagamento || 'PIX',
                  status: item.status || 'Pendente',
                  responsavel: item.responsavel || 'Administrador',
                  ultimaAtualizacao: item.updated_at || new Date().toISOString(),
                };
              }) as unknown as T[];

            localCached.forEach((lc: any) => {
              if (lc && lc.id && !mapped.some((m: any) => m.id === lc.id) && !deletedSet.has(String(lc.id))) {
                mapped.push(lc);
              }
            });

            setData(mapped);
            writeLocalCache(table, mapped);
            setError(null);
            return;
          }
        }

        if (isContasPagar) {
          const { data: dbRows, error: dbErr } = await supabase
            .from('contas_pagar')
            .select('*')
            .order('data_vencimento', { ascending: true });

          if (!isMountedRef.current) return;

          if (!dbErr && Array.isArray(dbRows)) {
            const rawDeletedIds = safeGetItem('focus_app_deleted_contas_pagar_ids');
            const deletedSet = new Set<string>(rawDeletedIds ? JSON.parse(rawDeletedIds) : []);

            const mapped = dbRows
              .filter((item: any) => item && !deletedSet.has(String(item.id)) && (item.fornecedor_nome || item.fornecedor || item.descricao || Number(item.valor_original || 0) > 0))
              .map((item: any) => {
                const valorOrig = Number(item.valor_original ?? item.valorOriginal ?? 0) || 0;
                const valorPg = Number(item.valor_pago ?? item.valorPago ?? 0) || 0;
                return {
                  id: String(item.id),
                  numero: item.numero || `PAG-${String(item.id).slice(0, 4).toUpperCase()}`,
                  fornecedor: item.fornecedor_nome || item.fornecedor || 'Fornecedor',
                  fornecedorId: item.fornecedor_id || item.fornecedorId,
                  descricao: item.descricao || 'Despesa operacional',
                  categoria: item.categoria || 'Despesa Operacional',
                  centroCustoNome: item.centro_custo || item.centroCustoNome || item.centroCusto || '',
                  valorOriginal: valorOrig,
                  valorPago: valorPg,
                  saldo: Number(item.saldo ?? (valorOrig - valorPg)) || 0,
                  dataEmissao: item.data_emissao || new Date().toISOString().split('T')[0],
                  dataVencimento: item.data_vencimento || new Date().toISOString().split('T')[0],
                  dataPagamento: item.data_pagamento || null,
                  formaPagamento: item.forma_pagamento || 'Boleto',
                  status: item.status || 'Pendente',
                  responsavel: item.responsavel || 'Administrador',
                  ultimaAtualizacao: item.updated_at || new Date().toISOString(),
                };
              }) as unknown as T[];

            localCached.forEach((lc: any) => {
              if (lc && lc.id && !mapped.some((m: any) => m.id === lc.id) && !deletedSet.has(String(lc.id))) {
                mapped.push(lc);
              }
            });

            setData(mapped);
            writeLocalCache(table, mapped);
            setError(null);
            return;
          }
        }

        if (isContratos) {
          const { data: dbRows, error: dbErr } = await supabase
            .from('contratos')
            .select('*')
            .order('created_at', { ascending: false });

          if (!isMountedRef.current) return;

          if (!dbErr && Array.isArray(dbRows)) {
            const mapped = dbRows
              .filter((item: any) => item && (item.numero_contrato || item.objeto_contrato || item.nome) && !isDmsFolderObject(item))
              .map((item: any) => ({
                id: String(item.id),
                numeroContrato: item.numero_contrato || item.numeroContrato || `CTR-${String(item.id).slice(0, 4).toUpperCase()}`,
                nome: item.objeto_contrato || item.nome || 'Contrato de Prestação de Serviços',
                clienteId: item.cliente_id || item.clienteId,
                clienteNome: item.cliente_nome || item.clienteNome || 'Cliente Focus',
                objetoContrato: item.objeto_contrato || item.objetoContrato || 'Serviços de Tecnologia',
                tipoContrato: item.tipo_contrato || item.tipoContrato || 'Recorrente',
                valorTotal: Number(item.valor_total ?? item.valorTotal ?? 0) || 0,
                valorMensalidade: Number(item.valor_mensalidade ?? item.valorMensalidade ?? 0) || 0,
                dataInicio: item.data_inicio || item.dataInicio || new Date().toISOString().split('T')[0],
                dataFim: item.data_fim || item.dataFim || null,
                status: item.status || 'Ativo',
                vigenciaIndeterminada: item.vigencia_indeterminada ?? true,
                createdAt: item.created_at || new Date().toISOString(),
              })) as unknown as T[];

            // Preservar contratos locais para evitar que uma tabela remota vazia apague o cache local
            const existingLocal = readLocalCache<any>(table, initialValue);
            const dbIds = new Set(mapped.map((it: any) => it.id));
            existingLocal.forEach((lc: any) => {
              if (lc && lc.id && !dbIds.has(String(lc.id)) && !isDmsFolderObject(lc)) {
                mapped.push(lc);
              }
            });

            setData(mapped);
            writeLocalCache(table, mapped);
            setError(null);
            return;
          }
        }

        if (isProjetos) {
          const { data: dbRows, error: dbErr } = await supabase
            .from('projetos')
            .select('*')
            .order('created_at', { ascending: false });

          if (!isMountedRef.current) return;

          if (!dbErr && Array.isArray(dbRows)) {
            const mapped = dbRows
              .filter((item: any) => item && item.nome && !isDmsFolderObject(item))
              .map((item: any) => ({
                id: String(item.id),
                codigo: item.codigo || `PRJ-${String(item.id).slice(0, 4).toUpperCase()}`,
                nome: item.nome || 'Projeto',
                clienteId: item.cliente_id || item.clienteId,
                cliente: item.cliente || 'Cliente Focus',
                tipo: item.tipo || 'Desenvolvimento',
                status: item.status || 'Planejamento',
                progresso: Number(item.progresso ?? item.progresso_estimado ?? 0) || 0,
                responsavel: item.responsavel || 'Tech Lead',
                valorContratado: Number(item.valor_contratado ?? item.valorContratado ?? 0) || 0,
                valorRecebido: Number(item.valor_recebido ?? item.valorRecebido ?? 0) || 0,
                dataInicio: item.data_inicio || item.dataInicio || new Date().toISOString().split('T')[0],
                dataPrevisaoFim: item.data_previsao_fim || item.dataPrevisaoFim || null,
                createdAt: item.created_at || new Date().toISOString(),
              })) as unknown as T[];

            setData(mapped);
            writeLocalCache(table, mapped);
            setError(null);
            return;
          }
        }

        if (isFornecedores) {
          const { data: dbRows, error: dbErr } = await supabase
            .from('fornecedores')
            .select('*')
            .order('created_at', { ascending: false });

          if (!isMountedRef.current) return;

          if (!dbErr && Array.isArray(dbRows)) {
            const localMap = new Map<string, any>();
            localCached.forEach((lc: any) => {
              if (lc && lc.id) localMap.set(String(lc.id), lc);
            });

            const mapped = dbRows
              .filter((item: any) => item && (item.razao_social || item.nome_fantasia || item.nome) && !isDmsFolderObject(item))
              .map((item: any) => {
                const existing = localMap.get(String(item.id)) || {};
                const end = item.endereco || existing.endereco || {};
                let cidade = item.cidade || end.cidade || '';
                let estado = item.estado || end.estado || '';
                const cep = item.cep || end.cep || '';
                const logradouro = item.logradouro || end.logradouro || '';
                const numero = item.numero || end.numero || '';
                const complemento = item.complemento || end.complemento || '';
                const bairro = item.bairro || end.bairro || '';
                const pais = item.pais || end.pais || 'Brasil';

                if (cidade.toLowerCase() === 'são paulo' && estado.toUpperCase() === 'SP' && !logradouro && !cep && !bairro) {
                  cidade = '';
                  estado = '';
                }

                return {
                  ...existing,
                  id: String(item.id),
                  codigo: item.codigo || existing.codigo || `FOR-${String(item.id).slice(0, 4).toUpperCase()}`,
                  razaoSocial: item.razao_social || item.razaoSocial || existing.razaoSocial || 'Fornecedor',
                  nomeFantasia: item.nome_fantasia || item.nomeFantasia || item.razao_social || existing.nomeFantasia || 'Fornecedor',
                  cnpj: item.cnpj || item.documento || existing.cnpj || '00.000.000/0001-00',
                  documento: item.cnpj || item.documento || existing.documento || '00.000.000/0001-00',
                  tipo: item.tipo || existing.tipo || 'Pessoa Jurídica',
                  categoria: item.categoria || existing.categoria || 'Geral',
                  email: item.email || existing.email || '',
                  telefone: item.telefone || existing.telefone || '',
                  status: item.status || existing.status || 'Ativo',
                  endereco: {
                    cep,
                    logradouro,
                    numero,
                    complemento,
                    bairro,
                    cidade,
                    estado,
                    pais,
                  },
                  contatos: Array.isArray(item.contatos) && item.contatos.length > 0 ? item.contatos : (existing.contatos || []),
                  dadosBancarios: Array.isArray(item.dados_bancarios) ? item.dados_bancarios : (existing.dadosBancarios || []),
                  pixChave: item.pix_chave || item.chave_pix || existing.pixChave || existing.chavePix,
                  totalContratado: Number(item.total_contratado ?? existing.totalContratado ?? 0) || 0,
                  totalPago: Number(item.total_pago ?? existing.totalPago ?? 0) || 0,
                  saldoAberto: Number(item.saldo_aberto ?? existing.saldoAberto ?? 0) || 0,
                  createdAt: item.created_at || existing.dataCadastro || new Date().toISOString(),
                  dataCadastro: item.created_at || existing.dataCadastro || new Date().toISOString(),
                  ultimaAtualizacao: item.updated_at || existing.ultimaAtualizacao || new Date().toISOString(),
                };
              }) as unknown as T[];

            localCached.forEach((lc: any) => {
              if (lc && lc.id && !mapped.some((m: any) => m.id === lc.id)) {
                mapped.push(lc);
              }
            });

            setData(mapped);
            writeLocalCache(table, mapped);
            setError(null);
            return;
          }
        }

        if (isColaboradores) {
          const { data: dbRows, error: dbErr } = await supabase
            .from('colaboradores')
            .select('*')
            .order('created_at', { ascending: false });

          if (!isMountedRef.current) return;

          if (!dbErr && Array.isArray(dbRows)) {
            const mapped = dbRows
              .filter((item: any) => item && (item.nome || item.name) && !isDmsFolderObject(item))
              .map((item: any) => {
                const photo = item.foto || item.foto_url || item.avatar_url || '';
                return {
                  id: String(item.id),
                  matricula: item.matricula || `FC-${String(item.id).slice(0, 4).toUpperCase()}`,
                  nome: item.nome || item.name || 'Colaborador',
                  nomeCompleto: item.nome || item.name || 'Colaborador',
                  cargo: item.cargo || 'Especialista',
                  departamento: item.departamento || 'Tecnologia',
                  email: item.email || '',
                  emailCorporativo: item.email || '',
                  telefone: item.telefone || '',
                  cpf: item.cpf || item.documento || '',
                  salario: Number(item.salario_base || item.salario || 0),
                  salarioBase: Number(item.salario_base || item.salario || 0),
                  status: item.status || 'Ativo',
                  foto: photo,
                  fotoUrl: photo,
                  avatarUrl: photo,
                  metodoPagamento: item.metodo_pagamento || { formaPagamento: 'PIX' },
                  dataAdmissao: item.data_admissao || item.dataAdmissao || new Date().toISOString().split('T')[0],
                  createdAt: item.created_at || new Date().toISOString(),
                };
              }) as unknown as T[];

            setData(mapped);
            writeLocalCache(table, mapped);
            setError(null);
            return;
          }
        }

        if (isClientsTable) {
          const { data: dbClientes, error: dbClientesErr } = await supabase
            .from('clientes')
            .select('*')
            .neq('status', 'deleted')
            .order('created_at', { ascending: false });

          if (!isMountedRef.current) return;

          const rawDeletedIds = safeGetItem('focus_app_deleted_client_ids');
          const deletedSet = new Set<string>(rawDeletedIds ? JSON.parse(rawDeletedIds) : []);
          const localMap = new Map<string, any>();
          localCached.forEach((lc: any) => {
            if (lc && lc.id) localMap.set(String(lc.id), lc);
          });

          if (!dbClientesErr && Array.isArray(dbClientes) && dbClientes.length > 0) {
            const mapped = dbClientes
              .filter((c: any) => {
                if (deletedSet.has(String(c.id))) return false;
                if (c.status === 'deleted' || c.status === 'deletado' || c.deleted === true) return false;
                if (c.name && typeof c.name === 'string' && c.name.startsWith('__USER_PROFILE__')) return false;
                return true;
              })
              .map((c: any) => {
                const existing = localMap.get(String(c.id)) || {};
                const end = c.endereco || existing.endereco || {};
                let cidade = c.cidade || end.cidade || '';
                let estado = c.estado || end.estado || '';
                const cep = c.cep || end.cep || '';
                const logradouro = c.logradouro || end.logradouro || '';
                const numero = c.numero || end.numero || '';
                const complemento = c.complemento || end.complemento || '';
                const bairro = c.bairro || end.bairro || '';
                const pais = c.pais || end.pais || 'Brasil';

                if (cidade.toLowerCase() === 'são paulo' && estado.toUpperCase() === 'SP' && !logradouro && !cep && !bairro) {
                  cidade = '';
                  estado = '';
                }

                return {
                  ...existing,
                  ...c,
                  id: String(c.id),
                  codigo: c.codigo || existing.codigo || `CLI-${String(c.id).slice(0, 4).toUpperCase()}`,
                  tipo: c.tipo || existing.tipo || 'Pessoa Jurídica',
                  razaoSocial: c.razao_social || c.razaoSocial || existing.razaoSocial || c.name || 'Cliente',
                  nomeFantasia: c.nome_fantasia || c.nomeFantasia || existing.nomeFantasia || c.razao_social || 'Cliente',
                  documento: c.documento || c.cnpj || c.cpf || existing.documento || '00.000.000/0001-00',
                  status: c.status === 'Inativo' ? 'Inativo' : (existing.status || 'Ativo'),
                  segmento: c.segmento || existing.segmento || 'Geral',
                  endereco: {
                    cep,
                    logradouro,
                    numero,
                    complemento,
                    bairro,
                    cidade,
                    estado,
                    pais,
                  },
                  contatos: (existing.contatos && existing.contatos.length > 0)
                    ? existing.contatos
                    : (Array.isArray(c.contatos) ? c.contatos : []),
                  recorrencias: existing.recorrencias || [],
                  dataCadastro: existing.dataCadastro || c.created_at || new Date().toISOString(),
                  ultimaAtualizacao: existing.ultimaAtualizacao || c.updated_at || new Date().toISOString(),
                };
              }) as T[];

            setData(mapped);
            writeLocalCache(table, mapped);
            setError(null);
            return;
          }

          // Fallback buscando em 'clients' caso 'clientes' ainda não possua registros
          const { data: dbClients, error: dbErr } = await supabase
            .from('clients')
            .select('*')
            .not('name', 'like', '__FOCUS_STATE__%')
            .not('name', 'like', '__FOCUS_STATE_%')
            .not('name', 'like', '__FOCUS_USERS_STATE__%')
            .neq('status', 'deleted')
            .neq('status', 'deletado')
            .order('created_at', { ascending: false });

          if (!isMountedRef.current) return;

          if (!dbErr && Array.isArray(dbClients)) {
            const mapped = dbClients
              .filter((c: any) => {
                if (deletedSet.has(String(c.id))) return false;
                if (c.status === 'deleted' || c.status === 'deletado' || c.deleted === true) return false;
                if (typeof c.name === 'string' && (c.name.startsWith('__DELETED__') || c.name.startsWith('__FOCUS_') || c.name.startsWith('__USER_PROFILE__'))) return false;
                return true;
              })
              .map((c: any) => {
                const existing = localMap.get(String(c.id)) || {};
                const end = c.endereco || existing.endereco || {};
                const cidade = c.cidade || end.cidade || '';
                const estado = c.estado || end.estado || '';
                const cep = c.cep || end.cep || '';
                const logradouro = c.logradouro || end.logradouro || '';
                const numero = c.numero || end.numero || '';
                const complemento = c.complemento || end.complemento || '';
                const bairro = c.bairro || end.bairro || '';
                const pais = c.pais || end.pais || 'Brasil';

                return {
                  ...existing,
                  ...c,
                  id: String(c.id),
                  codigo: existing.codigo || `CLI-${String(c.id).slice(0, 4).toUpperCase()}`,
                  tipo: existing.tipo || 'Pessoa Jurídica',
                  razaoSocial: existing.razaoSocial || c.name || 'Cliente sem nome',
                  nomeFantasia: existing.nomeFantasia || c.name || 'Cliente sem nome',
                  documento: existing.documento || '00.000.000/0001-00',
                  status: (c.status === 'inativo' || c.status === 'Inativo') ? 'Inativo' : 'Ativo',
                  segmento: existing.segmento || 'Geral',
                  endereco: {
                    cep,
                    logradouro,
                    numero,
                    complemento,
                    bairro,
                    cidade,
                    estado,
                    pais,
                  },
                  contatos: (existing.contatos && existing.contatos.length > 0)
                    ? existing.contatos
                    : [
                        {
                          id: `ct-${c.id}`,
                          nome: c.name || 'Contato Principal',
                          cargo: 'Responsável',
                          departamento: 'Geral',
                          celular: c.contact_phone || '(11) 99999-9999',
                          whatsapp: true,
                          email: c.contact_email || 'contato@cliente.com',
                          principal: true
                        }
                      ],
                  recorrencias: existing.recorrencias || [],
                  dataCadastro: existing.dataCadastro || c.created_at || new Date().toISOString(),
                  ultimaAtualizacao: existing.ultimaAtualizacao || c.updated_at || new Date().toISOString(),
                };
              }) as T[];

            setData(mapped);
            writeLocalCache(table, mapped);
            setError(null);
            return;
          }
        }

        if (primaryDbTable && !isContasReceber && !isContasPagar && !isContratos && !isProjetos && !isFornecedores && !isColaboradores && !isClientsTable && !isUsersTable) {
          const { data: dbRows, error: dbErr } = await supabase
            .from(primaryDbTable)
            .select('*')
            .order('created_at', { ascending: false });

          if (!isMountedRef.current) return;

          if (!dbErr && Array.isArray(dbRows) && dbRows.length > 0) {
            const mapped = dbRows.map((r: any) => fromSnakeCaseRow(primaryDbTable, r)) as unknown as T[];
            localCached.forEach((lc: any) => {
              if (lc && lc.id && !mapped.some((m: any) => m.id === lc.id)) {
                mapped.push(lc);
              }
            });
            setData(mapped);
            writeLocalCache(table, mapped);
            setError(null);
            return;
          }
        }
      } catch (err: any) {
        if (!isMountedRef.current) return;
        setError(err?.message || 'Unknown fetch error');
      } finally {
        isFetchingRef.current = false;
        if (isMountedRef.current) setLoading(false);
      }
    };

    if (typeof window !== 'undefined') {
      fetchData();
    }

    const handleStorageUpdate = (e: StorageEvent) => {
      const candidateKeys = getCandidateKeysForTable(table);
      if (candidateKeys.includes(e.key || '') || e.key === `focus_app_${table}` || e.key === table || e.key === `focus_${table}`) {
        const updated = readLocalCache(table, initialValue);
        if (isMountedRef.current) setData(updated);
      }
    };

    let unsubscribeUsers: (() => void) | null = null;
    if (isUsersTable) {
      unsubscribeUsers = userService.subscribeUsers((freshUsers) => {
        if (isMountedRef.current && Array.isArray(freshUsers)) {
          setData(freshUsers as unknown as T[]);
        }
      });
    }

    // Supabase Realtime Subscription para Desktop & Mobile na tabela específica
    let channels: any[] = [];
    if (typeof window !== 'undefined') {
      try {
        if (primaryDbTable) {
          const relChannel = supabase
            .channel(`rt_${primaryDbTable}_${Math.random().toString(36).slice(2, 7)}`)
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: primaryDbTable },
              () => {
                if (isMountedRef.current) fetchData();
              }
            )
            .subscribe();
          channels.push(relChannel);
        }
      } catch (e) {
        console.warn('[useLocalStorageState] Realtime subscribe notice:', e);
      }
    }

    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        const updated = readLocalCache(table, initialValue);
        if (isMountedRef.current) setData(updated);
      }
    };

    const handleFocusStorageUpdate = () => {
      const updated = readLocalCache(table, initialValue);
      if (isMountedRef.current) setData(updated);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageUpdate);
      window.addEventListener('focus', handleVisibilityOrFocus);
      window.addEventListener('focus_storage_update', handleFocusStorageUpdate);
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', handleVisibilityOrFocus);
      }
    }

    return () => {
      isMountedRef.current = false;
      if (unsubscribeUsers) unsubscribeUsers();
      channels.forEach((ch) => {
        try { supabase.removeChannel(ch); } catch {}
      });
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageUpdate);
        window.removeEventListener('focus', handleVisibilityOrFocus);
        window.removeEventListener('focus_storage_update', handleFocusStorageUpdate);
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  // ---------------------------------------------------------------------------
  // CRUD helpers com atualizações atômicas e persistência garantida no PostgreSQL
  // ---------------------------------------------------------------------------
  const save = useCallback(
    async (newData: T[]) => {
      const cleanedData = newData.map((item) => {
        if (!item.id || typeof item.id !== 'string') {
          return { ...item, id: crypto.randomUUID() };
        }
        return item;
      });

      setData(cleanedData);
      writeLocalCache(table, cleanedData);

      if (typeof window !== 'undefined') {
        try {
          window.dispatchEvent(new Event('focus_storage_update'));
        } catch {}
      }

      await syncToCloud(cleanedData);
    },
    [syncToCloud, table]
  );

  const addItem = useCallback(
    async (item: T) => {
      const itemWithUuid = {
        ...item,
        id: item.id ? item.id : crypto.randomUUID(),
      };
      setData((prev) => {
        const current = Array.isArray(prev) ? prev : [];
        const updated = [itemWithUuid, ...current.filter((i) => i.id !== itemWithUuid.id)];
        writeLocalCache(table, updated);
        syncToCloud(updated);
        return updated;
      });
    },
    [syncToCloud, table]
  );

  const updateItem = useCallback(
    async (id: string, patch: Partial<T>) => {
      setData((prev) => {
        const current = Array.isArray(prev) ? prev : [];
        const updated = current.map((it) => {
          const matchesId = it.id === id;
          const matchesEmail = isUsersTable && 
            Boolean((it as any).email && (patch as any).email && 
            String((it as any).email).toLowerCase().trim() === String((patch as any).email).toLowerCase().trim());

          if (matchesId || matchesEmail) {
            return { ...it, ...patch };
          }
          return it;
        });
        writeLocalCache(table, updated);
        syncToCloud(updated);
        return updated;
      });
    },
    [isUsersTable, syncToCloud, table]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      setData((prev) => {
        const current = Array.isArray(prev) ? prev : [];
        const updated = current.filter((it) => it.id !== id);
        writeLocalCache(table, updated);
        return updated;
      });

      if (isUsersTable) {
        try {
          await userService.deleteUser(id);
        } catch {}
      }

      if (primaryDbTable) {
        try {
          await supabase.from(primaryDbTable).delete().eq('id', id);
        } catch (err) {
          console.warn(`[useDataStore] Erro ao deletar no Supabase (${primaryDbTable}):`, err);
        }
      }
      if (isClientsTable) {
        try { await supabase.from('clients').delete().eq('id', id); } catch {}
        try { await supabase.from('clientes').delete().eq('id', id); } catch {}
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('focus_storage_update'));
      }
    },
    [isClientsTable, isUsersTable, primaryDbTable, table]
  );

  const saveItem = useCallback(
    async (item: T) => {
      const itemWithUuid = {
        ...item,
        id: item.id ? item.id : crypto.randomUUID(),
      };
      setData((prev) => {
        const current = Array.isArray(prev) ? prev : [];
        const exists = current.some((it) => it.id === itemWithUuid.id);
        const updated = exists
          ? current.map((it) => (it.id === itemWithUuid.id ? { ...it, ...itemWithUuid } : it))
          : [itemWithUuid, ...current];
        writeLocalCache(table, updated);
        syncToCloud(updated);
        return updated;
      });
    },
    [syncToCloud, table]
  );

  const removeItem = deleteItem;
  const setAllItems = save;

  return {
    data,
    loading,
    error,
    addItem,
    updateItem,
    saveItem,
    deleteItem,
    removeItem,
    save,
    setAllItems,
  };
}
