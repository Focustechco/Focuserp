import { useLocalStorageState } from '@/hooks/useDataStore';
import { DEFAULT_PRODUCTS } from './defaultProducts';
import {
  ProdutoFocus,
  RoadmapItem,
  FuncionalidadeModulo,
  ReleaseVersao,
  ImplementacaoProduto,
  IntegracaoEcosistema,
  LinkUtil,
  MembroEquipeProduto,
} from './types';
import { Cliente } from '../clientes/types';
import { CsCustomer } from '../customerSuccess/types';

export interface ContratoItem {
  id: string;
  clienteId?: string;
  clienteNome?: string;
  produtoNome?: string;
  valorTotal?: number;
  valorMensal?: number;
  status?: string;
}

import { dmsService } from '@/services/dmsService';

export function useProdutos() {
  const {
    data: rawProdutos,
    addItem: addProduto,
    updateItem: updateProduto,
    deleteItem: deleteProduto,
    save: saveProdutos,
  } = useLocalStorageState<ProdutoFocus>('focus_produtos', []);

  // Garantir remoção definitiva de IDs mockados antigos e itens de teste
  const mockIds = ['prod-erp', 'prod-crm', 'prod-pay', 'prod-bi'];
  const produtos = rawProdutos.filter(
    (p) => !mockIds.includes(p.id) && p.nome && p.nome.trim() !== '' && p.nome !== 'teste'
  );

  const excluirProduto = (id: string) => {
    deleteProduto(id);
  };

  // Consumir coleções de outros módulos para integrações nativas em tempo real
  const { data: clientes } = useLocalStorageState<Cliente>('focus_clientes', []);
  const { data: csCustomers } = useLocalStorageState<CsCustomer>('focus_cs_customers', []);
  const { data: contratos } = useLocalStorageState<ContratoItem>('focus_contratos', []);

  // Adicionar Novo Produto no Catálogo
  const criarNovoProduto = (p: Omit<ProdutoFocus, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `prod-${Date.now()}`;
    const novo: ProdutoFocus = {
      ...p,
      id,
      codigo: p.codigo || `FOCUS-${p.nome.toUpperCase().replace(/\s+/g, '-')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addProduto(novo);
    
    // Criar pasta automática no DMS
    dmsService.ensureProductFolder({ id, nome: novo.nome });

    return id;
  };

  // Funções Auxiliares para o Workspace do Produto

  // Roadmap
  const addRoadmapItem = (produtoId: string, item: Omit<RoadmapItem, 'id'>) => {
    const target = produtos.find((p) => p.id === produtoId);
    if (!target) return;

    const newItem: RoadmapItem = { ...item, id: `rm-${Date.now()}` };
    const updatedRoadmap = [newItem, ...(target.roadmap || [])];
    updateProduto(produtoId, { roadmap: updatedRoadmap, updatedAt: new Date().toISOString() });
  };

  const updateRoadmapItemStatus = (produtoId: string, itemId: string, newStatus: RoadmapItem['status']) => {
    const target = produtos.find((p) => p.id === produtoId);
    if (!target) return;

    const updatedRoadmap = (target.roadmap || []).map((rm) =>
      rm.id === itemId ? { ...rm, status: newStatus } : rm
    );
    updateProduto(produtoId, { roadmap: updatedRoadmap, updatedAt: new Date().toISOString() });
  };

  // Funcionalidades / Módulos
  const addFuncionalidade = (produtoId: string, func: Omit<FuncionalidadeModulo, 'id'>) => {
    const target = produtos.find((p) => p.id === produtoId);
    if (!target) return;

    const newFunc: FuncionalidadeModulo = { ...func, id: `fn-${Date.now()}` };
    const updatedFuncs = [...(target.funcionalidades || []), newFunc];
    updateProduto(produtoId, { funcionalidades: updatedFuncs, updatedAt: new Date().toISOString() });
  };

  // Releases / Versões
  const addRelease = (produtoId: string, release: Omit<ReleaseVersao, 'id'>) => {
    const target = produtos.find((p) => p.id === produtoId);
    if (!target) return;

    const newRel: ReleaseVersao = { ...release, id: `rel-${Date.now()}` };
    const updatedReleases = [newRel, ...(target.releases || [])];
    updateProduto(produtoId, {
      releases: updatedReleases,
      versaoAtual: release.versao,
      updatedAt: new Date().toISOString(),
    });
  };

  // Links Úteis
  const addLinkUtil = (produtoId: string, link: Omit<LinkUtil, 'id'>) => {
    const target = produtos.find((p) => p.id === produtoId);
    if (!target) return;

    const newLink: LinkUtil = { ...link, id: `lk-${Date.now()}` };
    const updatedLinks = [...(target.linksUteis || []), newLink];
    updateProduto(produtoId, { linksUteis: updatedLinks, updatedAt: new Date().toISOString() });
  };

  // Integrações de Ecossistema
  const addIntegracao = (produtoId: string, integracao: Omit<IntegracaoEcosistema, 'id'>) => {
    const target = produtos.find((p) => p.id === produtoId);
    if (!target) return;

    const newInt: IntegracaoEcosistema = { ...integracao, id: `int-${Date.now()}` };
    const updatedInts = [...(target.integracoes || []), newInt];
    updateProduto(produtoId, { integracoes: updatedInts, updatedAt: new Date().toISOString() });
  };

  // Equipe
  const addMembroEquipe = (produtoId: string, membro: Omit<MembroEquipeProduto, 'id'>) => {
    const target = produtos.find((p) => p.id === produtoId);
    if (!target) return;

    const newMembro: MembroEquipeProduto = { ...membro, id: `eq-${Date.now()}` };
    const updatedTeam = [...(target.equipe || []), newMembro];
    updateProduto(produtoId, { equipe: updatedTeam, updatedAt: new Date().toISOString() });
  };

  // Cálculo de Métricas Consolidadas do Produto (Reativo aos módulos de Clientes, Contratos e CS)
  const getMetricasProduto = (produto: ProdutoFocus) => {
    // Clientes Vinculados (todos os clientes cadastrados ou filtrados por nome do produto em contratos)
    const clientesDoProduto = clientes;
    const qtdClientesAtivos = clientesDoProduto.length;

    // Financeiro (MRR / ARR)
    const mrrTotal = contratos.reduce((acc, c) => acc + (c.valorMensal || 0), 0);
    const arrTotal = mrrTotal * 12;
    const ticketMedio = qtdClientesAtivos > 0 ? mrrTotal / qtdClientesAtivos : 0;

    // Customer Success
    const npsScores = csCustomers.map((c) => c.npsLatestScore).filter((s) => typeof s === 'number');
    const npsMedio = npsScores.length > 0 ? npsScores.reduce((a, b) => a + b, 0) / npsScores.length : 10;

    const healthScores = csCustomers.map((c) => c.healthScore).filter((s) => typeof s === 'number');
    const healthScoreMedio = healthScores.length > 0 ? healthScores.reduce((a, b) => a + b, 0) / healthScores.length : 95;

    return {
      qtdClientesAtivos,
      mrrTotal,
      arrTotal,
      ticketMedio,
      npsMedio,
      healthScoreMedio,
      implementacoesConcluidas: (produto.implementacoes || []).filter((i) => i.status === 'Concluído').length,
      implementacoesEmAndamento: (produto.implementacoes || []).filter((i) => i.status === 'Em Andamento').length,
    };
  };

  return {
    produtos,
    clientes,
    csCustomers,
    contratos,
    criarNovoProduto,
    updateProduto,
    deleteProduto,
    excluirProduto: deleteProduto,
    addRoadmapItem,
    updateRoadmapItemStatus,
    addFuncionalidade,
    addRelease,
    addLinkUtil,
    addIntegracao,
    addMembroEquipe,
    getMetricasProduto,
  };
}
