import React, { useState, useMemo } from 'react';
import { useEstoquePatrimonio } from '../hooks/useEstoquePatrimonio';
import { Equipamento, EstoqueItem, Licenca, Patrimonio, Movimentacao, Manutencao, CategoriaEquipamento, SituacaoEquipamento, EstadoConservacaoItem } from '../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Filter, Plus, Laptop, Package, KeyRound, DollarSign,
  History, Wrench, Trash2, ArrowRightLeft, Check, AlertTriangle,
  FileText, Building2, User, Calendar, ShieldAlert, Layers,
  Boxes, ShieldCheck, Tag, Hash, RefreshCw, Smartphone, Monitor,
  Cpu, HardDrive, CheckCircle2, ChevronRight
} from 'lucide-react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { CentroCusto } from '@/features/centro-de-custos/types';
import { INITIAL_CENTROS } from '@/features/centro-de-custos/data/initialData';
import { CategoriaFinanceira } from '@/features/plano-contas/types';
import { INITIAL_CATEGORIAS } from '@/features/plano-contas/mockData';
import { RelatoriosModal } from './RelatoriosModal';
import { formatDateBrasilia } from '@/lib/dateUtils';
import { toast } from 'sonner';

export const CATEGORIAS_EQUIPAMENTOS: CategoriaEquipamento[] = [
  'Notebook',
  'Monitor',
  'Desktop',
  'Celular',
  'Tablet',
  'Impressora',
  'Servidor',
  'Switch',
  'Nobreak',
  'Mouse',
  'Teclado',
  'Headset',
  'Webcam',
  'Dock Station',
  'Outros',
];

export const CATEGORIAS_ESCRITORIO = [
  'Smart Devices & Alexa',
  'Audiovisual & TV',
  'Livros & Treinamento',
  'Cozinha & Convivência',
  'Mobiliário & Escritório',
  'Decoração & Conforto',
  'Acessórios & Papelaria',
  'Outros',
];

export const ESTADOS_CONSERVACAO: EstadoConservacaoItem[] = [
  'Novo',
  'Excelente',
  'Bom',
  'Desgastado',
  'Danificado',
  'Em Manutenção',
];

export const SALAS_LOCAIS_SUGERIDOS = [
  'Sala de Reunião Principal',
  'Sala de Apresentações',
  'Recepção',
  'Copa / Cozinha',
  'Biblioteca Focus',
  'Sala da Diretoria',
  'Espaço Convivência',
  'Sala de Brainstorming',
  'Armário Multiuso',
  'Estação de Trabalho Geral',
];

