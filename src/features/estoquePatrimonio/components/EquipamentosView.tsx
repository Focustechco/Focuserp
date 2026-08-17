import React, { useState } from 'react';
import {
  Laptop,
  Plus,
  Search,
  Filter,
  User,
  Building2,
  Calendar,
  DollarSign,
  ShieldCheck,
  Clock,
  History,
  ArrowRightLeft,
  Wrench,
  Trash2,
  Cpu,
  HardDrive,
  Monitor,
  Smartphone,
  Server,
  Network,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useEstoquePatrimonio } from '../hooks/useEstoquePatrimonio';
import { Equipamento, CategoriaEquipamento, SituacaoEquipamento } from '../types';

const CATEGORIAS_LISTA: CategoriaEquipamento[] = [
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

export function EquipamentosView() {
  const {
    equipamentos,
    registrarNovoEquipamento,
    transferirEquipamento,
    deleteEquipamento,
    abrirManutencao,
  } = useEstoquePatrimonio();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todos');
  const [situacaoFilter, setSituacaoFilter] = useState<string>('todos');

  // Modals
  const [isNovoModalOpen, setIsNovoModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [isManutencaoModalOpen, setIsManutencaoModalOpen] = useState(false);

  const [selectedEquipamento, setSelectedEquipamento] = useState<Equipamento | null>(null);

  // Form State: Novo Equipamento
  const [novoForm, setNovoForm] = useState({
    codigoPatrimonial: `PAT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    categoria: 'Notebook' as CategoriaEquipamento,
    marca: 'Apple',
    modelo: 'MacBook Air M2',
    numeroSerie: '',
    dataAquisicao: new Date().toISOString().split('T')[0],
    valorCompra: 8500,
    garantiaMeses: 24,
    situacao: 'Disponvel' as SituacaoEquipamento,
    departamento: 'Engenharia de Software',
    colaboradorNome: '',
    localFisica: 'Estoque Central TI',
    observacoes: '',
    gerarDespesaFinanceira: false,

    // Dynamic Notebook Specs
    processador: 'Apple M2',
    memoriaRam: '16 GB',
    armazenamento: '512 GB SSD',
    sistemaOperacional: 'macOS',
    nomeEquipamento: '',
    serviceTag: '',
    macAddress: '',
    fabricante: '',

    // Dynamic Monitor Specs
    polegadas: '27"',
    resolucao: '2560 x 1440 (QHD)',
    tipoPainel: 'IPS',
    conexoes: 'HDMI, DisplayPort, USB-C',
  });

  // Form State: Transferncia
  const [transfForm, setTransfForm] = useState({
    novoResponsavel: '',
    novoDepartamento: 'Engenharia de Software',
    novaLocalizacao: 'Estao de Trabalho / Home Office',
    observacao: 'Troca de responsvel de equipamento.',
  });

  // Form State: Manuteno
  const [manutForm, setManutForm] = useState({
    tipo: 'Preventiva' as 'Preventiva' | 'Corretiva' | 'Upgrade' | 'Troca',
    descricao: 'Limpeza fsica interna e substituio de pasta trmica.',
    valor: 150,
    responsavel: 'Suporte Interno TI',
  });

  const filteredEquipamentos = equipamentos.filter((eq) => {
    if (!eq) return false;
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      (eq.codigoPatrimonial || '').toLowerCase().includes(search) ||
      (eq.marca || '').toLowerCase().includes(search) ||
      (eq.modelo || '').toLowerCase().includes(search) ||
      (eq.numeroSerie || '').toLowerCase().includes(search) ||
      (eq.colaboradorNome || '').toLowerCase().includes(search);
    const matchesCat = categoriaFilter === 'todos' || eq.categoria === categoriaFilter;
    const matchesSit = situacaoFilter === 'todos' || eq.situacao === situacaoFilter;
    return matchesSearch && matchesCat && matchesSit;
  });

  const handleCreateEquipamento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoForm.codigoPatrimonial || !novoForm.marca || !novoForm.modelo) return;

    const notebookSpecs =
      novoForm.categoria === 'Notebook'
        ? {
            processador: novoForm.processador,
            memoriaRam: novoForm.memoriaRam,
            armazenamento: novoForm.armazenamento,
            sistemaOperacional: novoForm.sistemaOperacional,
            nomeEquipamento: novoForm.nomeEquipamento,
            serviceTag: novoForm.serviceTag,
            macAddress: novoForm.macAddress,
            fabricante: novoForm.fabricante || novoForm.marca,
          }
        : undefined;

    const monitorSpecs =
      novoForm.categoria === 'Monitor'
        ? {
            polegadas: novoForm.polegadas,
            resolucao: novoForm.resolucao,
            tipoPainel: novoForm.tipoPainel,
            conexoes: novoForm.conexoes.split(',').map((c) => c.trim()),
          }
        : undefined;

    registrarNovoEquipamento(
      {
        codigoPatrimonial: novoForm.codigoPatrimonial,
        categoria: novoForm.categoria,
        marca: novoForm.marca,
        modelo: novoForm.modelo,
        numeroSerie: novoForm.numeroSerie || 'SN-' + Date.now(),
        dataAquisicao: novoForm.dataAquisicao,
        valorCompra: Number(novoForm.valorCompra),
        garantiaMeses: Number(novoForm.garantiaMeses),
        situacao: novoForm.colaboradorNome ? 'Em Uso' : novoForm.situacao,
        departamento: novoForm.departamento,
        colaboradorNome: novoForm.colaboradorNome,
        localFisica: novoForm.localFisica,
        observacoes: novoForm.observacoes,
        notebookSpecs,
        monitorSpecs,
      },
      novoForm.gerarDespesaFinanceira
    );

    setIsNovoModalOpen(false);
  };

  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipamento) return;

    transferirEquipamento(
      selectedEquipamento.id,
      transfForm.novoResponsavel,
      transfForm.novoDepartamento,
      transfForm.novaLocalizacao,
      transfForm.observacao
    );

    setIsTransferModalOpen(false);
    setSelectedEquipamento(null);
  };

  const handleAbrirManutencaoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipamento) return;

    abrirManutencao(
      selectedEquipamento.id,
      manutForm.tipo,
      manutForm.descricao,
      Number(manutForm.valor),
      manutForm.responsavel
    );

    setIsManutencaoModalOpen(false);
    setSelectedEquipamento(null);
  };

  const renderCategoryIcon = (categoria: CategoriaEquipamento) => {
    switch (categoria) {
      case 'Notebook':
        return <Laptop className="h-4 w-4 text-blue-500" />;
      case 'Monitor':
        return <Monitor className="h-4 w-4 text-indigo-500" />;
      case 'Desktop':
        return <Cpu className="h-4 w-4 text-cyan-500" />;
      case 'Celular':
      case 'Tablet':
        return <Smartphone className="h-4 w-4 text-emerald-500" />;
      case 'Servidor':
        return <Server className="h-4 w-4 text-amber-500" />;
      case 'Switch':
        return <Network className="h-4 w-4 text-purple-500" />;
      default:
        return <HardDrive className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Equipamentos & Hardware ITAM</h2>
          <p className="text-xs text-muted-foreground">
            Cadastro centralizado de ativos fsicos, atribuies a colaboradores e histrico de ciclo de vida
          </p>
        </div>
        <Button onClick={() => setIsNovoModalOpen(true)} className="gap-2 text-xs">
          <Plus className="h-4 w-4" /> Cadastrar Equipamento
        </Button>
      </div>

      {/* BARRA DE FILTROS POR CATEGORIA E BUSCA */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cdigo patrimonial, marca, modelo, serial ou responsvel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
          <div className="w-full md:w-48">
            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas Categorias</SelectItem>
                {CATEGORIAS_LISTA.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-40">
            <Select value={situacaoFilter} onValueChange={setSituacaoFilter}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Situao" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas Situaes</SelectItem>
                <SelectItem value="Em Uso">Em Uso</SelectItem>
                <SelectItem value="Disponvel">Disponvel</SelectItem>
                <SelectItem value="Manuteno">Manuteno</SelectItem>
                <SelectItem value="Baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* TABELA PRINCIPAL DE EQUIPAMENTOS */}
      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Equipamentos Cadastrados ({filteredEquipamentos.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Patrimnio / Dispositivo</TableHead>
                <TableHead className="text-xs">Categoria</TableHead>
                <TableHead className="text-xs">Responsvel / Setor</TableHead>
                <TableHead className="text-xs">Especificaes / Serial</TableHead>
                <TableHead className="text-xs">Valor / Garantia</TableHead>
                <TableHead className="text-xs">Situao</TableHead>
                <TableHead className="text-xs text-right">Aes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEquipamentos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                    Nenhum equipamento encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredEquipamentos.map((eq) => (
                  <TableRow key={eq.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-muted border border-border shrink-0">
                          {renderCategoryIcon(eq.categoria)}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-foreground">
                            {eq.marca} {eq.modelo}
                          </div>
                          <span className="text-[10px] font-mono text-primary font-semibold">
                            {eq.codigoPatrimonial}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs">
                      <Badge variant="outline" className="text-[10px]">
                        {eq.categoria}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs">
                      {eq.colaboradorNome ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-foreground flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" /> {eq.colaboradorNome}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{eq.departamento}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-[11px] italic">Estoque TI</span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs">
                      <div className="flex flex-col text-[11px]">
                        <span className="font-mono text-muted-foreground truncate max-w-[150px]">
                          S/N: {eq.numeroSerie}
                        </span>
                        {eq.notebookSpecs && (
                          <span className="text-[10px] text-primary truncate max-w-[160px]">
                            {eq.notebookSpecs.processador} | {eq.notebookSpecs.memoriaRam}
                          </span>
                        )}
                        {eq.monitorSpecs && (
                          <span className="text-[10px] text-indigo-500 truncate max-w-[160px]">
                            {eq.monitorSpecs.polegadas} {eq.monitorSpecs.resolucao}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs">
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          R$ {eq.valorCompra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Garantia: {eq.garantiaMeses || 12} meses
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {eq.situacao === 'Em Uso' && (
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                          Em Uso
                        </Badge>
                      )}
                      {eq.situacao === 'Disponvel' && (
                        <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/30">
                          Disponvel
                        </Badge>
                      )}
                      {eq.situacao === 'Manuteno' && (
                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">
                          Manuteno
                        </Badge>
                      )}
                      {eq.situacao === 'Baixa' && (
                        <Badge variant="destructive" className="text-[10px]">
                          Baixa / Descarte
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Boto Transferir */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          title="Transferir Responsvel"
                          onClick={() => {
                            setSelectedEquipamento(eq);
                            setTransfForm({
                              novoResponsavel: eq.colaboradorNome || '',
                              novoDepartamento: eq.departamento || 'Engenharia de Software',
                              novaLocalizacao: eq.localFisica || 'Estao de Trabalho',
                              observacao: 'Mudana de titularidade.',
                            });
                            setIsTransferModalOpen(true);
                          }}
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5 text-blue-600" />
                        </Button>

                        {/* Boto Timeline */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          title="Histrico / Timeline"
                          onClick={() => {
                            setSelectedEquipamento(eq);
                            setIsTimelineModalOpen(true);
                          }}
                        >
                          <History className="h-3.5 w-3.5 text-indigo-600" />
                        </Button>

                        {/* Boto Manuteno */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          title="Abrir Manuteno"
                          onClick={() => {
                            setSelectedEquipamento(eq);
                            setIsManutencaoModalOpen(true);
                          }}
                        >
                          <Wrench className="h-3.5 w-3.5 text-amber-600" />
                        </Button>

                        {/* Excluir */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-rose-600"
                          onClick={() => deleteEquipamento(eq.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL: CADASTRO DE NOVO EQUIPAMENTO (COM CAMPOS DINMICOS CONFORME CATEGORIA) */}
      <Dialog open={isNovoModalOpen} onOpenChange={setIsNovoModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Laptop className="h-5 w-5 text-primary" /> Cadastrar Novo Equipamento Corporativo
            </DialogTitle>
            <DialogDescription className="text-xs">
              Preencha os dados gerais. O formulrio exibir automaticamente campos especficos conforme a Categoria (ex: Notebooks e Monitores).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateEquipamento} className="space-y-4 py-2">
            {/* SEO 1: DADOS GERAIS */}
            <div className="border border-border/60 rounded-xl p-4 space-y-3 bg-muted/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Dados Gerais do Ativo
              </h4>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Cdigo Patrimonial *</Label>
                  <Input
                    required
                    value={novoForm.codigoPatrimonial}
                    onChange={(e) => setNovoForm({ ...novoForm, codigoPatrimonial: e.target.value })}
                    className="text-xs font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Categoria de Ativo *</Label>
                  <Select
                    value={novoForm.categoria}
                    onValueChange={(val: CategoriaEquipamento) => setNovoForm({ ...novoForm, categoria: val })}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS_LISTA.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Marca / Fabricante *</Label>
                  <Input
                    required
                    placeholder="Ex: Apple, Dell, Lenovo"
                    value={novoForm.marca}
                    onChange={(e) => setNovoForm({ ...novoForm, marca: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Modelo *</Label>
                  <Input
                    required
                    placeholder="Ex: MacBook Pro 16 M2 Max"
                    value={novoForm.modelo}
                    onChange={(e) => setNovoForm({ ...novoForm, modelo: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nmero de Srie (S/N) *</Label>
                  <Input
                    required
                    placeholder="Ex: C02G1234MD6R"
                    value={novoForm.numeroSerie}
                    onChange={(e) => setNovoForm({ ...novoForm, numeroSerie: e.target.value })}
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Data de Aquisio *</Label>
                  <Input
                    type="date"
                    required
                    value={novoForm.dataAquisicao}
                    onChange={(e) => setNovoForm({ ...novoForm, dataAquisicao: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Valor de Compra (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={novoForm.valorCompra}
                    onChange={(e) => setNovoForm({ ...novoForm, valorCompra: Number(e.target.value) })}
                    className="text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Garantia (Meses)</Label>
                  <Input
                    type="number"
                    value={novoForm.garantiaMeses}
                    onChange={(e) => setNovoForm({ ...novoForm, garantiaMeses: Number(e.target.value) })}
                    className="text-xs"
                  />
                </div>
              </div>
            </div>

            {/* SEO 2: CAMPOS DINMICOS SE CATEGORIA FOR NOTEBOOK */}
            {novoForm.categoria === 'Notebook' && (
              <div className="border border-blue-500/30 rounded-xl p-4 space-y-3 bg-blue-500/5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5" /> Especificaes Tcnicas de Notebook
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Processador</Label>
                    <Input
                      placeholder="Ex: Intel i7 / Apple M2 Max"
                      value={novoForm.processador}
                      onChange={(e) => setNovoForm({ ...novoForm, processador: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Memria RAM</Label>
                    <Input
                      placeholder="Ex: 32 GB DDR5"
                      value={novoForm.memoriaRam}
                      onChange={(e) => setNovoForm({ ...novoForm, memoriaRam: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Armazenamento (SSD/HDD)</Label>
                    <Input
                      placeholder="Ex: 1 TB SSD NVMe"
                      value={novoForm.armazenamento}
                      onChange={(e) => setNovoForm({ ...novoForm, armazenamento: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Sistema Operacional</Label>
                    <Input
                      placeholder="Ex: macOS Sonoma / Windows 11 Pro"
                      value={novoForm.sistemaOperacional}
                      onChange={(e) => setNovoForm({ ...novoForm, sistemaOperacional: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Service Tag / Tag de Servio</Label>
                    <Input
                      placeholder="Ex: DELL-SERVICE-TAG"
                      value={novoForm.serviceTag}
                      onChange={(e) => setNovoForm({ ...novoForm, serviceTag: e.target.value })}
                      className="text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Endereo MAC Address</Label>
                    <Input
                      placeholder="Ex: 00:1A:2B:3C:4D:5E"
                      value={novoForm.macAddress}
                      onChange={(e) => setNovoForm({ ...novoForm, macAddress: e.target.value })}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SEO 3: CAMPOS DINMICOS SE CATEGORIA FOR MONITOR */}
            {novoForm.categoria === 'Monitor' && (
              <div className="border border-indigo-500/30 rounded-xl p-4 space-y-3 bg-indigo-500/5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Monitor className="h-3.5 w-3.5" /> Especificaes de Display / Monitor
                </h4>

                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Polegadas (")</Label>
                    <Input
                      placeholder="Ex: 27 Inches"
                      value={novoForm.polegadas}
                      onChange={(e) => setNovoForm({ ...novoForm, polegadas: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Resoluo</Label>
                    <Input
                      placeholder="Ex: 3840 x 2160 4K"
                      value={novoForm.resolucao}
                      onChange={(e) => setNovoForm({ ...novoForm, resolucao: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo de Painel</Label>
                    <Input
                      placeholder="Ex: IPS Black / OLED"
                      value={novoForm.tipoPainel}
                      onChange={(e) => setNovoForm({ ...novoForm, tipoPainel: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Conexes</Label>
                    <Input
                      placeholder="HDMI, DisplayPort, USB-C"
                      value={novoForm.conexoes}
                      onChange={(e) => setNovoForm({ ...novoForm, conexoes: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SEO 4: ALOCAO E LOCALIZAO */}
            <div className="border border-border/60 rounded-xl p-4 space-y-3 bg-muted/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Atribuio de Responsvel e Localizao
              </h4>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Colaborador Responsvel</Label>
                  <Input
                    placeholder="Ex: Carlos Silva (Vazio = Estoque)"
                    value={novoForm.colaboradorNome}
                    onChange={(e) => setNovoForm({ ...novoForm, colaboradorNome: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Departamento / Setor</Label>
                  <Input
                    placeholder="Ex: Engenharia de Software"
                    value={novoForm.departamento}
                    onChange={(e) => setNovoForm({ ...novoForm, departamento: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Localizao Fsica</Label>
                  <Input
                    placeholder="Ex: Estao ENG-04 / Head Office"
                    value={novoForm.localFisica}
                    onChange={(e) => setNovoForm({ ...novoForm, localFisica: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>
            </div>

            {/* INTEGRAO FINANCEIRA */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <div>
                  <h5 className="text-xs font-bold text-foreground">Vincular ao Financeiro (Contas a Pagar)</h5>
                  <p className="text-[10px] text-muted-foreground">
                    Gerar registro de despesa no mdulo Contas a Pagar automaticamente
                  </p>
                </div>
              </div>
              <Switch
                checked={novoForm.gerarDespesaFinanceira}
                onCheckedChange={(checked) => setNovoForm({ ...novoForm, gerarDespesaFinanceira: checked })}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNovoModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm">
                Cadastrar Equipamento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: TRANSFERNCIA DE EQUIPAMENTO */}
      <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-blue-600" /> Transferir Equipamento
            </DialogTitle>
            <DialogDescription className="text-xs">
              Altere o colaborador responsvel, setor ou localizao do equipamento {selectedEquipamento?.codigoPatrimonial}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmTransfer} className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Novo Colaborador Responsvel</Label>
              <Input
                placeholder="Ex: Ana Souza (Deixe em branco para devolver ao Estoque)"
                value={transfForm.novoResponsavel}
                onChange={(e) => setTransfForm({ ...transfForm, novoResponsavel: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Novo Departamento / Setor *</Label>
              <Input
                required
                value={transfForm.novoDepartamento}
                onChange={(e) => setTransfForm({ ...transfForm, novoDepartamento: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Nova Localizao Fsica *</Label>
              <Input
                required
                value={transfForm.novaLocalizacao}
                onChange={(e) => setTransfForm({ ...transfForm, novaLocalizacao: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Observaes do Registro</Label>
              <Textarea
                rows={2}
                value={transfForm.observacao}
                onChange={(e) => setTransfForm({ ...transfForm, observacao: e.target.value })}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsTransferModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm">
                Confirmar Transferncia
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: TIMELINE E HISTRICO COMPLETO DO EQUIPAMENTO */}
      <Dialog open={isTimelineModalOpen} onOpenChange={setIsTimelineModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-600" /> Timeline do Equipamento
            </DialogTitle>
            <DialogDescription className="text-xs">
              Histrico rastrevel desde a aquisio, movimentaes, manutenes e trocas de responsvel.
            </DialogDescription>
          </DialogHeader>

          {selectedEquipamento && (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-lg bg-muted/40 border border-border flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-foreground">
                    {selectedEquipamento.marca} {selectedEquipamento.modelo}
                  </h4>
                  <span className="text-[10px] font-mono text-primary font-bold">
                    {selectedEquipamento.codigoPatrimonial}
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {selectedEquipamento.situacao}
                </Badge>
              </div>

              {/* TIMELINE AUDIT TRAIL */}
              <div className="space-y-3 pl-4 border-l-2 border-primary/30 max-h-[300px] overflow-y-auto pr-2">
                {selectedEquipamento.timeline && selectedEquipamento.timeline.length > 0 ? (
                  selectedEquipamento.timeline.map((ev) => (
                    <div key={ev.id} className="relative space-y-1">
                      <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{ev.tipo}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{ev.dataHora}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{ev.descricao}</p>
                      {ev.responsavel && (
                        <span className="text-[10px] text-primary font-medium block">
                          Responsvel: {ev.responsavel}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">Nenhum evento registrado ainda.</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsTimelineModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: ABRIR MANUTENO */}
      <Dialog open={isManutencaoModalOpen} onOpenChange={setIsManutencaoModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Wrench className="h-4 w-4 text-amber-600" /> Abrir Ordem de Manuteno
            </DialogTitle>
            <DialogDescription className="text-xs">
              Registre uma ordem preventiva, corretiva ou upgrade para o equipamento {selectedEquipamento?.codigoPatrimonial}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAbrirManutencaoSubmit} className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Tipo de Manuteno *</Label>
              <Select
                value={manutForm.tipo}
                onValueChange={(val: any) => setManutForm({ ...manutForm, tipo: val })}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Preventiva">Preventiva</SelectItem>
                  <SelectItem value="Corretiva">Corretiva</SelectItem>
                  <SelectItem value="Upgrade">Upgrade de Hardware</SelectItem>
                  <SelectItem value="Troca">Troca de Componentes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Descrio dos Servios *</Label>
              <Textarea
                required
                rows={2}
                placeholder="Ex: Troca de SSD por modelo NVMe 1TB e limpeza de fans."
                value={manutForm.descricao}
                onChange={(e) => setManutForm({ ...manutForm, descricao: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Custo Estimado (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={manutForm.valor}
                  onChange={(e) => setManutForm({ ...manutForm, valor: Number(e.target.value) })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tcnico / Responsvel *</Label>
                <Input
                  required
                  placeholder="Ex: Assistncia Autorizada Dell / Suporte Interno"
                  value={manutForm.responsavel}
                  onChange={(e) => setManutForm({ ...manutForm, responsavel: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsManutencaoModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm">
                Abrir Chamado
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
