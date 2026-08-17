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
    data: estoqueItens,
    addItem: addEstoqueItem,
    updateItem: updateEstoqueItem,
    deleteItem: deleteEstoqueItem,
  } = useLocalStorageState<EstoqueItem>('focus_itam_estoque_itens', INITIAL_ESTOQUE_ITENS);

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
  } = useLocalStorageState<Inventario>('focus_itam_inventarios', INITIAL_INVENTARIOS);

  const {
    data: manutencoes,
    addItem: addManutencao,
    updateItem: updateManutencao,
  } = useLocalStorageState<Manutencao>('focus_itam_manutencoes', INITIAL_MANUTENCOES);

  // Helper para vincular compra ao Contas a Pagar (Integração Financeira)
  const vincularDespesaFinanceira = (itemNome: string, valor: number, centroCusto: string) => {
    try {
      const contasPagarKey = 'focus_contas_pagar';
      const existing = JSON.parse(window.localStorage.getItem(contasPagarKey) || '[]');
      const novaDespesa = {
        id: 'cp_itam_' + Date.now(),
        descricao: `Compra de Ativo TI: ${itemNome}`,
        fornecedor: 'Fornecedor TI / Eletrônicos',
        valor: valor,
        vencimento: new Date().toISOString().split('T')[0],
        status: 'Pendente',
        categoria: 'Investimento em Ativos / TI',
        centroCusto: centroCusto || 'TI / Tecnologia',
        createdAt: new Date().toISOString(),
      };
      window.localStorage.setItem(contasPagarKey, JSON.stringify([novaDespesa, ...existing]));
      window.dispatchEvent(new Event('focus_store_update_' + contasPagarKey));
    } catch (e) {
      console.error('Erro ao vincular despesa financeira:', e);
    }
  };

  // Operação: Novo Equipamento
  const registrarNovoEquipamento = (eq: Omit<Equipamento, 'id' | 'createdAt'>, gerarDespesa: boolean = false) => {
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
      vincularDespesaFinanceira(`${eq.marca} ${eq.modelo}`, eq.valorCompra, eq.departamento || 'TI');
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

  // Operação: Entrada / Saída de Estoque Físico
  const ajustarEstoqueItem = (
    itemId: string,
    quantidadeMudanca: number,
    tipoOperacao: 'Entrada' | 'Saída' | 'Ajuste',
    motivo: string
  ) => {
    const item = estoqueItens.find((i) => i.id === itemId);
    if (!item) return;

    let novaQtd = item.quantidade;
    if (tipoOperacao === 'Entrada') novaQtd += quantidadeMudanca;
    else if (tipoOperacao === 'Saída') novaQtd = Math.max(0, novaQtd - quantidadeMudanca);
    else novaQtd = quantidadeMudanca;

    updateEstoqueItem(itemId, {
      quantidade: novaQtd,
      status: novaQtd === 0 ? 'Reservado' : 'Disponível',
    });

    addMovimentacao({
      id: 'mov-' + Date.now(),
      tipo: tipoOperacao === 'Entrada' ? 'Entrada' : tipoOperacao === 'Saída' ? 'Saída' : 'Transferência',
      estoqueItemId: itemId,
      estoqueItemNome: item.nome,
      usuarioId: 'usr-admin',
      usuarioNome: 'Administrador',
      dataHora: new Date().toLocaleString('pt-BR'),
      origem: item.localizacao,
      destino: motivo,
      observacoes: `${tipoOperacao} de ${quantidadeMudanca} unidade(s). Nova Qtd: ${novaQtd}. Motivo: ${motivo}`,
    });
  };

  // Operação: Abertura de Manutenção
  const abrirManutencao = (
    equipamentoId: string,
    tipo: 'Preventiva' | 'Corretiva' | 'Upgrade' | 'Troca',
    descricao: string,
    valor: number,
    responsavel: string
  ) => {
    const eq = equipamentos.find((e) => e.id === equipamentoId);
    const eqNome = eq ? `${eq.marca} ${eq.modelo}` : 'Equipamento';
    const eqCod = eq ? eq.codigoPatrimonial : '';

    const newManut: Manutencao = {
      id: 'manut-' + Date.now(),
      equipamentoId,
      equipamentoCodigo: eqCod,
      equipamentoNome: eqNome,
      tipo,
      data: new Date().toISOString().split('T')[0],
      descricao,
      valor,
      responsavelId: 'tech-01',
      responsavelNome: responsavel,
      status: 'Em Execução',
    };

    addManutencao(newManut);

    if (eq) {
      updateEquipamento(equipamentoId, {
        situacao: 'Manutenção',
        timeline: [
          {
            id: 'tm-' + Date.now(),
            dataHora: new Date().toLocaleString('pt-BR'),
            tipo: 'Manutenção',
            descricao: `Ordem de manutenção [${tipo}] aberta. Descrição: ${descricao}`,
            responsavel: responsavel,
            usuarioRegistro: 'Administrador',
          },
          ...(eq.timeline || []),
        ],
      });
    }

    addMovimentacao({
      id: 'mov-' + Date.now(),
      tipo: 'Manutenção',
      equipamentoId,
      equipamentoNome: `${eqNome} (${eqCod})`,
      usuarioId: 'usr-admin',
      usuarioNome: 'Administrador',
      dataHora: new Date().toLocaleString('pt-BR'),
      destino: `Assistência / Tech: ${responsavel}`,
      observacoes: `Manutenção ${tipo}. Custo estimado: R$ ${valor}`,
    });
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
    ajustarEstoqueItem,
    addLicenca,
    updateLicenca,
    deleteLicenca,
    addPatrimonio,
    updatePatrimonio,
    deletePatrimonio,
    addInventario,
    updateInventario,
    addManutencao,
    updateManutencao,
    abrirManutencao,
    vincularDespesaFinanceira,
  };
}
