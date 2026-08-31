import { useLocalStorageState } from '@/hooks/useDataStore';
import {
  Equipamento,
  EstoqueItem,
  Licenca,
  Patrimonio,
  Movimentacao,
  Inventario,
  Manutencao,
  EquipamentoTimelineEvent,
} from '../types';
import { ContaPagar } from '@/features/contas-pagar/types';
import { TituloReceber } from '@/features/contas-receber/types';
import { contaPagarService } from '@/services/contaPagarService';
import { contaReceberService } from '@/services/contaReceberService';

const INITIAL_EQUIPAMENTOS: Equipamento[] = [];
const INITIAL_ESTOQUE_ITENS: EstoqueItem[] = [];
const INITIAL_LICENCAS: Licenca[] = [];
const INITIAL_PATRIMONIOS: Patrimonio[] = [];
const INITIAL_MOVIMENTACOES: Movimentacao[] = [];
const INITIAL_INVENTARIOS: Inventario[] = [];
const INITIAL_MANUTENCOES: Manutencao[] = [];

export function useEstoquePatrimonio() {
  const {
    data: equipamentos,
    addItem: addEquipamento,
    updateItem: updateEquipamento,
    deleteItem: deleteEquipamento,
  } = useLocalStorageState<Equipamento>('focus_itam_equipamentos', INITIAL_EQUIPAMENTOS);

  const {
    data: estoqueItensRaw,
    addItem: addEstoqueItem,
    updateItem: updateEstoqueItem,
    deleteItem: deleteEstoqueItem,
  } = useLocalStorageState<EstoqueItem>('focus_itam_estoque_itens', INITIAL_ESTOQUE_ITENS);

  // Higienizar itens para evitar itens fantasmas ou NaN
  const estoqueItens = (Array.isArray(estoqueItensRaw) ? estoqueItensRaw : [])
    .filter(item => item && (item.nome || item.codigo))
    .map(item => ({
      ...item,
      quantidade: Number(item.quantidade) || 0,
      quantidadeMinima: Number(item.quantidadeMinima) || 0,
      valorUnitario: Number(item.valorUnitario) || 0,
    }));

  const {
    data: licencas,
    addItem: addLicenca,
    updateItem: updateLicenca,
    deleteItem: deleteLicenca,
  } = useLocalStorageState<Licenca>('focus_itam_licencas', INITIAL_LICENCAS);

  const {
    data: patrimonios,
    addItem: addPatrimonio,
    updateItem: updatePatrimonio,
    deleteItem: deletePatrimonio,
  } = useLocalStorageState<Patrimonio>('focus_itam_patrimonios', INITIAL_PATRIMONIOS);

  const {
    data: movimentacoes,
    addItem: addMovimentacao,
  } = useLocalStorageState<Movimentacao>('focus_itam_movimentacoes', INITIAL_MOVIMENTACOES);

  const {
    data: inventarios,
    addItem: addInventario,
    updateItem: updateInventario,
    deleteItem: deleteInventario,
  } = useLocalStorageState<Inventario>('focus_itam_inventarios', INITIAL_INVENTARIOS);

  const {
    data: manutencoes,
    addItem: addManutencao,
    updateItem: updateManutencao,
    deleteItem: deleteManutencao,
  } = useLocalStorageState<Manutencao>('focus_itam_manutencoes', INITIAL_MANUTENCOES);

  // Integração com Contas a Pagar e Contas a Receber
  const { addItem: addContaPagar } = useLocalStorageState<ContaPagar>('focus_contas_pagar', []);
  const { addItem: addContaReceber } = useLocalStorageState<TituloReceber>('focus_contas_receber', []);

  // Helper para gerar Conta a Pagar com persistência garantida em todos os armazenamentos
  const lancarContaPagar = (params: {
    fornecedor?: string;
    descricao: string;
    valor: number;
    vencimento?: string;
    categoria?: string;
    centroCustoNome?: string;
    centroCustoId?: string;
    formaPagamento?: any;
    observacoes?: string;
  }) => {
    const id = crypto.randomUUID();
    const numero = `PAG-${Math.floor(1000 + Math.random() * 9000)}`;
    const novaConta: ContaPagar = {
      id,
      numero,
      fornecedor: params.fornecedor || 'Fornecedor de TI / Almoxarifado',
      descricao: params.descricao,
      categoria: params.categoria || 'Licenças de Software & SaaS',
      centroCustoNome: params.centroCustoNome || 'Tecnologia da Informação',
      centroCustoId: params.centroCustoId,
      valorOriginal: params.valor,
      valorPago: 0,
      saldo: params.valor,
      valorFinal: params.valor,
      dataEmissao: new Date().toISOString().split('T')[0],
      dataVencimento: params.vencimento || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      formaPagamento: params.formaPagamento || 'Boleto',
      status: 'Pendente',
      responsavel: 'Módulo Estoque & Patrimônio',
      ultimaAtualizacao: new Date().toISOString(),
      observacoes: params.observacoes || 'Lançamento financeiro gerado automaticamente pelo módulo de Estoque & Patrimônio.',
      historico: [
        {
          id: 'h-' + Date.now(),
          data: new Date().toISOString(),
          usuario: 'Módulo Estoque & Patrimônio',
          acao: 'Criação',
          observacao: `Gerado a partir de operação no estoque/licenças: ${params.descricao}`
        }
      ]
    };

    // 1. Adicionar no hook local
    addContaPagar(novaConta);

    // 2. Gravar em todas as chaves de cache local para leitura imediata em qualquer aba
    if (typeof window !== 'undefined') {
      ['focus_app_focus_contas_pagar', 'focus_contas_pagar', 'focus_app_contas_pagar'].forEach((key) => {
        try {
          const raw = window.localStorage.getItem(key);
          const currentList = raw ? JSON.parse(raw) : [];
          if (Array.isArray(currentList)) {
            const filtered = currentList.filter((item: any) => item.id !== id);
            window.localStorage.setItem(key, JSON.stringify([novaConta, ...filtered]));
          }
        } catch {}
      });
      try {
        window.dispatchEvent(new Event('focus_storage_update'));
        window.dispatchEvent(new Event('storage'));
      } catch {}
    }

    // 3. Persistir no Supabase
    contaPagarService.saveContaPagar(novaConta as any).catch((err) => {
      console.warn('[useEstoquePatrimonio] Erro ao sincronizar conta a pagar com o banco:', err);
    });

    return novaConta;
  };

  // Helper para gerar Conta a Receber com persistência garantida em todos os armazenamentos
  const lancarContaReceber = (params: {
    cliente?: string;
    clienteId?: string;
    descricao: string;
    valor: number;
    vencimento?: string;
    categoria?: string;
    centroCustoNome?: string;
    centroCustoId?: string;
    formaPagamento?: any;
    observacoes?: string;
  }) => {
    const id = crypto.randomUUID();
    const numero = `REC-${Math.floor(1000 + Math.random() * 9000)}`;
    const novoTitulo: TituloReceber = {
      id,
      numero,
      cliente: params.cliente || 'Cliente Corporativo',
      clienteId: params.clienteId,
      descricao: params.descricao,
      categoria: params.categoria || 'Venda de Materiais & Insumos',
      centroCustoNome: params.centroCustoNome || 'Almoxarifado & Vendas',
      centroCustoId: params.centroCustoId,
      valorOriginal: params.valor,
      valorRecebido: 0,
      saldo: params.valor,
      valorLiquido: params.valor,
      dataEmissao: new Date().toISOString().split('T')[0],
      dataVencimento: params.vencimento || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      formaPagamento: params.formaPagamento || 'PIX',
      status: 'Pendente',
      responsavel: 'Módulo Estoque & Patrimônio',
      ultimaAtualizacao: new Date().toISOString(),
      observacoes: params.observacoes || 'Lançamento financeiro gerado automaticamente pelo módulo de Estoque & Patrimônio.',
      historico: [
        {
          id: 'h-' + Date.now(),
          data: new Date().toISOString(),
          usuario: 'Módulo Estoque & Patrimônio',
          acao: 'Criação',
          observacao: `Gerado a partir de saída de estoque/faturamento: ${params.descricao}`
        }
      ]
    };

    // 1. Adicionar no hook local
    addContaReceber(novoTitulo);

    // 2. Gravar em todas as chaves de cache local
    if (typeof window !== 'undefined') {
      ['focus_app_focus_contas_receber', 'focus_contas_receber', 'focus_app_contas_receber'].forEach((key) => {
        try {
          const raw = window.localStorage.getItem(key);
          const currentList = raw ? JSON.parse(raw) : [];
          if (Array.isArray(currentList)) {
            const filtered = currentList.filter((item: any) => item.id !== id);
            window.localStorage.setItem(key, JSON.stringify([novoTitulo, ...filtered]));
          }
        } catch {}
      });
      try {
        window.dispatchEvent(new Event('focus_storage_update'));
        window.dispatchEvent(new Event('storage'));
      } catch {}
    }

    // 3. Persistir no Supabase
    contaReceberService.saveContaReceber(novoTitulo as any).catch((err) => {
      console.warn('[useEstoquePatrimonio] Erro ao sincronizar conta a receber com o banco:', err);
    });

    return novoTitulo;
  };

  // Operação: Novo Equipamento
  const registrarNovoEquipamento = (eq: Omit<Equipamento, 'id' | 'createdAt'>, gerarDespesa: boolean = false, vencimentoDespesa?: string) => {
    const id = 'eq-' + Date.now();
    const newEq: Equipamento = {
      ...eq,
      id,
      createdAt: new Date().toISOString(),
      timeline: [
        {
          id: 'tm-' + Date.now(),
          dataHora: new Date().toLocaleString('pt-BR'),
          tipo: 'Aquisição',
          descricao: `Equipamento cadastrado com valor de R$ ${(eq.valorCompra || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          responsavel: eq.colaboradorNome || 'Estoque TI Central',
          usuarioRegistro: 'Administrador',
        },
      ],
    };
    addEquipamento(newEq);

    // Também cadastra no Patrimônio
    const newPatrimonio: Patrimonio = {
      id: 'pat-' + Date.now(),
      numeroPatrimonial: eq.codigoPatrimonial,
      codigoInterno: 'AST-' + id.substring(3),
      categoria: eq.categoria,
      valorCompra: eq.valorCompra,
      valorAtual: eq.valorCompra * 0.9, // depreciação inicial estimada
      vidaUtilAnos: eq.categoria === 'Notebook' || eq.categoria === 'Desktop' ? 4 : 5,
      depreciacaoAcumulada: eq.valorCompra * 0.1,
      estadoConservacao: 'Bom',
      situacao: 'Ativo',
      centroCustoNome: eq.departamento || 'TI Central',
    };
    addPatrimonio(newPatrimonio);

    // Log de Movimentação
    addMovimentacao({
      id: 'mov-' + Date.now(),
      tipo: 'Entrada',
      equipamentoId: id,
      equipamentoNome: `${eq.marca} ${eq.modelo} (${eq.codigoPatrimonial})`,
      usuarioId: 'usr-admin',
      usuarioNome: 'Administrador',
      dataHora: new Date().toLocaleString('pt-BR'),
      origem: 'Aquisição Externa',
      destino: eq.localFisica || 'Estoque Central',
      responsavelNome: eq.colaboradorNome || 'TI Central',
      observacoes: 'Cadastrado no módulo ITAM.',
    });

    if (gerarDespesa && eq.valorCompra > 0) {
      lancarContaPagar({
        fornecedor: eq.marca ? `Fornecedor ${eq.marca}` : 'Fornecedor TI',
        descricao: `Aquisição de Ativo TI: ${eq.marca} ${eq.modelo} (${eq.codigoPatrimonial})`,
        valor: eq.valorCompra,
        vencimento: vencimentoDespesa,
        categoria: 'Investimento em Ativos / TI',
        centroCustoNome: eq.departamento || 'TI / Tecnologia',
      });
    }
  };

  // Operação: Alteração de Responsável / Transferência de Equipamento
  const transferirEquipamento = (
    equipamentoId: string,
    novoResponsavel: string,
    novoDepartamento: string,
    novaLocalizacao: string,
    observacao: string
  ) => {
    const target = equipamentos.find((e) => e.id === equipamentoId);
    if (!target) return;

    const origemLocal = target.localFisica;
    const origemResp = target.colaboradorNome || 'Disponível em Estoque';

    const timelineEvent: EquipamentoTimelineEvent = {
      id: 'tm-' + Date.now(),
      dataHora: new Date().toLocaleString('pt-BR'),
      tipo: 'Mudança Responsável',
      descricao: `Transferência de responsável para ${novoResponsavel} (${novoDepartamento}). Obs: ${observacao}`,
      responsavel: novoResponsavel,
      origem: origemLocal,
      destino: novaLocalizacao,
      usuarioRegistro: 'Administrador',
    };

    updateEquipamento(equipamentoId, {
      colaboradorNome: novoResponsavel,
      departamento: novoDepartamento,
      localFisica: novaLocalizacao,
      situacao: novoResponsavel ? 'Em Uso' : 'Disponível',
      timeline: [timelineEvent, ...(target.timeline || [])],
    });

    addMovimentacao({
      id: 'mov-' + Date.now(),
      tipo: 'Transferência',
      equipamentoId,
      equipamentoNome: `${target.marca} ${target.modelo} (${target.codigoPatrimonial})`,
      usuarioId: 'usr-admin',
      usuarioNome: 'Administrador',
      dataHora: new Date().toLocaleString('pt-BR'),
      origem: `${origemResp} - ${origemLocal}`,
      destino: `${novoResponsavel} - ${novaLocalizacao}`,
      responsavelNome: novoResponsavel,
      observacoes: observacao,
    });
  };

  // Operação Completa: Entrada / Saída de Estoque Físico COM Integração Financeira
  const ajustarEstoqueItemComFinanceiro = (params: {
    itemId: string;
    quantidadeMudanca: number;
    tipoOperacao: 'Entrada' | 'Saída' | 'Ajuste';
    motivo: string;
    gerarFinanceiro: boolean;
    valorTotal: number;
    entidadeNome?: string; // Fornecedor (Entrada) ou Cliente (Saída)
    vencimento?: string;
    formaPagamento?: any;
  }) => {
    const item = estoqueItens.find((i) => i.id === params.itemId);
    if (!item) return;

    let novaQtd = item.quantidade;
    if (params.tipoOperacao === 'Entrada') novaQtd += params.quantidadeMudanca;
    else if (params.tipoOperacao === 'Saída') novaQtd = Math.max(0, novaQtd - params.quantidadeMudanca);
    else novaQtd = params.quantidadeMudanca;

    updateEstoqueItem(params.itemId, {
      quantidade: novaQtd,
      status: novaQtd === 0 ? 'Reservado' : 'Disponível',
    });

    // Lançamento Financeiro
    if (params.gerarFinanceiro && params.valorTotal > 0) {
      if (params.tipoOperacao === 'Entrada') {
        lancarContaPagar({
          fornecedor: params.entidadeNome || 'Fornecedor de Almoxarifado',
          descricao: `Compra/Entrada de Estoque: ${params.quantidadeMudanca}x ${item.nome} (${item.codigo})`,
          valor: params.valorTotal,
          vencimento: params.vencimento,
          categoria: 'Estoque & Insumos Almoxarifado',
          centroCustoNome: 'Almoxarifado TI',
          formaPagamento: params.formaPagamento || 'Boleto',
          observacoes: `Motivo: ${params.motivo}`,
        });
      } else if (params.tipoOperacao === 'Saída') {
        lancarContaReceber({
          cliente: params.entidadeNome || 'Cliente Faturado',
          descricao: `Venda/Faturamento de Estoque: ${params.quantidadeMudanca}x ${item.nome} (${item.codigo})`,
          valor: params.valorTotal,
          vencimento: params.vencimento,
          categoria: 'Venda de Materiais & Insumos',
          centroCustoNome: 'Almoxarifado & Vendas',
          formaPagamento: params.formaPagamento || 'PIX',
          observacoes: `Motivo: ${params.motivo}`,
        });
      }
    }

    // Registro na Timeline de Movimentações
    addMovimentacao({
      id: 'mov-' + Date.now(),
      tipo: params.tipoOperacao === 'Entrada' ? 'Entrada' : params.tipoOperacao === 'Saída' ? 'Saída' : 'Transferência',
      estoqueItemId: params.itemId,
      estoqueItemNome: item.nome,
      usuarioId: 'usr-admin',
      usuarioNome: 'Administrador',
      dataHora: new Date().toLocaleString('pt-BR'),
      origem: item.localizacao,
      destino: params.motivo,
      observacoes: `${params.tipoOperacao} de ${params.quantidadeMudanca} unidade(s). Nova Qtd: ${novaQtd}. Motivo: ${params.motivo}${
        params.gerarFinanceiro ? ` • Gerado lançamento financeiro de R$ ${params.valorTotal.toFixed(2)}` : ''
      }`,
    });
  };

  // Operação: Abertura de Manutenção COM Integração Financeira
  const abrirManutencaoComFinanceiro = (params: {
    equipamentoId: string;
    tipo: 'Preventiva' | 'Corretiva' | 'Upgrade' | 'Troca';
    descricao: string;
    valor: number;
    responsavel: string;
    prestador?: string;
    gerarContaPagar?: boolean;
    gerarContaReceber?: boolean;
    clienteNome?: string;
    vencimento?: string;
  }) => {
    const eq = equipamentos.find((e) => e.id === params.equipamentoId);
    const eqNome = eq ? `${eq.marca} ${eq.modelo}` : 'Equipamento';
    const eqCod = eq ? eq.codigoPatrimonial : '';

    const newManut: Manutencao = {
      id: 'manut-' + Date.now(),
      equipamentoId: params.equipamentoId,
      equipamentoCodigo: eqCod,
      equipamentoNome: eqNome,
      tipo: params.tipo,
      data: new Date().toISOString().split('T')[0],
      descricao: params.descricao,
      valor: params.valor,
      responsavelId: 'tech-01',
      responsavelNome: params.responsavel,
      status: 'Em Execução',
    };

    addManutencao(newManut);

    if (eq) {
      updateEquipamento(params.equipamentoId, {
        situacao: 'Manutenção',
        timeline: [
          {
            id: 'tm-' + Date.now(),
            dataHora: new Date().toLocaleString('pt-BR'),
            tipo: 'Manutenção',
            descricao: `Ordem de manutenção [${params.tipo}] aberta. Descrição: ${params.descricao}`,
            responsavel: params.responsavel,
            usuarioRegistro: 'Administrador',
          },
          ...(eq.timeline || []),
        ],
      });
    }

    // Gera Conta a Pagar para o Prestador/Assistência se solicitado
    if (params.gerarContaPagar && params.valor > 0) {
      lancarContaPagar({
        fornecedor: params.prestador || params.responsavel || 'Assistência Técnica Especializada',
        descricao: `Serviço de Manutenção [${params.tipo}]: ${eqNome} (${eqCod})`,
        valor: params.valor,
        vencimento: params.vencimento,
        categoria: 'Manutenção de Equipamentos & TI',
        centroCustoNome: 'Manutenção TI',
      });
    }

    // Gera Conta a Receber se repassado/faturado para Cliente
    if (params.gerarContaReceber && params.valor > 0 && params.clienteNome) {
      lancarContaReceber({
        cliente: params.clienteNome,
        descricao: `Faturamento de Manutenção [${params.tipo}]: ${eqNome} (${eqCod})`,
        valor: params.valor,
        vencimento: params.vencimento,
        categoria: 'Serviços de Manutenção & Suporte',
        centroCustoNome: 'Operações & Serviços',
      });
    }

    addMovimentacao({
      id: 'mov-' + Date.now(),
      tipo: 'Manutenção',
      equipamentoId: params.equipamentoId,
      equipamentoNome: `${eqNome} (${eqCod})`,
      usuarioId: 'usr-admin',
      usuarioNome: 'Administrador',
      dataHora: new Date().toLocaleString('pt-BR'),
      destino: `Assistência / Tech: ${params.responsavel}`,
      observacoes: `Manutenção ${params.tipo}. Custo: R$ ${params.valor}${
        params.gerarContaPagar ? ' • Conta a Pagar gerada' : ''
      }${params.gerarContaReceber ? ' • Conta a Receber gerada' : ''}`,
    });
  };

  // Operação: Cadastro de Licença COM Integração Financeira
  const criarLicencaComFinanceiro = (params: {
    licenca: Omit<Licenca, 'id'>;
    gerarContaPagar?: boolean;
    gerarContaReceber?: boolean;
    clienteNome?: string;
    vencimentoFinanceiro?: string;
  }) => {
    const id = 'lic-' + Date.now();
    const novaLicenca: Licenca = {
      ...params.licenca,
      id,
    };
    addLicenca(novaLicenca);

    // Despesa em Contas a Pagar
    if (params.gerarContaPagar && params.licenca.valor > 0) {
      lancarContaPagar({
        fornecedor: params.licenca.fabricante || 'Fornecedor de Software / SaaS',
        descricao: `Assinatura de Software/Licença: ${params.licenca.nome} (${params.licenca.plano})`,
        valor: params.licenca.valor,
        vencimento: params.vencimentoFinanceiro || params.licenca.vencimento,
        categoria: 'Licenças de Software & SaaS',
        centroCustoNome: params.licenca.centroCustoNome || 'TI / Infraestrutura',
      });
    }

    // Faturamento em Contas a Receber (se repassado a cliente)
    if (params.gerarContaReceber && params.licenca.valor > 0 && params.clienteNome) {
      lancarContaReceber({
        cliente: params.clienteNome,
        descricao: `Repasse de Licença de Software: ${params.licenca.nome} (${params.licenca.plano})`,
        valor: params.licenca.valor,
        vencimento: params.vencimentoFinanceiro || params.licenca.vencimento,
        categoria: 'Repasse de Licenças & Serviços',
        centroCustoNome: 'Comercial & Faturamento',
      });
    }

    return novaLicenca;
  };

  return {
    equipamentos,
    estoqueItens,
    licencas,
    patrimonios,
    movimentacoes,
    inventarios,
    manutencoes,
    addEquipamento,
    updateEquipamento,
    deleteEquipamento,
    registrarNovoEquipamento,
    transferirEquipamento,
    addEstoqueItem,
    updateEstoqueItem,
    deleteEstoqueItem,
    ajustarEstoqueItemComFinanceiro,
    addLicenca,
    updateLicenca,
    deleteLicenca,
    criarLicencaComFinanceiro,
    addPatrimonio,
    updatePatrimonio,
    deletePatrimonio,
    addInventario,
    updateInventario,
    deleteInventario,
    addManutencao,
    updateManutencao,
    deleteManutencao,
    abrirManutencaoComFinanceiro,
    lancarContaPagar,
    lancarContaReceber,
  };
}