export const CATEGORIAS_PATRIMONIO = [
  'Mobiliário Corporativo',
  'Equipamentos de TI',
  'Máquinas & Equipamentos',
  'Veículos',
  'Audiovisual & Sala de Reunião',
  'Instalações & Benfeitorias',
  'Outros',
];

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function MobileEstoquePatrimonioView() {
  const {
    equipamentos,
    estoqueItens,
    licencas,
    patrimonios,
    movimentacoes,
    manutencoes,
    registrarNovoEquipamento,
    addEstoqueItem,
    ajustarEstoqueItemComFinanceiro,
    criarLicencaComFinanceiro,
    addPatrimonio,
    addMovimentacao,
    abrirManutencaoComFinanceiro,
    transferirEquipamento,
    deleteEquipamento,
    deleteEstoqueItem,
    deleteLicenca,
    deletePatrimonio
  } = useEstoquePatrimonio();

  const { data: clientes = [] } = useLocalStorageState<any>('focus_clientes', []);
  const { data: centrosCusto = [] } = useLocalStorageState<CentroCusto>('focus_centro_custos', INITIAL_CENTROS);
  const { data: planoContas = [] } = useLocalStorageState<CategoriaFinanceira>('focus_plano_contas', INITIAL_CATEGORIAS);

  const categoriasDespesa = useMemo(() => {
    return planoContas.filter(c => c.tipo === 'Despesa' || !c.tipo);
  }, [planoContas]);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'equipamentos' | 'estoque' | 'licencas' | 'patrimonio' | 'movimentacoes' | 'manutencoes'>('equipamentos');
  const [situacaoFilter, setSituacaoFilter] = useState<string>('todos');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [relatoriosModalOpen, setRelatoriosModalOpen] = useState(false);

  // Modais de Criação Específicos por Seção
  const [novoEquipamentoOpen, setNovoEquipamentoOpen] = useState(false);
  const [novoItemEstoqueOpen, setNovoItemEstoqueOpen] = useState(false);
  const [novaLicencaOpen, setNovaLicencaOpen] = useState(false);
  const [novoPatrimonioOpen, setNovoPatrimonioOpen] = useState(false);
  const [novaMovimentacaoOpen, setNovaMovimentacaoOpen] = useState(false);
  const [novaManutencaoOpen, setNovaManutencaoOpen] = useState(false);

  // Modais de Ação em Item
  const [transferirModalOpen, setTransferirModalOpen] = useState(false);
  const [manutencaoModalOpen, setManutencaoModalOpen] = useState(false);
  const [ajusteEstoqueModalOpen, setAjusteEstoqueModalOpen] = useState(false);

  const [selectedEquipamento, setSelectedEquipamento] = useState<Equipamento | null>(null);
  const [selectedEstoqueItem, setSelectedEstoqueItem] = useState<EstoqueItem | null>(null);

  // Form State: 1. Novo Equipamento
  const [formEq, setFormEq] = useState({
    codigoPatrimonial: `PAT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    tipo: 'Notebook' as any,
    categoria: 'Notebook' as CategoriaEquipamento,
    marca: 'Apple',
    modelo: 'MacBook Air M2',
    numeroSerie: '',
    dataAquisicao: new Date().toISOString().split('T')[0],
    valorCompra: '8500',
    garantiaMeses: '24',
    situacao: 'Disponível' as SituacaoEquipamento,
    departamento: 'Engenharia de Software',
    colaboradorNome: '',
    localFisica: 'Estoque Central TI',
    observacoes: '',
    gerarDespesaFinanceira: false,

    // Specs Notebook
    processador: 'Apple M2',
    memoriaRam: '16 GB',
    armazenamento: '512 GB SSD',
    sistemaOperacional: 'macOS',
    nomeEquipamento: '',
    serviceTag: '',
    macAddress: '',

    // Specs Monitor
    polegadas: '27"',
    resolucao: '2560 x 1440 (QHD)',
    tipoPainel: 'IPS',
    conexoes: 'HDMI, DisplayPort, USB-C',
  });

  // Form State: 2. Novo Item Estoque
  const [formEstoque, setFormEstoque] = useState<{
    codigo: string;
    nome: string;
    descricao: string;
    categoria: string;
    quantidade: string;
    quantidadeMinima: string;
    estadoConservacao: EstadoConservacaoItem;
    localizacao: string;
    status: 'Disponível' | 'Reservado' | 'Em Uso' | 'Emprestado' | 'Manutenção' | 'Baixado';
    valorUnitario: string;
    responsavelNome: string;
    observacoes: string;
  }>({
    codigo: `ESC-${Math.floor(100 + Math.random() * 900)}`,
    nome: '',
    descricao: '',
    categoria: 'Smart Devices & Alexa',
    quantidade: '1',
    quantidadeMinima: '1',
    estadoConservacao: 'Excelente',
    localizacao: 'Sala de Reunião Principal',
    status: 'Em Uso',
    valorUnitario: '0',
    responsavelNome: '',
    observacoes: '',
  });

  // Form State: 3. Nova Licença SaaS
  const [formLicenca, setFormLicenca] = useState({
    nome: 'Canva Premium',
    fabricante: 'Canva',
    plano: 'Enterprise Annual',
    tipo: 'Assinatura' as 'Assinatura' | 'Perpétua',
    quantidadeTotal: '8',
    quantidadeUsada: '1',
    dataCompra: new Date().toISOString().split('T')[0],
    vencimento: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10).toISOString().split('T')[0],
    valor: '35.00',
    responsavelNome: 'Equipe de TI & Marketing',
    centroCustoId: '',
    centroCustoNome: 'Comercial & Marketing',
    categoriaFinanceira: 'Licenciamento de Software',
    observacoes: '',
    gerarContaPagar: true,
    gerarContaReceber: false,
    clienteNome: '',
  });

  // Form State: 4. Novo Bem Patrimonial
  const [formPatrimonio, setFormPatrimonio] = useState({
    numeroPatrimonial: `PAT-M-${Math.floor(100 + Math.random() * 900)}`,
    codigoInterno: `MOB-${Math.floor(10 + Math.random() * 90)}`,
    categoria: 'Mobiliário Corporativo',
    valorCompra: '2800',
    taxaDepreciacaoAnual: '10',
    vidaUtilAnos: '10',
    dataCompra: new Date().toISOString().split('T')[0],
    estadoConservacao: 'Novo' as 'Novo' | 'Bom' | 'Regular' | 'Ruim' | 'Obsoleto',
    situacao: 'Ativo' as 'Ativo' | 'Baixado' | 'Descarte',
    centroCustoId: '',
    centroCustoNome: 'Administrativo & Escritório',
    responsavel: 'Administrativo',
    departamento: 'Operações & Facilities',
    localizacao: 'São Paulo - Sede',
  });

  // Form State: 5. Nova Movimentação
  const [formMov, setFormMov] = useState({
    tipo: 'Transferência' as 'Entrada' | 'Saída' | 'Transferência' | 'Manutenção' | 'Baixa' | 'Descarte' | 'Alteração Responsável' | 'Alteração Local' | 'Atribuição' | 'Devolução',
    equipamentoId: '',
    estoqueItemId: '',
    responsavelNome: '',
    departamento: 'Engenharia de Software',
    origem: 'Estoque Central TI',
    destino: 'Estação de Trabalho / Home Office',
    observacoes: '',
  });

  // Form State: 6. Nova Manutenção
  const [formManutGeral, setFormManutGeral] = useState({
    equipamentoId: '',
    tipo: 'Preventiva' as 'Preventiva' | 'Corretiva' | 'Upgrade' | 'Troca',
    descricao: '',
    valor: '250.00',
    responsavel: 'Assistência Técnica Especializada',
    prestador: 'Assistência Técnica Especializada',
    vencimento: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    centroCustoId: '',
    centroCustoNome: 'Operacional & Tecnologia',
    categoriaFinanceira: 'Manutenção de Equipamentos & TI',
    gerarContaPagar: true,
    gerarContaReceber: false,
    clienteNome: '',
  });

  // Modal Auxiliar: Transferência em Item
  const [formTransfer, setFormTransfer] = useState({
    novoResponsavel: '',
    novoDepartamento: 'Operações',
    novaLocalizacao: 'São Paulo - Sede',
    observacao: ''
  });

  // Modal Auxiliar: Manutenção em Item
  const [formManut, setFormManut] = useState({
    tipo: 'Corretiva' as const,
    descricao: '',
    valor: '',
    responsavel: 'Assistência Técnica Autorizada'
  });

  // Modal Auxiliar: Ajuste Estoque
  const [formAjusteEstoque, setFormAjusteEstoque] = useState({
    tipoOperacao: 'Entrada' as 'Entrada' | 'Saída',
    quantidade: '1',
    motivo: 'Reposição de estoque',
    valorTotal: ''
  });

  // KPIs
  const stats = useMemo(() => {
    const totalEquipamentos = equipamentos.length;
    const equipamentosEmUso = equipamentos.filter(e => e.situacao === 'Em Uso').length;
    const totalPatrimonioValor = patrimonios.reduce((acc, p) => acc + (p.valorAtual || p.valorCompra || 0), 0);
    const totalLicencasCusto = licencas.reduce((acc, l) => acc + (l.valor || 0), 0);
    const itensAbaixoMinimo = estoqueItens.filter(i => i.quantidade < i.quantidadeMinima).length;

    return {
      totalEquipamentos,
      equipamentosEmUso,
      totalPatrimonioValor,
      totalLicencasCusto,
      totalEstoqueItens: estoqueItens.length,
      itensAbaixoMinimo,
      totalLicencas: licencas.length
    };
  }, [equipamentos, patrimonios, licencas, estoqueItens]);

  // Filtragem Equipamentos
  const filteredEquipamentos = useMemo(() => {
    return equipamentos.filter(e => {
      if (!e) return false;
      const s = searchTerm.toLowerCase();
      const matchSearch =
        (e.codigoPatrimonial || '').toLowerCase().includes(s) ||
        (e.marca || '').toLowerCase().includes(s) ||
        (e.modelo || '').toLowerCase().includes(s) ||
        (e.colaboradorNome || '').toLowerCase().includes(s) ||
        (e.departamento || '').toLowerCase().includes(s);

      if (!matchSearch) return false;
      if (situacaoFilter !== 'todos' && e.situacao !== situacaoFilter) return false;
      return true;
    });
  }, [equipamentos, searchTerm, situacaoFilter]);

  // Filtragem Estoque
  const filteredEstoque = useMemo(() => {
    return estoqueItens.filter(i => {
      if (!i) return false;
      const s = searchTerm.toLowerCase();
      return (
        (i.nome || '').toLowerCase().includes(s) ||
        (i.codigo || '').toLowerCase().includes(s) ||
        (i.categoria || '').toLowerCase().includes(s)
      );
    });
  }, [estoqueItens, searchTerm]);

  // Filtragem Licenças
  const filteredLicencas = useMemo(() => {
    return licencas.filter(l => {
      if (!l) return false;
      const s = searchTerm.toLowerCase();
      return (
        (l.nome || '').toLowerCase().includes(s) ||
        (l.fabricante || '').toLowerCase().includes(s) ||
        (l.plano || '').toLowerCase().includes(s)
      );
    });
  }, [licencas, searchTerm]);

  // Filtragem Patrimônio
  const filteredPatrimonio = useMemo(() => {
    return patrimonios.filter(p => {
      if (!p) return false;
      const s = searchTerm.toLowerCase();
      return (
        (p.numeroPatrimonial || '').toLowerCase().includes(s) ||
        (p.categoria || '').toLowerCase().includes(s) ||
        (p.codigoInterno || '').toLowerCase().includes(s)
      );
    });
  }, [patrimonios, searchTerm]);

  // Filtragem Movimentações
  const filteredMovimentacoes = useMemo(() => {
    return movimentacoes.filter(m => {
      if (!m) return false;
      const s = searchTerm.toLowerCase();
      return (
        (m.equipamentoNome || '').toLowerCase().includes(s) ||
        (m.estoqueItemNome || '').toLowerCase().includes(s) ||
        (m.tipo || '').toLowerCase().includes(s) ||
        (m.responsavelNome || '').toLowerCase().includes(s)
      );
    });
  }, [movimentacoes, searchTerm]);

  // Filtragem Manutenções
  const filteredManutencoes = useMemo(() => {
    return manutencoes.filter(m => {
      if (!m) return false;
      const s = searchTerm.toLowerCase();
      return (
        (m.equipamentoNome || '').toLowerCase().includes(s) ||
        (m.tipo || '').toLowerCase().includes(s) ||
        (m.responsavelNome || '').toLowerCase().includes(s)
      );
    });
  }, [manutencoes, searchTerm]);

  // Ação Dinâmica do Botão "+ Novo"
  const handleNovoClick = () => {
    switch (activeTab) {
      case 'equipamentos':
        setNovoEquipamentoOpen(true);
        break;
      case 'estoque':
        setNovoItemEstoqueOpen(true);
        break;
      case 'licencas':
        setNovaLicencaOpen(true);
        break;
      case 'patrimonio':
        setNovoPatrimonioOpen(true);
        break;
      case 'movimentacoes':
        setNovaMovimentacaoOpen(true);
        break;
      case 'manutencoes':
        setNovaManutencaoOpen(true);
        break;
    }
  };

  const getNovoButtonLabel = () => {
    switch (activeTab) {
      case 'equipamentos': return 'Equipamento';
      case 'estoque': return 'Item Estoque';
      case 'licencas': return 'Licença';
      case 'patrimonio': return 'Patrimônio';
      case 'movimentacoes': return 'Movimentação';
      case 'manutencoes': return 'Manutenção';
      default: return 'Novo';
    }
  };

  // Submissão: 1. Novo Equipamento
  const handleCreateEquipamento = () => {
    if (!formEq.codigoPatrimonial.trim()) { toast.error('Informe o código patrimonial'); return; }
    if (!formEq.modelo.trim()) { toast.error('Informe o modelo'); return; }

    const val = parseFloat(formEq.valorCompra.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
    const garantia = parseInt(formEq.garantiaMeses) || 12;

    const specsNotebook =
      formEq.categoria === 'Notebook' || formEq.categoria === 'Desktop'
        ? {
            processador: formEq.processador,
            memoriaRam: formEq.memoriaRam,
            armazenamento: formEq.armazenamento,
            sistemaOperacional: formEq.sistemaOperacional,
            nomeEquipamento: formEq.nomeEquipamento,
            serviceTag: formEq.serviceTag,
            macAddress: formEq.macAddress,
            fabricante: formEq.marca,
          }
        : undefined;

    const specsMonitor =
      formEq.categoria === 'Monitor'
        ? {
            polegadas: formEq.polegadas,
            resolucao: formEq.resolucao,
            tipoPainel: formEq.tipoPainel,
            conexoes: formEq.conexoes.split(',').map((c) => c.trim()),
          }
        : undefined;

    registrarNovoEquipamento({
      codigoPatrimonial: formEq.codigoPatrimonial,
      tipo: formEq.categoria,
      categoria: formEq.categoria,
      marca: formEq.marca || 'Genérica',
      modelo: formEq.modelo,
      numeroSerie: formEq.numeroSerie || `SN-${Date.now().toString().slice(-6)}`,
      valorCompra: val,
      dataCompra: formEq.dataAquisicao || new Date().toISOString().split('T')[0],
      garantiaMeses: garantia,
      colaboradorNome: formEq.colaboradorNome,
      departamento: formEq.departamento,
      localFisica: formEq.localFisica,
      situacao: formEq.colaboradorNome ? 'Em Uso' : formEq.situacao,
      observacoes: formEq.observacoes,
      notebookSpecs: specsNotebook,
      monitorSpecs: specsMonitor,
      gerarDespesaFinanceira: formEq.gerarDespesaFinanceira,
    });

    toast.success(`Equipamento ${formEq.codigoPatrimonial} cadastrado com sucesso!`);
    setNovoEquipamentoOpen(false);
  };

  // Submissão: 2. Novo Item Estoque
  const handleCreateEstoqueItem = () => {
    if (!formEstoque.nome.trim()) { toast.error('Informe o título/nome do item de escritório'); return; }

    const qtd = parseInt(formEstoque.quantidade) || 1;
    const qtdMin = parseInt(formEstoque.quantidadeMinima) || 1;
    const valUnit = parseFloat(formEstoque.valorUnitario.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;

    addEstoqueItem({
      id: crypto.randomUUID(),
      nome: formEstoque.nome,
      codigo: formEstoque.codigo || `ESC-${Math.floor(100 + Math.random() * 900)}`,
      descricao: formEstoque.descricao,
      categoria: formEstoque.categoria,
      quantidade: qtd,
      quantidadeMinima: qtdMin,
      valorUnitario: valUnit,
      localizacao: formEstoque.localizacao,
      estadoConservacao: formEstoque.estadoConservacao,
      responsavelNome: formEstoque.responsavelNome,
      observacoes: formEstoque.observacoes,
      status: formEstoque.status,
    });

    toast.success(`Item "${formEstoque.nome}" adicionado com sucesso!`);
    setNovoItemEstoqueOpen(false);
  };

  // Submissão: 3. Nova Licença SaaS
  const handleCreateLicenca = () => {
    if (!formLicenca.nome.trim() || !formLicenca.fabricante.trim()) {
      toast.error('Informe o nome do software e o fabricante');
      return;
    }

    const val = parseFloat(formLicenca.valor.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
    const qtdTotal = parseInt(formLicenca.quantidadeTotal) || 1;
    const qtdUsada = parseInt(formLicenca.quantidadeUsada) || 0;
    const qtdDisp = Math.max(0, qtdTotal - qtdUsada);

    const selectedCc = centrosCusto.find(c => c.id === formLicenca.centroCustoId || c.nome === formLicenca.centroCustoNome);
    const ccNomeFinal = selectedCc ? selectedCc.nome : (formLicenca.centroCustoNome || 'Comercial & Marketing');
    const ccIdFinal = selectedCc ? selectedCc.id : formLicenca.centroCustoId;

    criarLicencaComFinanceiro({
      licenca: {
        nome: formLicenca.nome,
        fabricante: formLicenca.fabricante,
        plano: formLicenca.plano,
        tipo: formLicenca.tipo,
        quantidadeTotal: qtdTotal,
        quantidadeUsada: qtdUsada,
        quantidadeDisponivel: qtdDisp,
        dataCompra: formLicenca.dataCompra,
        vencimento: formLicenca.vencimento,
        valor: val,
        responsavelNome: formLicenca.responsavelNome,
        centroCustoNome: ccNomeFinal,
        centroCustoId: ccIdFinal,
        observacoes: formLicenca.observacoes,
        createdAt: new Date().toISOString(),
      },
      gerarContaPagar: formLicenca.gerarContaPagar,
      gerarContaReceber: formLicenca.gerarContaReceber,
      clienteNome: formLicenca.clienteNome,
      vencimentoFinanceiro: formLicenca.vencimento,
    });

    toast.success(`Licença "${formLicenca.nome}" registrada com sucesso!`);
    setNovaLicencaOpen(false);
  };

  // Submissão: 4. Novo Bem Patrimonial
  const handleCreatePatrimonio = () => {
    if (!formPatrimonio.numeroPatrimonial.trim()) { toast.error('Informe a placa / número patrimonial'); return; }

    const val = parseFloat(formPatrimonio.valorCompra.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
    const taxa = parseFloat(formPatrimonio.taxaDepreciacaoAnual) || 10;
    const vida = parseInt(formPatrimonio.vidaUtilAnos) || 10;

    const selectedCc = centrosCusto.find(c => c.id === formPatrimonio.centroCustoId || c.nome === formPatrimonio.centroCustoNome);
    const ccNomeFinal = selectedCc ? selectedCc.nome : (formPatrimonio.centroCustoNome || 'Administrativo & Escritório');

    addPatrimonio({
      id: crypto.randomUUID(),
      numeroPatrimonial: formPatrimonio.numeroPatrimonial,
      codigoInterno: formPatrimonio.codigoInterno,
      categoria: formPatrimonio.categoria,
      valorCompra: val,
      valorAtual: val,
      depreciacaoAcumulada: 0,
      taxaDepreciacaoAnual: taxa,
      vidaUtilAnos: vida,
      dataCompra: formPatrimonio.dataCompra,
      estadoConservacao: formPatrimonio.estadoConservacao as any,
      situacao: formPatrimonio.situacao,
      centroCustoId: selectedCc ? selectedCc.id : formPatrimonio.centroCustoId,
      centroCustoNome: ccNomeFinal,
      responsavel: formPatrimonio.responsavel,
      departamento: formPatrimonio.departamento,
      localizacao: formPatrimonio.localizacao
    });

    toast.success(`Bem patrimonial ${formPatrimonio.numeroPatrimonial} cadastrado!`);
    setNovoPatrimonioOpen(false);
  };

  // Submissão: 5. Nova Movimentação
  const handleCreateMovimentacao = () => {
    if (!formMov.responsavelNome.trim()) { toast.error('Informe o responsável da movimentação'); return; }

    const selectedEq = equipamentos.find(e => e.id === formMov.equipamentoId);
    const selectedItem = estoqueItens.find(i => i.id === formMov.estoqueItemId);
    const nomeAtivo = selectedEq
      ? `${selectedEq.marca} ${selectedEq.modelo} (${selectedEq.codigoPatrimonial})`
      : selectedItem
      ? `${selectedItem.nome} (${selectedItem.codigo})`
      : 'Ativo Corporativo';

    addMovimentacao({
      id: crypto.randomUUID(),
      tipo: formMov.tipo,
      equipamentoId: formMov.equipamentoId || undefined,
      equipamentoNome: selectedEq ? nomeAtivo : undefined,
      estoqueItemId: formMov.estoqueItemId || undefined,
      estoqueItemNome: selectedItem ? nomeAtivo : undefined,
      usuarioId: 'user-mobile',
      usuarioNome: formMov.responsavelNome,
      responsavelNome: formMov.responsavelNome,
      origem: formMov.origem,
      destino: formMov.destino,
      dataHora: new Date().toISOString(),
      observacoes: formMov.observacoes || 'Movimentação realizada via app mobile'
    });

    toast.success(`Movimentação de ${formMov.tipo} registrada com sucesso!`);
    setNovaMovimentacaoOpen(false);
  };

  // Submissão: 6. Nova Manutenção
  const handleCreateManutencaoGeral = () => {
    if (!formManutGeral.descricao.trim()) { toast.error('Informe a descrição do serviço de manutenção'); return; }
    if (!formManutGeral.equipamentoId) { toast.error('Selecione o equipamento'); return; }

    const val = parseFloat(formManutGeral.valor.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
    const selectedCc = centrosCusto.find(c => c.id === formManutGeral.centroCustoId || c.nome === formManutGeral.centroCustoNome);
    const ccNomeFinal = selectedCc ? selectedCc.nome : (formManutGeral.centroCustoNome || 'Operacional & Tecnologia');
    const ccIdFinal = selectedCc ? selectedCc.id : formManutGeral.centroCustoId;

    abrirManutencaoComFinanceiro({
      equipamentoId: formManutGeral.equipamentoId,
      tipo: formManutGeral.tipo,
      descricao: formManutGeral.descricao,
      valor: val,
      responsavel: formManutGeral.responsavel,
      prestador: formManutGeral.prestador,
      gerarContaPagar: formManutGeral.gerarContaPagar,
      gerarContaReceber: formManutGeral.gerarContaReceber,
      clienteNome: formManutGeral.clienteNome,
      vencimento: formManutGeral.vencimento,
      centroCustoId: ccIdFinal,
      centroCustoNome: ccNomeFinal,
      categoria: formManutGeral.categoriaFinanceira,
    });

    toast.success(`Ordem de manutenção criada com sucesso!`);
    setNovaManutencaoOpen(false);
  };

  // Ações em Linha / Item Selecionado
  const handleExecuteTransfer = () => {
    if (!selectedEquipamento) return;
    if (!formTransfer.novoResponsavel.trim()) { toast.error('Informe o novo responsável'); return; }

    transferirEquipamento(
      selectedEquipamento.id,
      formTransfer.novoResponsavel,
      formTransfer.novoDepartamento,
      formTransfer.novaLocalizacao,
      formTransfer.observacao || 'Transferência realizada via app mobile'
    );

    toast.success(`Equipamento transferido para ${formTransfer.novoResponsavel}!`);
    setTransferirModalOpen(false);
    setSelectedEquipamento(null);
  };

  const handleExecuteManutencao = () => {
    if (!selectedEquipamento) return;
    if (!formManut.descricao.trim()) { toast.error('Informe a descrição da manutenção'); return; }

    const val = parseFloat(formManut.valor.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;

    abrirManutencaoComFinanceiro({
      equipamentoId: selectedEquipamento.id,
      tipo: formManut.tipo,
      descricao: formManut.descricao,
      valor: val,
      responsavel: formManut.responsavel,
    });

    toast.success(`Ordem de manutenção aberta para ${selectedEquipamento.modelo}!`);
    setManutencaoModalOpen(false);
    setSelectedEquipamento(null);
  };

  const handleExecuteAjusteEstoque = () => {
    if (!selectedEstoqueItem) return;
    const qtd = parseInt(formAjusteEstoque.quantidade) || 1;
    const val = parseFloat(formAjusteEstoque.valorTotal.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;

    ajustarEstoqueItemComFinanceiro({
      itemId: selectedEstoqueItem.id,
      quantidadeMudanca: qtd,
      tipoOperacao: formAjusteEstoque.tipoOperacao,
      motivo: formAjusteEstoque.motivo,
      gerarFinanceiro: val > 0,
      valorTotal: val
    });

    toast.success(`${formAjusteEstoque.tipoOperacao} de ${qtd} un. realizada com sucesso!`);
    setAjusteEstoqueModalOpen(false);
    setSelectedEstoqueItem(null);
  };

  const getSituacaoBadge = (situacao: string) => {
    switch (situacao) {
      case 'Em Uso':
        return <Badge className="bg-blue-600 text-white text-[10px] font-bold">Em Uso</Badge>;
      case 'Disponível':
        return <Badge className="bg-emerald-600 text-white text-[10px] font-bold">Disponível</Badge>;
      case 'Manutenção':
        return <Badge variant="destructive" className="text-[10px] font-bold">Manutenção</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] font-bold">{situacao || 'Pendente'}</Badge>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-zinc-950 pb-28">
      {/* 1. TOP CARDS & RESUMO KPI */}
      <div className="bg-gradient-to-b from-background to-muted/20 border-b p-3.5 space-y-3">
        {/* Card Principal: Total Ativos */}
        <div className="bg-white dark:bg-card border border-border/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-primary" />
              Equipamentos & Ativos
            </span>
            <div className="text-2xl font-black tracking-tight text-foreground">
              {stats.totalEquipamentos} ativos
            </div>
            <p className="text-[10px] text-muted-foreground">
              {stats.equipamentosEmUso} em uso ({stats.totalEquipamentos > 0 ? Math.round((stats.equipamentosEmUso / stats.totalEquipamentos) * 100) : 0}%)
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary border-primary/30">
              {formatCurrency(stats.totalPatrimonioValor)}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {stats.totalLicencas} licenças SaaS
            </span>
          </div>
        </div>

        {/* Mini Cards: Estoque & Licenças */}
        <div className="grid grid-cols-2 gap-2.5">
          <div
            onClick={() => setActiveTab('estoque')}
            className={`bg-white dark:bg-card border rounded-2xl p-3 shadow-xs space-y-1 cursor-pointer transition-all active:scale-[0.99] ${
              activeTab === 'estoque' ? 'border-primary ring-1 ring-primary/20' : 'border-border/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Package className="w-3 h-3 text-amber-500" />
                Almoxarifado
              </span>
              {stats.itensAbaixoMinimo > 0 ? (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </div>
            <div className="text-base font-black text-foreground">
              {stats.totalEstoqueItens} itens
            </div>
            {stats.itensAbaixoMinimo > 0 && (
              <p className="text-[10px] text-rose-600 font-bold">
                {stats.itensAbaixoMinimo} abaixo do mín.
              </p>
            )}
          </div>

          <div
            onClick={() => setActiveTab('licencas')}
            className={`bg-white dark:bg-card border rounded-2xl p-3 shadow-xs space-y-1 cursor-pointer transition-all active:scale-[0.99] ${
              activeTab === 'licencas' ? 'border-primary ring-1 ring-primary/20' : 'border-border/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-indigo-500" />
                SaaS & Licenças
              </span>
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
            </div>
            <div className="text-sm font-black text-indigo-600 dark:text-indigo-400 truncate">
              {formatCurrency(stats.totalLicencasCusto)}/mês
            </div>
          </div>
        </div>
      </div>

      {/* 2. STICKY SEARCH, FILTER & ACTION BAR */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b px-3.5 py-2.5 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar modelo, código, responsável..."
              className="h-9 pl-9 pr-3 text-xs rounded-xl bg-muted/40 border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          {/* Botão de Filtros */}
          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl shrink-0 border-muted-foreground/20 text-muted-foreground hover:text-foreground relative"
                aria-label="Filtrar"
              >
                <Filter className="w-4 h-4" />
                {situacaoFilter !== 'todos' && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] p-4 bg-background">
              <SheetHeader className="pb-3 border-b text-left">
                <SheetTitle className="text-base font-bold">Filtros de Estoque e Patrimônio</SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  Filtre ativos por situação operacional.
                </SheetDescription>
              </SheetHeader>

              <div className="py-4 space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-foreground block mb-2">Situação do Ativo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'todos', label: 'Todas' },
                      { id: 'Em Uso', label: 'Em Uso' },
                      { id: 'Disponível', label: 'Disponível' },
                      { id: 'Manutenção', label: 'Manutenção' },
                    ].map((st) => (
                      <Button
                        key={st.id}
                        type="button"
                        variant={situacaoFilter === st.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSituacaoFilter(st.id)}
                        className={`text-xs h-9 rounded-xl ${situacaoFilter === st.id ? 'bg-primary text-white font-bold' : ''}`}
                      >
                        {st.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => setFilterSheetOpen(false)}
                  className="w-full bg-primary hover:bg-primary/90 text-white mt-4 h-11 rounded-xl font-bold"
                >
                  Aplicar Filtros
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Botão de Criação Específico por Seção */}
          <Button
            size="sm"
            onClick={handleNovoClick}
            className="h-9 px-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-xs gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            {getNovoButtonLabel()}
          </Button>
        </div>

        {/* Category Horizontal Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
          {[
            { id: 'equipamentos', label: `Equipamentos (${equipamentos.length})` },
            { id: 'estoque', label: `Estoque (${estoqueItens.length})` },
            { id: 'licencas', label: `Licenças (${licencas.length})` },
            { id: 'patrimonio', label: `Patrimônio (${patrimonios.length})` },
            { id: 'movimentacoes', label: `Movimentações (${movimentacoes.length})` },
            { id: 'manutencoes', label: `Manutenções (${manutencoes.length})` },
          ].map((pill) => {
            const isActive = activeTab === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setActiveTab(pill.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
                  isActive
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-background text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. LISTA DE CONTEÚDO CONFORME ABA (CARDS TOUCH) */}
      <div className="p-3.5 space-y-2.5">
        {/* ABA: EQUIPAMENTOS */}
        {activeTab === 'equipamentos' && (
          filteredEquipamentos.length === 0 ? (
            <div className="bg-card rounded-2xl border p-8 text-center space-y-3 mt-4">
              <Laptop className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
              <div className="font-semibold text-sm text-foreground">Nenhum equipamento encontrado</div>
              <Button variant="outline" size="sm" onClick={() => setNovoEquipamentoOpen(true)} className="text-xs rounded-xl">
                Cadastrar Equipamento
              </Button>
            </div>
          ) : (
            filteredEquipamentos.map((eq) => (
              <div
                key={eq.id}
                className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-xs transition-all active:scale-[0.99] flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md font-bold">
                        {eq.codigoPatrimonial}
                      </span>
                      {getSituacaoBadge(eq.situacao)}
                    </div>
                    <h4 className="font-bold text-xs text-foreground mt-1 truncate">
                      {eq.marca} {eq.modelo}
                    </h4>
                    <p className="text-[11px] text-muted-foreground truncate">
                      SN: {eq.numeroSerie || 'Não registrado'} • {eq.categoria}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-foreground">
                      {formatCurrency(eq.valorCompra)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-dashed border-border/60">
                  <div className="flex items-center gap-1 font-medium text-foreground truncate max-w-[170px]">
                    <User className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{eq.colaboradorNome || 'Disponível em Estoque'}</span>
                  </div>
                  <span className="truncate">{eq.localFisica || eq.departamento}</span>
                </div>

                {/* Ações Rápidas */}
                <div className="flex items-center justify-end gap-1.5 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedEquipamento(eq);
                      setTransferirModalOpen(true);
                    }}
                    className="h-7 px-2.5 text-[10px] font-bold text-primary hover:bg-primary/10 rounded-lg gap-1"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    Transferir
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedEquipamento(eq);
                      setManutencaoModalOpen(true);
                    }}
                    className="h-7 px-2.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-lg gap-1"
                  >
                    <Wrench className="w-3 h-3" />
                    Manutenção
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Deseja excluir o equipamento ${eq.codigoPatrimonial}?`)) {
                        deleteEquipamento(eq.id);
                        toast.success('Equipamento excluído!');
                      }
                    }}
                    className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )
        )}

        {/* ABA: ESTOQUE */}
        {activeTab === 'estoque' && (
          filteredEstoque.length === 0 ? (
            <div className="bg-card rounded-2xl border p-8 text-center space-y-3 mt-4">
              <Package className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
              <div className="font-semibold text-sm text-foreground">Nenhum item no estoque</div>
              <Button variant="outline" size="sm" onClick={() => setNovoItemEstoqueOpen(true)} className="text-xs rounded-xl">
                Adicionar Item ao Estoque
              </Button>
            </div>
          ) : (
            filteredEstoque.map((item) => {
              const isCritico = item.quantidade < item.quantidadeMinima;
              return (
                <div
                  key={item.id}
                  className={`bg-card rounded-2xl border p-3.5 shadow-xs flex flex-col gap-2 ${
                    isCritico ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20' : 'border-border/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded font-bold">
                          {item.codigo}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {item.categoria}
                        </Badge>
                      </div>
                      <h4 className="font-bold text-xs text-foreground mt-1 truncate">{item.nome}</h4>
                      <p className="text-[11px] text-muted-foreground">{item.localizacao}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`text-base font-black ${isCritico ? 'text-rose-600' : 'text-foreground'}`}>
                        {item.quantidade} un.
                      </div>
                      <span className="text-[10px] text-muted-foreground">Mín: {item.quantidadeMinima} un.</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-dashed border-border/60 text-[11px]">
                    <span className="font-semibold text-foreground">
                      Unit: {formatCurrency(item.valorUnitario)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedEstoqueItem(item);
                          setAjusteEstoqueModalOpen(true);
                        }}
                        className="h-7 px-2.5 text-[10px] font-bold text-primary rounded-lg gap-1"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        Movimentar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Excluir item ${item.nome}?`)) {
                            deleteEstoqueItem(item.id);
                            toast.success('Item excluído!');
                          }
                        }}
                        className="h-7 w-7 p-0 text-rose-500 rounded-lg"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )
        )}

        {/* ABA: LICENÇAS */}
        {activeTab === 'licencas' && (
          filteredLicencas.length === 0 ? (
            <div className="bg-card rounded-2xl border p-8 text-center space-y-3 mt-4">
              <KeyRound className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
              <div className="font-semibold text-sm text-foreground">Nenhuma licença cadastrada</div>
              <Button variant="outline" size="sm" onClick={() => setNovaLicencaOpen(true)} className="text-xs rounded-xl">
                Cadastrar Licença
              </Button>
            </div>
          ) : (
            filteredLicencas.map((lic) => (
              <div
                key={lic.id}
                className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-xs flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Badge className="text-[10px] font-bold bg-indigo-600 text-white mb-1">
                      {lic.tipo}
                    </Badge>
                    <h4 className="font-bold text-xs text-foreground truncate">{lic.nome}</h4>
                    <p className="text-[11px] text-muted-foreground truncate">{lic.fabricante} • {lic.plano}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(lic.valor)}
                    </span>
                    <p className="text-[10px] text-muted-foreground">/mês</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-dashed border-border/60">
                  <span>Assentos: <strong>{lic.quantidadeUsada}/{lic.quantidadeTotal}</strong></span>
                  <span>Renovação: {lic.vencimento ? formatDateBrasilia(lic.vencimento) : 'Sem data'}</span>
                </div>
              </div>
            ))
          )
        )}

        {/* ABA: PATRIMÔNIO */}
        {activeTab === 'patrimonio' && (
          filteredPatrimonio.length === 0 ? (
            <div className="bg-card rounded-2xl border p-8 text-center space-y-3 mt-4">
              <DollarSign className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
              <div className="font-semibold text-sm text-foreground">Nenhum bem patrimonial</div>
              <Button variant="outline" size="sm" onClick={() => setNovoPatrimonioOpen(true)} className="text-xs rounded-xl">
                Cadastrar Bem Patrimonial
              </Button>
            </div>
          ) : (
            filteredPatrimonio.map((pat) => (
              <div
                key={pat.id}
                className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-xs flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-mono text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded font-bold">
                      {pat.numeroPatrimonial}
                    </span>
                    <h4 className="font-bold text-xs text-foreground mt-1 truncate">{pat.categoria}</h4>
                    <p className="text-[11px] text-muted-foreground">{pat.departamento || pat.localizacao}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(pat.valorAtual || pat.valorCompra)}
                    </div>
                    <span className="text-[10px] text-muted-foreground">Original: {formatCurrency(pat.valorCompra)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-dashed text-[11px] text-muted-foreground">
                  <span>Depreciação: <strong>{pat.taxaDepreciacaoAnual}% a.a.</strong></span>
                  <span>Estado: <strong>{pat.estadoConservacao}</strong></span>
                </div>
              </div>
            ))
          )
        )}

        {/* ABA: MOVIMENTAÇÕES */}
        {activeTab === 'movimentacoes' && (
          filteredMovimentacoes.length === 0 ? (
            <div className="bg-card rounded-2xl border p-8 text-center space-y-3 mt-4">
              <History className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
              <div className="font-semibold text-sm text-foreground">Nenhuma movimentação registrada</div>
              <Button variant="outline" size="sm" onClick={() => setNovaMovimentacaoOpen(true)} className="text-xs rounded-xl">
                Registrar Movimentação
              </Button>
            </div>
          ) : (
            filteredMovimentacoes.map((m) => (
              <div
                key={m.id}
                className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-xs flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-[10px] font-bold text-primary border-primary/30 bg-primary/5">
                    {m.tipo}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {m.data ? formatDateBrasilia(m.data) : ''}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-foreground truncate">{m.equipamentoNome || m.estoqueItemNome}</h4>
                <p className="text-[11px] text-muted-foreground">{m.origem} ➔ {m.destino} ({m.responsavelNome})</p>
                {m.observacoes && (
                  <p className="text-muted-foreground bg-muted/40 p-2 rounded-xl text-[10px] mt-1 border">
                    "{m.observacoes}"
                  </p>
                )}
              </div>
            ))
          )
        )}

        {/* ABA: MANUTENÇÕES */}
        {activeTab === 'manutencoes' && (
          filteredManutencoes.length === 0 ? (
            <div className="bg-card rounded-2xl border p-8 text-center space-y-3 mt-4">
              <Wrench className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
              <div className="font-semibold text-sm text-foreground">Nenhuma ordem de manutenção</div>
              <Button variant="outline" size="sm" onClick={() => setNovaManutencaoOpen(true)} className="text-xs rounded-xl">
                Abrir Ordem de Manutenção
              </Button>
            </div>
          ) : (
            filteredManutencoes.map((mn) => (
              <div
                key={mn.id}
                className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-xs flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-[10px] font-bold text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/40">
                    {mn.tipo}
                  </Badge>
                  <Badge className="text-[10px] bg-blue-600 text-white">{mn.status || 'Em Aberto'}</Badge>
                </div>
                <h4 className="font-bold text-xs text-foreground">{mn.equipamentoNome}</h4>
                <p className="text-xs text-muted-foreground">{mn.descricao}</p>
                <div className="flex items-center justify-between pt-2 border-t border-dashed text-[11px]">
                  <span className="text-muted-foreground">{mn.responsavelNome}</span>
                  <span className="font-bold text-rose-600">{formatCurrency(mn.valor)}</span>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* ======================================================== */}
      {/* 4. MODAIS ESPECÍFICOS DE CRIAÇÃO POR SEÇÃO (BOTTOM SHEET) */}
      {/* ======================================================== */}

      {/* MODAL 1: NOVO EQUIPAMENTO */}
      <Sheet open={novoEquipamentoOpen} onOpenChange={setNovoEquipamentoOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto p-5 bg-background border-t border-border flex flex-col">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-3 shrink-0" />
          <SheetHeader className="text-left pb-2">
            <SheetTitle className="flex items-center gap-2 text-base font-bold">
              <Laptop className="w-5 h-5 text-primary" /> Cadastrar Equipamento de TI
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Cadastre notebooks, monitores, servidores, celulares e periféricos com especificações completas.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Código Patrimonial *</Label>
                <Input
                  value={formEq.codigoPatrimonial}
                  onChange={e => setFormEq(f => ({ ...f, codigoPatrimonial: e.target.value }))}
                  className="h-9 text-xs font-mono font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Categoria *</Label>
                <Select value={formEq.categoria} onValueChange={v => setFormEq(f => ({ ...f, categoria: v as any, tipo: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_EQUIPAMENTOS.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Marca</Label>
                <Input
                  placeholder="Ex: Apple, Dell, Lenovo"
                  value={formEq.marca}
                  onChange={e => setFormEq(f => ({ ...f, marca: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Modelo *</Label>
                <Input
                  placeholder="Ex: MacBook Air M2, Latitude 5430"
                  value={formEq.modelo}
                  onChange={e => setFormEq(f => ({ ...f, modelo: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Número de Série (S/N) *</Label>
                <Input
                  placeholder="Ex: C02G1234MD6R"
                  value={formEq.numeroSerie}
                  onChange={e => setFormEq(f => ({ ...f, numeroSerie: e.target.value }))}
                  className="h-9 text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Data de Aquisição</Label>
                <Input
                  type="date"
                  value={formEq.dataAquisicao}
                  onChange={e => setFormEq(f => ({ ...f, dataAquisicao: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Valor Compra (R$)</Label>
                <Input
                  placeholder="8500,00"
                  value={formEq.valorCompra}
                  onChange={e => setFormEq(f => ({ ...f, valorCompra: e.target.value }))}
                  className="h-9 text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Garantia (Meses)</Label>
                <Input
                  type="number"
                  value={formEq.garantiaMeses}
                  onChange={e => setFormEq(f => ({ ...f, garantiaMeses: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Situação</Label>
                <Select value={formEq.situacao} onValueChange={v => setFormEq(f => ({ ...f, situacao: v as any }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Disponível">Disponível</SelectItem>
                    <SelectItem value="Em Uso">Em Uso</SelectItem>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                    <SelectItem value="Baixa">Baixa / Descarte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ESPECIFICAÇÕES DINÂMICAS: NOTEBOOK / DESKTOP */}
            {(formEq.categoria === 'Notebook' || formEq.categoria === 'Desktop') && (
              <div className="border border-blue-500/30 rounded-2xl p-3 space-y-2.5 bg-blue-500/5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5" /> Especificações de Computador
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Processador</Label>
                    <Input
                      placeholder="Ex: Apple M2 / Intel i7"
                      value={formEq.processador}
                      onChange={e => setFormEq(f => ({ ...f, processador: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Memória RAM</Label>
                    <Input
                      placeholder="Ex: 16 GB DDR5"
                      value={formEq.memoriaRam}
                      onChange={e => setFormEq(f => ({ ...f, memoriaRam: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Armazenamento (SSD)</Label>
                    <Input
                      placeholder="Ex: 512 GB SSD NVMe"
                      value={formEq.armazenamento}
                      onChange={e => setFormEq(f => ({ ...f, armazenamento: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Sistema Operacional</Label>
                    <Input
                      placeholder="Ex: macOS Sonoma / Windows 11"
                      value={formEq.sistemaOperacional}
                      onChange={e => setFormEq(f => ({ ...f, sistemaOperacional: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Service Tag</Label>
                    <Input
                      placeholder="Ex: DELL-SERVICE-TAG"
                      value={formEq.serviceTag}
                      onChange={e => setFormEq(f => ({ ...f, serviceTag: e.target.value }))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">MAC Address</Label>
                    <Input
                      placeholder="Ex: 00:1A:2B:3C:4D:5E"
                      value={formEq.macAddress}
                      onChange={e => setFormEq(f => ({ ...f, macAddress: e.target.value }))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ESPECIFICAÇÕES DINÂMICAS: MONITOR */}
            {formEq.categoria === 'Monitor' && (
              <div className="border border-indigo-500/30 rounded-2xl p-3 space-y-2.5 bg-indigo-500/5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Monitor className="h-3.5 w-3.5" /> Especificações de Display / Monitor
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Polegadas (")</Label>
                    <Input
                      placeholder="Ex: 27 Inches"
                      value={formEq.polegadas}
                      onChange={e => setFormEq(f => ({ ...f, polegadas: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Resolução</Label>
                    <Input
                      placeholder="Ex: 2560 x 1440 2K"
                      value={formEq.resolucao}
                      onChange={e => setFormEq(f => ({ ...f, resolucao: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Tipo de Painel</Label>
                    <Input
                      placeholder="Ex: IPS Black / OLED"
                      value={formEq.tipoPainel}
                      onChange={e => setFormEq(f => ({ ...f, tipoPainel: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Conexões</Label>
                    <Input
                      placeholder="HDMI, DisplayPort, Type-C"
                      value={formEq.conexoes}
                      onChange={e => setFormEq(f => ({ ...f, conexoes: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ATRIBUIÇÃO E LOCALIZAÇÃO */}
            <div className="border border-border/60 rounded-2xl p-3 space-y-2.5 bg-muted/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Atribuição e Localização
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Colaborador Responsável</Label>
                  <Input
                    placeholder="Vazio = Estoque TI"
                    value={formEq.colaboradorNome}
                    onChange={e => setFormEq(f => ({ ...f, colaboradorNome: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Departamento / Setor</Label>
                  <Input
                    placeholder="Ex: Engenharia"
                    value={formEq.departamento}
                    onChange={e => setFormEq(f => ({ ...f, departamento: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-semibold">Localização Física</Label>
                <Input
                  placeholder="Ex: Estação ENG-04 / Head Office"
                  value={formEq.localFisica}
                  onChange={e => setFormEq(f => ({ ...f, localFisica: e.target.value }))}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* VINCULAÇÃO FINANCEIRA */}
            <div className="flex items-center justify-between p-3 rounded-2xl border border-primary/20 bg-primary/5">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-foreground">Vincular ao Contas a Pagar</Label>
                <p className="text-[10px] text-muted-foreground">Gera despesa financeira automática no ERP</p>
              </div>
              <Switch
                checked={formEq.gerarDespesaFinanceira}
                onCheckedChange={c => setFormEq(f => ({ ...f, gerarDespesaFinanceira: c }))}
              />
            </div>
          </div>

          <SheetFooter className="gap-2 sm:gap-0 mt-4 flex-row justify-end">
            <Button variant="outline" size="sm" onClick={() => setNovoEquipamentoOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleCreateEquipamento} className="bg-primary text-white font-bold">
              Cadastrar Equipamento
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* MODAL 2: NOVO ITEM NO ESTOQUE */}
      <Sheet open={novoItemEstoqueOpen} onOpenChange={setNovoItemEstoqueOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto p-5 bg-background border-t border-border flex flex-col">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-3 shrink-0" />
          <SheetHeader className="text-left pb-2">
            <SheetTitle className="flex items-center gap-2 text-base font-bold">
              <Package className="w-5 h-5 text-orange-600" /> Novo Item do Escritório
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Cadastre livros, Alexa, televisores, cafeteiras, mobiliário ou outros bens do escritório.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Código *</Label>
                <Input
                  placeholder="ESC-001"
                  value={formEstoque.codigo}
                  onChange={e => setFormEstoque(f => ({ ...f, codigo: e.target.value }))}
                  className="h-9 text-xs font-mono font-bold"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs font-semibold">Título / Nome do Item *</Label>
                <Input
                  placeholder="Ex: Echo Dot, Smart TV 55', Livro Clean Code"
                  value={formEstoque.nome}
                  onChange={e => setFormEstoque(f => ({ ...f, nome: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Descrição / Detalhes</Label>
              <Textarea
                placeholder="Ex: Dispositivo inteligente para reuniões e avisos..."
                value={formEstoque.descricao}
                onChange={e => setFormEstoque(f => ({ ...f, descricao: e.target.value }))}
                rows={2}
                className="text-xs resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Categoria *</Label>
                <Select value={formEstoque.categoria} onValueChange={v => setFormEstoque(f => ({ ...f, categoria: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_ESCRITORIO.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Estado de Conservação *</Label>
                <Select value={formEstoque.estadoConservacao} onValueChange={(v: EstadoConservacaoItem) => setFormEstoque(f => ({ ...f, estadoConservacao: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ESTADOS_CONSERVACAO.map(est => (
                      <SelectItem key={est} value={est}>{est}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Unidades (Qtd) *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formEstoque.quantidade}
                  onChange={e => setFormEstoque(f => ({ ...f, quantidade: e.target.value }))}
                  className="h-9 text-xs font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Qtd. Mínima</Label>
                <Input
                  type="number"
                  min="1"
                  value={formEstoque.quantidadeMinima}
                  onChange={e => setFormEstoque(f => ({ ...f, quantidadeMinima: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Valor Unit. (R$)</Label>
                <Input
                  placeholder="0,00"
                  value={formEstoque.valorUnitario}
                  onChange={e => setFormEstoque(f => ({ ...f, valorUnitario: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Localização / Sala *</Label>
              <div className="space-y-1.5">
                <Input
                  placeholder="Ex: Sala de Reunião Principal, Copa..."
                  value={formEstoque.localizacao}
                  onChange={e => setFormEstoque(f => ({ ...f, localizacao: e.target.value }))}
                  className="h-9 text-xs"
                />
                <Select
                  value=""
                  onValueChange={val => {
                    if (val) setFormEstoque(f => ({ ...f, localizacao: val }));
                  }}
                >
                  <SelectTrigger className="h-8 text-[11px] bg-muted/40">
                    <SelectValue placeholder="Selecionar sala sugerida..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SALAS_LOCAIS_SUGERIDOS.map(sala => (
                      <SelectItem key={sala} value={sala}>{sala}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Responsável / Guardião</Label>
                <Input
                  placeholder="Ex: Equipe de Operações"
                  value={formEstoque.responsavelNome}
                  onChange={e => setFormEstoque(f => ({ ...f, responsavelNome: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Status de Uso</Label>
                <Select value={formEstoque.status} onValueChange={(v: any) => setFormEstoque(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Em Uso">Em Uso</SelectItem>
                    <SelectItem value="Disponível">Disponível</SelectItem>
                    <SelectItem value="Emprestado">Emprestado</SelectItem>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                    <SelectItem value="Baixado">Baixado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <SheetFooter className="gap-2 sm:gap-0 mt-4 flex-row justify-end">
            <Button variant="outline" size="sm" onClick={() => setNovoItemEstoqueOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleCreateEstoqueItem} className="bg-orange-600 hover:bg-orange-700 text-white font-bold">
              Salvar Item do Escritório
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* MODAL 3: NOVA LICENÇA SAAS */}
      <Sheet open={novaLicencaOpen} onOpenChange={setNovaLicencaOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto p-5 bg-background border-t border-border flex flex-col">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-3 shrink-0" />
          <SheetHeader className="text-left pb-2">
            <SheetTitle className="flex items-center gap-2 text-base font-bold">
              <KeyRound className="w-5 h-5 text-indigo-500" /> Nova Licença de Software / SaaS
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Cadastre softwares por assinatura ou licenças perpétuas com controle de centro de custos.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nome do Software / Produto *</Label>
              <Input
                placeholder="Ex: Canva Premium, Microsoft 365, Figma"
                value={formLicenca.nome}
                onChange={e => setFormLicenca(f => ({ ...f, nome: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Fabricante / Fornecedor *</Label>
                <Input
                  placeholder="Ex: Canva, Microsoft, Adobe"
                  value={formLicenca.fabricante}
                  onChange={e => setFormLicenca(f => ({ ...f, fabricante: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Plano / Tier</Label>
                <Input
                  placeholder="Ex: Enterprise, Pro Anual"
                  value={formLicenca.plano}
                  onChange={e => setFormLicenca(f => ({ ...f, plano: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tipo</Label>
                <Select value={formLicenca.tipo} onValueChange={v => setFormLicenca(f => ({ ...f, tipo: v as any }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Assinatura">Assinatura</SelectItem>
                    <SelectItem value="Perpétua">Perpétua</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Assentos Totais</Label>
                <Input
                  type="number"
                  min="1"
                  value={formLicenca.quantidadeTotal}
                  onChange={e => setFormLicenca(f => ({ ...f, quantidadeTotal: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Valor (R$) *</Label>
                <Input
                  placeholder="35,00"
                  value={formLicenca.valor}
                  onChange={e => setFormLicenca(f => ({ ...f, valor: e.target.value }))}
                  className="h-9 text-xs font-bold text-orange-600"
                />
              </div>
            </div>

            {/* CENTRO DE CUSTO E CATEGORIA FINANCEIRA */}
            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl border bg-muted/30">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold flex items-center gap-1 text-foreground">
                  <Building2 className="w-3 h-3 text-primary" /> Centro de Custo *
                </Label>
                <Select
                  value={formLicenca.centroCustoId || formLicenca.centroCustoNome}
                  onValueChange={val => {
                    const matched = centrosCusto.find(c => c.id === val || c.nome === val);
                    setFormLicenca(f => ({
                      ...f,
                      centroCustoId: matched ? matched.id : val,
                      centroCustoNome: matched ? matched.nome : val,
                    }));
                  }}
                >
                  <SelectTrigger className="h-8 text-xs bg-card"><SelectValue placeholder="Centro de custo" /></SelectTrigger>
                  <SelectContent>
                    {centrosCusto.map(cc => (
                      <SelectItem key={cc.id} value={cc.id}>{cc.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold flex items-center gap-1 text-foreground">
                  <Tag className="w-3 h-3 text-primary" /> Categoria *
                </Label>
                <Select
                  value={formLicenca.categoriaFinanceira}
                  onValueChange={val => setFormLicenca(f => ({ ...f, categoriaFinanceira: val }))}
                >
                  <SelectTrigger className="h-8 text-xs bg-card"><SelectValue placeholder="Categoria" /></SelectTrigger>
                  <SelectContent>
                    {categoriasDespesa.map(cat => (
                      <SelectItem key={cat.id} value={cat.nome}>{cat.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Data Contratação</Label>
                <Input
                  type="date"
                  value={formLicenca.dataCompra}
                  onChange={e => setFormLicenca(f => ({ ...f, dataCompra: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Data Vencimento *</Label>
                <Input
                  type="date"
                  value={formLicenca.vencimento}
                  onChange={e => setFormLicenca(f => ({ ...f, vencimento: e.target.value }))}
                  className="h-9 text-xs font-bold text-orange-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Responsável / Guardião</Label>
              <Input
                placeholder="Ex: Equipe de TI & Marketing"
                value={formLicenca.responsavelNome}
                onChange={e => setFormLicenca(f => ({ ...f, responsavelNome: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between p-2.5 rounded-2xl border bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold">Lançar no Contas a Pagar</Label>
                  <p className="text-[10px] text-muted-foreground">Cria despesa financeira automática</p>
                </div>
                <Switch
                  checked={formLicenca.gerarContaPagar}
                  onCheckedChange={c => setFormLicenca(f => ({ ...f, gerarContaPagar: c }))}
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-2xl border bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold">Faturar para Cliente</Label>
                  <p className="text-[10px] text-muted-foreground">Repassar custo via Contas a Receber</p>
                </div>
                <Switch
                  checked={formLicenca.gerarContaReceber}
                  onCheckedChange={c => setFormLicenca(f => ({ ...f, gerarContaReceber: c }))}
                />
              </div>

              {formLicenca.gerarContaReceber && (
                <div className="space-y-1 pt-1">
                  <Label className="text-xs font-semibold">Cliente Destino *</Label>
                  <Select
                    value={formLicenca.clienteNome}
                    onValueChange={val => setFormLicenca(f => ({ ...f, clienteNome: val }))}
                  >
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                    <SelectContent>
                      {clientes.map((cli: any) => (
                        <SelectItem key={cli.id} value={cli.nomeFantasia || cli.razaoSocial || cli.nome}>
                          {cli.nomeFantasia || cli.razaoSocial || cli.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <SheetFooter className="gap-2 sm:gap-0 mt-4 flex-row justify-end">
            <Button variant="outline" size="sm" onClick={() => setNovaLicencaOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleCreateLicenca} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
              Salvar Licença
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* MODAL 4: NOVO BEM PATRIMONIAL */}
      <Sheet open={novoPatrimonioOpen} onOpenChange={setNovoPatrimonioOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto p-5 bg-background border-t border-border flex flex-col">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-3 shrink-0" />
          <SheetHeader className="text-left pb-2">
            <SheetTitle className="flex items-center gap-2 text-base font-bold">
              <DollarSign className="w-5 h-5 text-emerald-500" /> Cadastrar Bem Patrimonial
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Cadastre mobiliário, máquinas, instalações e ativos de longo prazo com depreciação contábil.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Placa Patrimonial *</Label>
                <Input
                  value={formPatrimonio.numeroPatrimonial}
                  onChange={e => setFormPatrimonio(f => ({ ...f, numeroPatrimonial: e.target.value }))}
                  className="h-9 text-xs font-mono font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Código Interno</Label>
                <Input
                  value={formPatrimonio.codigoInterno}
                  onChange={e => setFormPatrimonio(f => ({ ...f, codigoInterno: e.target.value }))}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Categoria *</Label>
                <Select value={formPatrimonio.categoria} onValueChange={v => setFormPatrimonio(f => ({ ...f, categoria: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_PATRIMONIO.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Conservação</Label>
                <Select value={formPatrimonio.estadoConservacao} onValueChange={(v: any) => setFormPatrimonio(f => ({ ...f, estadoConservacao: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Novo">Novo</SelectItem>
                    <SelectItem value="Bom">Bom</SelectItem>
                    <SelectItem value="Regular">Regular</SelectItem>
                    <SelectItem value="Ruim">Ruim</SelectItem>
                    <SelectItem value="Obsoleto">Obsoleto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Valor Compra (R$)*</Label>
                <Input
                  placeholder="2800,00"
                  value={formPatrimonio.valorCompra}
                  onChange={e => setFormPatrimonio(f => ({ ...f, valorCompra: e.target.value }))}
                  className="h-9 text-xs font-bold text-emerald-600"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Depreciação (%)</Label>
                <Input
                  placeholder="10"
                  value={formPatrimonio.taxaDepreciacaoAnual}
                  onChange={e => setFormPatrimonio(f => ({ ...f, taxaDepreciacaoAnual: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Vida Útil (Anos)</Label>
                <Input
                  placeholder="10"
                  value={formPatrimonio.vidaUtilAnos}
                  onChange={e => setFormPatrimonio(f => ({ ...f, vidaUtilAnos: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Centro de Custo</Label>
                <Select
                  value={formPatrimonio.centroCustoId || formPatrimonio.centroCustoNome}
                  onValueChange={val => {
                    const matched = centrosCusto.find(c => c.id === val || c.nome === val);
                    setFormPatrimonio(f => ({
                      ...f,
                      centroCustoId: matched ? matched.id : val,
                      centroCustoNome: matched ? matched.nome : val,
                    }));
                  }}
                >
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Centro de Custo" /></SelectTrigger>
                  <SelectContent>
                    {centrosCusto.map(cc => (
                      <SelectItem key={cc.id} value={cc.id}>{cc.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Situação Contábil</Label>
                <Select value={formPatrimonio.situacao} onValueChange={(v: any) => setFormPatrimonio(f => ({ ...f, situacao: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Baixado">Baixado</SelectItem>
                    <SelectItem value="Descarte">Descarte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Responsável</Label>
                <Input
                  placeholder="Ex: Gestor Administrativo"
                  value={formPatrimonio.responsavel}
                  onChange={e => setFormPatrimonio(f => ({ ...f, responsavel: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Departamento</Label>
                <Input
                  placeholder="Ex: Operações"
                  value={formPatrimonio.departamento}
                  onChange={e => setFormPatrimonio(f => ({ ...f, departamento: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Localização Física</Label>
              <Input
                placeholder="Ex: São Paulo - Sede (Sala de Reunião)"
                value={formPatrimonio.localizacao}
                onChange={e => setFormPatrimonio(f => ({ ...f, localizacao: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <SheetFooter className="gap-2 sm:gap-0 mt-4 flex-row justify-end">
            <Button variant="outline" size="sm" onClick={() => setNovoPatrimonioOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleCreatePatrimonio} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              Cadastrar Patrimônio
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* MODAL 5: NOVA MOVIMENTAÇÃO / TRANSFERÊNCIA */}
      <Sheet open={novaMovimentacaoOpen} onOpenChange={setNovaMovimentacaoOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto p-5 bg-background border-t border-border flex flex-col">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-3 shrink-0" />
          <SheetHeader className="text-left pb-2">
            <SheetTitle className="flex items-center gap-2 text-base font-bold">
              <History className="w-5 h-5 text-primary" /> Registrar Movimentação de Ativo
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Registre transferências, atribuições, devoluções, trocas de local ou baixas.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Tipo de Movimentação *</Label>
              <Select value={formMov.tipo} onValueChange={v => setFormMov(f => ({ ...f, tipo: v as any }))}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Transferência">Transferência</SelectItem>
                  <SelectItem value="Atribuição">Atribuição / Entrega ao Colaborador</SelectItem>
                  <SelectItem value="Devolução">Devolução ao Almoxarifado</SelectItem>
                  <SelectItem value="Entrada">Entrada</SelectItem>
                  <SelectItem value="Saída">Saída</SelectItem>
                  <SelectItem value="Manutenção">Envio para Manutenção</SelectItem>
                  <SelectItem value="Alteração Responsável">Alteração de Responsável</SelectItem>
                  <SelectItem value="Alteração Local">Alteração de Local</SelectItem>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                  <SelectItem value="Descarte">Descarte</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Equipamento de TI (Opcional se for item de estoque)</Label>
              <Select
                value={formMov.equipamentoId}
                onValueChange={v => setFormMov(f => ({ ...f, equipamentoId: v, estoqueItemId: '' }))}
              >
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione o equipamento" /></SelectTrigger>
                <SelectContent>
                  {equipamentos.map(eq => (
                    <SelectItem key={eq.id} value={eq.id}>
                      {eq.codigoPatrimonial} - {eq.marca} {eq.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Item de Almoxarifado / Estoque (Opcional)</Label>
              <Select
                value={formMov.estoqueItemId}
                onValueChange={v => setFormMov(f => ({ ...f, estoqueItemId: v, equipamentoId: '' }))}
              >
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione o item do escritório" /></SelectTrigger>
                <SelectContent>
                  {estoqueItens.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.codigo} - {item.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Origem</Label>
                <Input
                  placeholder="Ex: Estoque Central TI"
                  value={formMov.origem}
                  onChange={e => setFormMov(f => ({ ...f, origem: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Destino</Label>
                <Input
                  placeholder="Ex: Estação de Trabalho"
                  value={formMov.destino}
                  onChange={e => setFormMov(f => ({ ...f, destino: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Responsável / Usuário *</Label>
                <Input
                  placeholder="Nome do colaborador"
                  value={formMov.responsavelNome}
                  onChange={e => setFormMov(f => ({ ...f, responsavelNome: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Departamento</Label>
                <Input
                  placeholder="Ex: Engenharia"
                  value={formMov.departamento}
                  onChange={e => setFormMov(f => ({ ...f, departamento: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Observações / Motivo</Label>
              <Textarea
                placeholder="Motivo ou termo de custódia..."
                value={formMov.observacoes}
                onChange={e => setFormMov(f => ({ ...f, observacoes: e.target.value }))}
                rows={2}
                className="text-xs resize-none"
              />
            </div>
          </div>

          <SheetFooter className="gap-2 sm:gap-0 mt-4 flex-row justify-end">
            <Button variant="outline" size="sm" onClick={() => setNovaMovimentacaoOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleCreateMovimentacao} className="bg-primary text-white font-bold">
              Registrar Movimentação
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* MODAL 6: NOVA MANUTENÇÃO GERAL */}
      <Sheet open={novaManutencaoOpen} onOpenChange={setNovaManutencaoOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto p-5 bg-background border-t border-border flex flex-col">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-3 shrink-0" />
          <SheetHeader className="text-left pb-2">
            <SheetTitle className="flex items-center gap-2 text-base font-bold">
              <Wrench className="w-5 h-5 text-amber-500" /> Abrir Ordem de Manutenção
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Abra chamados para conserto, reparo, limpeza e upgrades com integração contábil e financeira.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Equipamento *</Label>
              <Select value={formManutGeral.equipamentoId} onValueChange={v => setFormManutGeral(f => ({ ...f, equipamentoId: v }))}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione o equipamento" /></SelectTrigger>
                <SelectContent>
                  {equipamentos.map(eq => (
                    <SelectItem key={eq.id} value={eq.id}>
                      {eq.codigoPatrimonial} - {eq.marca} {eq.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tipo de Serviço</Label>
                <Select value={formManutGeral.tipo} onValueChange={v => setFormManutGeral(f => ({ ...f, tipo: v as any }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Preventiva">Preventiva</SelectItem>
                    <SelectItem value="Corretiva">Corretiva</SelectItem>
                    <SelectItem value="Upgrade">Upgrade</SelectItem>
                    <SelectItem value="Troca">Troca de Peças</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Custo Estimado (R$) *</Label>
                <Input
                  placeholder="250,00"
                  value={formManutGeral.valor}
                  onChange={e => setFormManutGeral(f => ({ ...f, valor: e.target.value }))}
                  className="h-9 text-xs font-bold text-rose-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Descrição do Problema / Serviço *</Label>
              <Textarea
                placeholder="Ex: Troca de teclado e limpeza preventiva..."
                value={formManutGeral.descricao}
                onChange={e => setFormManutGeral(f => ({ ...f, descricao: e.target.value }))}
                rows={2}
                className="text-xs resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Assistência / Prestador</Label>
                <Input
                  placeholder="Ex: Assistência Técnica Especializada"
                  value={formManutGeral.prestador}
                  onChange={e => setFormManutGeral(f => ({ ...f, prestador: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Técnico / Responsável</Label>
                <Input
                  placeholder="Ex: Suporte Interno"
                  value={formManutGeral.responsavel}
                  onChange={e => setFormManutGeral(f => ({ ...f, responsavel: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* CENTRO DE CUSTO E CATEGORIA */}
            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl border bg-muted/30">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold flex items-center gap-1 text-foreground">
                  <Building2 className="w-3 h-3 text-primary" /> Centro de Custo
                </Label>
                <Select
                  value={formManutGeral.centroCustoId || formManutGeral.centroCustoNome}
                  onValueChange={val => {
                    const matched = centrosCusto.find(c => c.id === val || c.nome === val);
                    setFormManutGeral(f => ({
                      ...f,
                      centroCustoId: matched ? matched.id : val,
                      centroCustoNome: matched ? matched.nome : val,
                    }));
                  }}
                >
                  <SelectTrigger className="h-8 text-xs bg-card"><SelectValue placeholder="Centro de Custo" /></SelectTrigger>
                  <SelectContent>
                    {centrosCusto.map(cc => (
                      <SelectItem key={cc.id} value={cc.id}>{cc.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold flex items-center gap-1 text-foreground">
                  <Tag className="w-3 h-3 text-primary" /> Categoria
                </Label>
                <Select
                  value={formManutGeral.categoriaFinanceira}
                  onValueChange={val => setFormManutGeral(f => ({ ...f, categoriaFinanceira: val }))}
                >
                  <SelectTrigger className="h-8 text-xs bg-card"><SelectValue placeholder="Categoria" /></SelectTrigger>
                  <SelectContent>
                    {categoriasDespesa.map(cat => (
                      <SelectItem key={cat.id} value={cat.nome}>{cat.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Data de Vencimento da Fatura</Label>
              <Input
                type="date"
                value={formManutGeral.vencimento}
                onChange={e => setFormManutGeral(f => ({ ...f, vencimento: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between p-2.5 rounded-2xl border bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold">Lançar no Contas a Pagar</Label>
                  <p className="text-[10px] text-muted-foreground">Cria despesa financeira automática</p>
                </div>
                <Switch
                  checked={formManutGeral.gerarContaPagar}
                  onCheckedChange={c => setFormManutGeral(f => ({ ...f, gerarContaPagar: c }))}
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-2xl border bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold">Faturar para Cliente</Label>
                  <p className="text-[10px] text-muted-foreground">Faturamento gerado no Contas a Receber</p>
                </div>
                <Switch
                  checked={formManutGeral.gerarContaReceber}
                  onCheckedChange={c => setFormManutGeral(f => ({ ...f, gerarContaReceber: c }))}
                />
              </div>

              {formManutGeral.gerarContaReceber && (
                <div className="space-y-1 pt-1">
                  <Label className="text-xs font-semibold">Cliente *</Label>
                  <Select
                    value={formManutGeral.clienteNome}
                    onValueChange={val => setFormManutGeral(f => ({ ...f, clienteNome: val }))}
                  >
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                    <SelectContent>
                      {clientes.map((cli: any) => (
                        <SelectItem key={cli.id} value={cli.nomeFantasia || cli.razaoSocial || cli.nome}>
                          {cli.nomeFantasia || cli.razaoSocial || cli.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <SheetFooter className="gap-2 sm:gap-0 mt-4 flex-row justify-end">
            <Button variant="outline" size="sm" onClick={() => setNovaManutencaoOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleCreateManutencaoGeral} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              Criar Ordem de Manutenção
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* MODAL 4: NOVO BEM PATRIMONIAL */}
      <Sheet open={novoPatrimonioOpen} onOpenChange={setNovoPatrimonioOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto p-5 bg-background border-t border-border flex flex-col">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-3 shrink-0" />
          <SheetHeader className="text-left pb-2">
            <SheetTitle className="flex items-center gap-2 text-base font-bold">
              <DollarSign className="w-5 h-5 text-emerald-500" /> Cadastrar Bem Patrimonial
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Cadastre mobiliário, máquinas, instalações e ativos de longo prazo.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Placa Patrimonial *</Label>
                <Input
                  value={formPatrimonio.numeroPatrimonial}
                  onChange={e => setFormPatrimonio(f => ({ ...f, numeroPatrimonial: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Categoria</Label>
                <Select value={formPatrimonio.categoria} onValueChange={v => setFormPatrimonio(f => ({ ...f, categoria: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mobiliário Corporativo">Mobiliário Corporativo</SelectItem>
                    <SelectItem value="Equipamentos de TI">Equipamentos de TI</SelectItem>
                    <SelectItem value="Máquinas & Climatização">Máquinas & Climatização</SelectItem>
                    <SelectItem value="Veículos">Veículos</SelectItem>
                    <SelectItem value="Instalações & Benfeitorias">Instalações</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Valor Aquisição (R$)</Label>
                <Input
                  placeholder="2.800,00"
                  value={formPatrimonio.valorCompra}
                  onChange={e => setFormPatrimonio(f => ({ ...f, valorCompra: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Depreciação Anual (%)</Label>
                <Input
                  placeholder="10"
                  value={formPatrimonio.taxaDepreciacaoAnual}
                  onChange={e => setFormPatrimonio(f => ({ ...f, taxaDepreciacaoAnual: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Responsável</Label>
                <Input
                  placeholder="Ex: Gestor Administrativo"
                  value={formPatrimonio.responsavel}
                  onChange={e => setFormPatrimonio(f => ({ ...f, responsavel: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Departamento</Label>
                <Input
                  placeholder="Ex: Operações"
                  value={formPatrimonio.departamento}
                  onChange={e => setFormPatrimonio(f => ({ ...f, departamento: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Localização Física</Label>
              <Input
                placeholder="Ex: São Paulo - Sede (Sala de Reunião)"
                value={formPatrimonio.localizacao}
                onChange={e => setFormPatrimonio(f => ({ ...f, localizacao: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <SheetFooter className="gap-2 sm:gap-0 mt-4 flex-row justify-end">
            <Button variant="outline" size="sm" onClick={() => setNovoPatrimonioOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleCreatePatrimonio} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              Cadastrar Patrimônio
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* MODAL 5: NOVA MOVIMENTAÇÃO / TRANSFERÊNCIA */}
      <Sheet open={novaMovimentacaoOpen} onOpenChange={setNovaMovimentacaoOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto p-5 bg-background border-t border-border flex flex-col">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-3 shrink-0" />
          <SheetHeader className="text-left pb-2">
            <SheetTitle className="flex items-center gap-2 text-base font-bold">
              <History className="w-5 h-5 text-primary" /> Registrar Movimentação de Ativo
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Registre transferências, empréstimos, devoluções e termos de custódia.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Tipo de Movimentação *</Label>
              <Select value={formMov.tipo} onValueChange={v => setFormMov(f => ({ ...f, tipo: v as any }))}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Atribuição">Atribuição / Entrega ao Colaborador</SelectItem>
                  <SelectItem value="Transferência">Transferência de Setor / Localidade</SelectItem>
                  <SelectItem value="Devolução">Devolução ao Almoxarifado</SelectItem>
                  <SelectItem value="Manutenção">Envio para Manutenção</SelectItem>
                  <SelectItem value="Descarte">Baixa / Descarte Definitivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Equipamento / Ativo *</Label>
              <Select value={formMov.equipamentoId} onValueChange={v => setFormMov(f => ({ ...f, equipamentoId: v }))}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione o equipamento" /></SelectTrigger>
                <SelectContent>
                  {equipamentos.map(eq => (
                    <SelectItem key={eq.id} value={eq.id}>
                      {eq.codigoPatrimonial} - {eq.marca} {eq.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Responsável Destino *</Label>
                <Input
                  placeholder="Nome do colaborador"
                  value={formMov.responsavelNome}
                  onChange={e => setFormMov(f => ({ ...f, responsavelNome: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Departamento</Label>
                <Input
                  placeholder="Ex: Engenharia"
                  value={formMov.departamento}
                  onChange={e => setFormMov(f => ({ ...f, departamento: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Observações / Motivo</Label>
              <Textarea
                placeholder="Ex: Entrega de notebook corporativo para onboarding..."
                value={formMov.observacoes}
                onChange={e => setFormMov(f => ({ ...f, observacoes: e.target.value }))}
                rows={2}
                className="text-xs"
              />
            </div>
          </div>

          <SheetFooter className="gap-2 sm:gap-0 mt-4 flex-row justify-end">
            <Button variant="outline" size="sm" onClick={() => setNovaMovimentacaoOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleCreateMovimentacao} className="bg-primary text-white font-bold">
              Registrar Movimentação
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* MODAL 6: NOVA MANUTENÇÃO GERAL */}
      <Sheet open={novaManutencaoOpen} onOpenChange={setNovaManutencaoOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto p-5 bg-background border-t border-border flex flex-col">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-3 shrink-0" />
          <SheetHeader className="text-left pb-2">
            <SheetTitle className="flex items-center gap-2 text-base font-bold">
              <Wrench className="w-5 h-5 text-amber-500" /> Abrir Ordem de Manutenção
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Abra chamados para conserto, reparo, limpeza e upgrades de equipamentos.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Equipamento *</Label>
              <Select value={formManutGeral.equipamentoId} onValueChange={v => setFormManutGeral(f => ({ ...f, equipamentoId: v }))}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione o equipamento" /></SelectTrigger>
                <SelectContent>
                  {equipamentos.map(eq => (
                    <SelectItem key={eq.id} value={eq.id}>
                      {eq.codigoPatrimonial} - {eq.marca} {eq.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tipo</Label>
                <Select value={formManutGeral.tipo} onValueChange={v => setFormManutGeral(f => ({ ...f, tipo: v as any }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Preventiva">Preventiva</SelectItem>
                    <SelectItem value="Corretiva">Corretiva</SelectItem>
                    <SelectItem value="Upgrade">Upgrade</SelectItem>
                    <SelectItem value="Troca">Troca de Peças</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Custo Estimado (R$)</Label>
                <Input
                  placeholder="350,00"
                  value={formManutGeral.valor}
                  onChange={e => setFormManutGeral(f => ({ ...f, valor: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Descrição do Problema / Serviço *</Label>
              <Textarea
                placeholder="Ex: Troca de tela danificada e limpeza interna..."
                value={formManutGeral.descricao}
                onChange={e => setFormManutGeral(f => ({ ...f, descricao: e.target.value }))}
                rows={2}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Assistência / Técnico Responsável</Label>
              <Input
                placeholder="Ex: Dell Care / Autorizada Apple"
                value={formManutGeral.responsavel}
                onChange={e => setFormManutGeral(f => ({ ...f, responsavel: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <SheetFooter className="gap-2 sm:gap-0 mt-4 flex-row justify-end">
            <Button variant="outline" size="sm" onClick={() => setNovaManutencaoOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleCreateManutencaoGeral} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              Criar Ordem de Manutenção
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* MODAL AUXILIAR: TRANSFERÊNCIA DIRETA EM ITEM */}
      <Sheet open={transferirModalOpen} onOpenChange={setTransferirModalOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto p-5 bg-background border-t border-border flex flex-col">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-3 shrink-0" />
          <SheetHeader className="text-left pb-2">
            <SheetTitle className="flex items-center gap-2 text-base font-bold">
              <ArrowRightLeft className="w-5 h-5 text-primary" /> Transferir Equipamento
            </SheetTitle>
          </SheetHeader>

          {selectedEquipamento && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-2.5 bg-muted/40 rounded-xl border">
                <span className="font-bold text-foreground">{selectedEquipamento.marca} {selectedEquipamento.modelo}</span>
                <p className="text-muted-foreground text-[11px]">Patrimônio: {selectedEquipamento.codigoPatrimonial}</p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Novo Responsável *</Label>
                <Input
                  placeholder="Ex: Beatriz Santos"
                  value={formTransfer.novoResponsavel}
                  onChange={e => setFormTransfer(f => ({ ...f, novoResponsavel: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Novo Departamento</Label>
                  <Input
                    placeholder="Ex: Marketing"
                    value={formTransfer.novoDepartamento}
                    onChange={e => setFormTransfer(f => ({ ...f, novoDepartamento: e.target.value }))}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Nova Localização</Label>
                  <Input
                    placeholder="Ex: Rio de Janeiro"
                    value={formTransfer.novaLocalizacao}
                    onChange={e => setFormTransfer(f => ({ ...f, novaLocalizacao: e.target.value }))}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Observações</Label>
                <Textarea
                  placeholder="Motivo da transferência..."
                  value={formTransfer.observacao}
                  onChange={e => setFormTransfer(f => ({ ...f, observacao: e.target.value }))}
                  rows={2}
                  className="text-xs"
                />
              </div>
            </div>
          )}

          <SheetFooter className="gap-2 sm:gap-0 mt-4 flex-row justify-end">
            <Button variant="outline" size="sm" onClick={() => setTransferirModalOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleExecuteTransfer} className="bg-primary text-white font-bold">
              Confirmar Transferência
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* MODAL AUXILIAR: MANUTENÇÃO DIRETA EM ITEM */}
      <Sheet open={manutencaoModalOpen} onOpenChange={setManutencaoModalOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto p-5 bg-background border-t border-border flex flex-col">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-3 shrink-0" />
          <SheetHeader className="text-left pb-2">
            <SheetTitle className="flex items-center gap-2 text-base font-bold">
              <Wrench className="w-5 h-5 text-amber-500" /> Abrir Manutenção
            </SheetTitle>
          </SheetHeader>

          {selectedEquipamento && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-2.5 bg-muted/40 rounded-xl border">
                <span className="font-bold text-foreground">{selectedEquipamento.marca} {selectedEquipamento.modelo}</span>
                <p className="text-muted-foreground text-[11px]">Patrimônio: {selectedEquipamento.codigoPatrimonial}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Tipo</Label>
                  <Select value={formManut.tipo} onValueChange={v => setFormManut(f => ({ ...f, tipo: v as any }))}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Preventiva">Preventiva</SelectItem>
                      <SelectItem value="Corretiva">Corretiva</SelectItem>
                      <SelectItem value="Upgrade">Upgrade</SelectItem>
                      <SelectItem value="Troca">Troca</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Custo Estimado (R$)</Label>
                  <Input
                    placeholder="Ex: 450,00"
                    value={formManut.valor}
                    onChange={e => setFormManut(f => ({ ...f, valor: e.target.value }))}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Descrição do Problema *</Label>
                <Textarea
                  placeholder="Ex: Troca de teclado e limpeza preventiva..."
                  value={formManut.descricao}
                  onChange={e => setFormManut(f => ({ ...f, descricao: e.target.value }))}
                  rows={2}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Assistência / Prestador</Label>
                <Input
                  placeholder="Ex: Dell Care / Tech Support"
                  value={formManut.responsavel}
                  onChange={e => setFormManut(f => ({ ...f, responsavel: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          )}

          <SheetFooter className="gap-2 sm:gap-0 mt-4 flex-row justify-end">
            <Button variant="outline" size="sm" onClick={() => setManutencaoModalOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleExecuteManutencao} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              Abrir Manutenção
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* MODAL AUXILIAR: AJUSTE DE ESTOQUE EM ITEM */}
      <Sheet open={ajusteEstoqueModalOpen} onOpenChange={setAjusteEstoqueModalOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto p-5 bg-background border-t border-border flex flex-col">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-3 shrink-0" />
          <SheetHeader className="text-left pb-2">
            <SheetTitle className="flex items-center gap-2 text-base font-bold">
              <ArrowRightLeft className="w-5 h-5 text-primary" /> Movimentar Estoque
            </SheetTitle>
          </SheetHeader>

          {selectedEstoqueItem && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-2.5 bg-muted/40 rounded-xl border">
                <span className="font-bold text-foreground">{selectedEstoqueItem.nome}</span>
                <p className="text-muted-foreground text-[11px]">Estoque Atual: {selectedEstoqueItem.quantidade} un.</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Operação</Label>
                  <Select value={formAjusteEstoque.tipoOperacao} onValueChange={v => setFormAjusteEstoque(f => ({ ...f, tipoOperacao: v as any }))}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Entrada">Entrada (Compra/Reposição)</SelectItem>
                      <SelectItem value="Saída">Saída (Consumo/Uso)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Quantidade</Label>
                  <Input
                    type="number"
                    value={formAjusteEstoque.quantidade}
                    onChange={e => setFormAjusteEstoque(f => ({ ...f, quantidade: e.target.value }))}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Motivo</Label>
                <Input
                  placeholder="Ex: Entrega para novos colaboradores"
                  value={formAjusteEstoque.motivo}
                  onChange={e => setFormAjusteEstoque(f => ({ ...f, motivo: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          )}

          <SheetFooter className="gap-2 sm:gap-0 mt-4 flex-row justify-end">
            <Button variant="outline" size="sm" onClick={() => setAjusteEstoqueModalOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleExecuteAjusteEstoque} className="bg-primary text-white font-bold">
              Confirmar Movimentação
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Relatórios Modal */}
      <RelatoriosModal open={relatoriosModalOpen} onOpenChange={setRelatoriosModalOpen} />
    </div>
  );
}
