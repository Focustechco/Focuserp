import React, { useState } from 'react';
import {
  KeyRound,
  Plus,
  Search,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  DollarSign,
  Building2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Receipt,
  User,
  Send,
  ArrowRight,
  FolderTree,
  Tag
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEstoquePatrimonio } from '../hooks/useEstoquePatrimonio';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Licenca } from '../types';
import { CentroCusto } from '@/features/centro-de-custos/types';
import { INITIAL_CENTROS } from '@/features/centro-de-custos/data/initialData';
import { CategoriaFinanceira } from '@/features/plano-contas/types';
import { INITIAL_CATEGORIAS } from '@/features/plano-contas/mockData';
import { toast } from 'sonner';

export function LicencasView() {
  const { licencas, criarLicencaComFinanceiro, lancarContaPagar, deleteLicenca } = useEstoquePatrimonio();
  const { data: clientes = [] } = useLocalStorageState<any>('focus_clientes', []);
  const { data: centrosCusto = [] } = useLocalStorageState<CentroCusto>('focus_centro_custos', INITIAL_CENTROS);
  const { data: planoContas = [] } = useLocalStorageState<CategoriaFinanceira>('focus_plano_contas', INITIAL_CATEGORIAS);

  const [searchTerm, setSearchTerm] = useState('');
  const [isNovoModalOpen, setIsNovoModalOpen] = useState(false);
  const [licencaParaLancar, setLicencaParaLancar] = useState<Licenca | null>(null);

  // Form de lançamento direto no Contas a Pagar
  const [lancarModalForm, setLancarModalForm] = useState({
    valor: 35.0,
    vencimento: new Date(new Date().getFullYear(), new Date().getMonth(), 10).toISOString().split('T')[0],
    centroCustoId: '',
    centroCustoNome: 'Operacional & Tecnologia',
    categoria: 'Licenciamento de Software',
  });

  const [novoForm, setNovoForm] = useState({
    nome: 'Canva Premium',
    fabricante: 'Canva',
    plano: 'Enterprise Annual',
    tipo: 'Assinatura' as 'Assinatura' | 'Perpétua',
    quantidadeTotal: 8,
    quantidadeUsada: 1,
    dataCompra: new Date().toISOString().split('T')[0],
    vencimento: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10).toISOString().split('T')[0],
    valor: 35.0,
    responsavelNome: 'Equipe de TI & Marketing',
    centroCustoId: '',
    centroCustoNome: 'Comercial & Marketing',
    categoriaFinanceira: 'Licenciamento de Software',
    observacoes: '',
    gerarContaPagar: true,
    gerarContaReceber: false,
    clienteNome: '',
  });

  const categoriasDespesa = planoContas.filter(c => c.tipo === 'Despesa' || !c.tipo);

  const filteredLicencas = licencas.filter((l) => {
    if (!l) return false;
    const search = searchTerm.toLowerCase();
    return (
      (l.nome || '').toLowerCase().includes(search) ||
      (l.fabricante || '').toLowerCase().includes(search) ||
      (l.plano || '').toLowerCase().includes(search)
    );
  });

  const handleCreateLicenca = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoForm.nome || !novoForm.fabricante) return;

    const qtdTotal = Number(novoForm.quantidadeTotal) || 1;
    const qtdUsada = Number(novoForm.quantidadeUsada) || 0;
    const qtdDisp = Math.max(0, qtdTotal - qtdUsada);
    const vlr = Number(novoForm.valor) || 0;

    const selectedCc = centrosCusto.find(c => c.id === novoForm.centroCustoId || c.nome === novoForm.centroCustoNome);
    const ccNomeFinal = selectedCc ? selectedCc.nome : (novoForm.centroCustoNome || 'Operacional & Tecnologia');
    const ccIdFinal = selectedCc ? selectedCc.id : novoForm.centroCustoId;

    criarLicencaComFinanceiro({
      licenca: {
        nome: novoForm.nome,
        fabricante: novoForm.fabricante,
        plano: novoForm.plano,
        tipo: novoForm.tipo,
        quantidadeTotal: qtdTotal,
        quantidadeUsada: qtdUsada,
        quantidadeDisponivel: qtdDisp,
        dataCompra: novoForm.dataCompra,
        vencimento: novoForm.vencimento,
        valor: vlr,
        responsavelNome: novoForm.responsavelNome,
        centroCustoNome: ccNomeFinal,
        centroCustoId: ccIdFinal,
        observacoes: novoForm.observacoes,
        createdAt: new Date().toISOString(),
      },
      gerarContaPagar: novoForm.gerarContaPagar,
      gerarContaReceber: novoForm.gerarContaReceber,
      clienteNome: novoForm.clienteNome,
      vencimentoFinanceiro: novoForm.vencimento,
    });

    toast.success(`Licença "${novoForm.nome}" cadastrada! Título de R$ ${vlr.toFixed(2)} contabilizado no Centro de Custo "${ccNomeFinal}".`);
    setIsNovoModalOpen(false);
  };

  const handleOpenLancarModal = (lic: Licenca) => {
    setLicencaParaLancar(lic);
    const matchedCc = centrosCusto.find(c => c.nome === lic.centroCustoNome || c.id === lic.centroCustoId);
    setLancarModalForm({
      valor: Number(lic.valor) || 0,
      vencimento: lic.vencimento || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10).toISOString().split('T')[0],
      centroCustoId: matchedCc ? matchedCc.id : (centrosCusto[0]?.id || ''),
      centroCustoNome: matchedCc ? matchedCc.nome : (lic.centroCustoNome || centrosCusto[0]?.nome || 'Operacional & Tecnologia'),
      categoria: 'Licenciamento de Software',
    });
  };

  const handleConfirmarLancamentoManual = () => {
    if (!licencaParaLancar) return;
    const vlr = Number(lancarModalForm.valor) || 0;

    const selectedCc = centrosCusto.find(c => c.id === lancarModalForm.centroCustoId || c.nome === lancarModalForm.centroCustoNome);
    const ccNome = selectedCc ? selectedCc.nome : lancarModalForm.centroCustoNome;
    const ccId = selectedCc ? selectedCc.id : lancarModalForm.centroCustoId;

    lancarContaPagar({
      fornecedor: licencaParaLancar.fabricante || licencaParaLancar.nome,
      descricao: `Mensalidade/Assinatura: ${licencaParaLancar.nome} (${licencaParaLancar.plano || 'Licença'})`,
      valor: vlr,
      vencimento: lancarModalForm.vencimento,
      categoria: lancarModalForm.categoria || 'Licenciamento de Software',
      centroCustoNome: ccNome,
      centroCustoId: ccId,
      formaPagamento: 'Boleto',
    });

    toast.success(`Título de R$ ${vlr.toFixed(2)} direcionado para o Centro de Custo "${ccNome}" e Categoria "${lancarModalForm.categoria}"!`);
    setLicencaParaLancar(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Gestão de Licenças e Softwares (SAM)</h2>
          <p className="text-xs text-muted-foreground">
            Controle de assinaturas de SaaS/Software integrado diretamente com Centro de Custo, Categorias e Contas a Pagar
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setIsNovoModalOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white text-xs gap-1.5 font-semibold"
        >
          <Plus className="h-4 w-4" /> Nova Licença / Software
        </Button>
      </div>

      {/* SEARCH BAR */}
      <Card className="p-3 bg-card border shadow-2xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por software, fabricante (ex: Canva, Microsoft, Adobe, AWS) ou plano..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>
      </Card>

      {/* CARDS VISUAIS DE LICENÇAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredLicencas.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground text-xs border rounded-xl bg-card">
            <KeyRound className="w-8 h-8 opacity-30 mx-auto mb-2" />
            <p className="font-semibold text-foreground text-sm">Nenhuma licença cadastrada</p>
            <p className="mt-1">Clique em "Nova Licença / Software" para cadastrar e lançar a despesa no Contas a Pagar.</p>
          </div>
        ) : (
          filteredLicencas.map((lic) => {
            const percUsado = Math.round(((Number(lic.quantidadeUsada) || 0) / (Number(lic.quantidadeTotal) || 1)) * 100);
            const isProximoVencimento =
              lic.vencimento &&
              (new Date(lic.vencimento).getTime() - new Date().getTime()) / (1000 * 3600 * 24) <= 60;

            return (
              <Card key={lic.id} className="hover:border-orange-500/50 hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-sm font-bold text-foreground truncate">
                        {lic.nome}
                      </CardTitle>
                      <CardDescription className="text-[11px] font-semibold text-orange-600 mt-0.5">
                        {lic.fabricante} • {lic.plano}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {lic.tipo}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 p-4 pt-2 text-xs flex-1">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-muted-foreground text-[11px]">Ocupação de Assentos</span>
                      <span className={percUsado >= 90 ? 'text-rose-500 font-extrabold' : 'text-foreground'}>
                        {lic.quantidadeUsada} / {lic.quantidadeTotal} ({percUsado}%)
                      </span>
                    </div>
                    <Progress
                      value={percUsado}
                      className={`h-2 ${percUsado >= 90 ? 'bg-rose-100 dark:bg-rose-950' : ''}`}
                    />
                    <span className="text-[10px] text-muted-foreground block text-right">
                      {lic.quantidadeDisponivel} assento(s) livre(s)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/50">
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase font-bold">Valor Mensal / Assinatura</span>
                      <span className="font-bold text-foreground text-sm">
                        R$ {(lic.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground block uppercase font-bold">Vencimento</span>
                      <span
                        className={`font-semibold text-xs ${
                          isProximoVencimento ? 'text-rose-600 font-bold' : 'text-foreground'
                        }`}
                      >
                        {lic.vencimento ? new Date(lic.vencimento).toLocaleDateString('pt-BR') : 'Perpétua'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenLancarModal(lic)}
                      className="h-7 text-[11px] px-2 gap-1 text-orange-600 hover:text-orange-700 bg-orange-500/5 hover:bg-orange-500/10 border-orange-500/20 font-semibold"
                    >
                      <Receipt className="w-3.5 h-3.5" /> Lançar no Contas a Pagar
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-rose-600"
                      onClick={() => {
                        deleteLicenca(lic.id);
                        toast.success(`Licença "${lic.nome}" excluída!`);
                      }}
                      title="Excluir licença"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="text-[10px] text-muted-foreground pt-1 border-t flex items-center justify-between">
                    <span className="font-medium">CC: {lic.centroCustoNome || 'Operacional & Tecnologia'}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* MODAL: NOVA LICENÇA */}
      <Dialog open={isNovoModalOpen} onOpenChange={setIsNovoModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-orange-600" /> Cadastrar Licença / Assinatura & Direcionamento Financeiro
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cadastre o software e selecione o <strong>Centro de Custo</strong> e <strong>Categoria</strong> para contabilizar com precisão no ERP.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateLicenca} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nome do Software / Produto *</Label>
              <Input
                required
                placeholder="Ex: Canva Premium, Microsoft 365, Adobe CC, Figma"
                value={novoForm.nome}
                onChange={(e) => setNovoForm({ ...novoForm, nome: e.target.value })}
                className="text-xs h-8"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Fabricante / Fornecedor *</Label>
                <Input
                  required
                  placeholder="Ex: Canva, Microsoft, Google, Adobe"
                  value={novoForm.fabricante}
                  onChange={(e) => setNovoForm({ ...novoForm, fabricante: e.target.value })}
                  className="text-xs h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Plano / Tipo de Assinatura</Label>
                <Input
                  placeholder="Ex: Enterprise Annual / Mensal"
                  value={novoForm.plano}
                  onChange={(e) => setNovoForm({ ...novoForm, plano: e.target.value })}
                  className="text-xs h-8"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Tipo</Label>
                <Select
                  value={novoForm.tipo}
                  onValueChange={(val: 'Assinatura' | 'Perpétua') => setNovoForm({ ...novoForm, tipo: val })}
                >
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Assinatura">Assinatura Mensal/Anual</SelectItem>
                    <SelectItem value="Perpétua">Perpétua</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Assentos Totais</Label>
                <Input
                  type="number"
                  min="1"
                  required
                  value={novoForm.quantidadeTotal}
                  onChange={(e) => setNovoForm({ ...novoForm, quantidadeTotal: Number(e.target.value) })}
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">Valor Mensalidade (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={novoForm.valor}
                  onChange={(e) => setNovoForm({ ...novoForm, valor: Number(e.target.value) })}
                  className="text-xs h-8 font-bold text-orange-600"
                />
              </div>
            </div>

            {/* SELEÇÃO DE CENTRO DE CUSTO E CATEGORIA */}
            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg border bg-muted/30">
              <div className="space-y-1">
                <Label className="text-xs font-bold flex items-center gap-1 text-foreground">
                  <FolderTree className="w-3.5 h-3.5 text-orange-600" /> Centro de Custo *
                </Label>
                <Select
                  value={novoForm.centroCustoId || novoForm.centroCustoNome}
                  onValueChange={(val) => {
                    const matched = centrosCusto.find(c => c.id === val || c.nome === val);
                    setNovoForm({
                      ...novoForm,
                      centroCustoId: matched ? matched.id : val,
                      centroCustoNome: matched ? matched.nome : val,
                    });
                  }}
                >
                  <SelectTrigger className="text-xs h-8 bg-card">
                    <SelectValue placeholder="Selecione o Centro de Custo" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    {centrosCusto.map((cc) => (
                      <SelectItem key={cc.id} value={cc.id}>
                        {cc.codigo ? `${cc.codigo} - ` : ''}{cc.nome} ({cc.tipo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold flex items-center gap-1 text-foreground">
                  <Tag className="w-3.5 h-3.5 text-orange-600" /> Categoria Financeira *
                </Label>
                <Select
                  value={novoForm.categoriaFinanceira}
                  onValueChange={(val) => setNovoForm({ ...novoForm, categoriaFinanceira: val })}
                >
                  <SelectTrigger className="text-xs h-8 bg-card">
                    <SelectValue placeholder="Selecione a Categoria" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    {categoriasDespesa.map((cat) => (
                      <SelectItem key={cat.id} value={cat.nome}>
                        {cat.codigo ? `${cat.codigo} - ` : ''}{cat.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Data de Aquisição</Label>
                <Input
                  type="date"
                  value={novoForm.dataCompra}
                  onChange={(e) => setNovoForm({ ...novoForm, dataCompra: e.target.value })}
                  className="text-xs h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">Data de Vencimento / Cobrança *</Label>
                <Input
                  type="date"
                  required
                  value={novoForm.vencimento}
                  onChange={(e) => setNovoForm({ ...novoForm, vencimento: e.target.value })}
                  className="text-xs h-8 font-bold text-orange-600"
                />
              </div>
            </div>

            {/* PAINEL DE INTEGRAÇÃO FINANCEIRA */}
            <div className="p-3 rounded-lg border bg-orange-500/5 dark:bg-orange-950/20 border-orange-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-orange-700 dark:text-orange-300">
                  <Receipt className="w-4 h-4" />
                  Gerar Título no Contas a Pagar
                </div>
                <Switch
                  checked={novoForm.gerarContaPagar}
                  onCheckedChange={(checked) => setNovoForm({ ...novoForm, gerarContaPagar: checked })}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Ao salvar, um título de <strong>R$ {Number(novoForm.valor || 0).toFixed(2)}</strong> com vencimento em <strong>{novoForm.vencimento}</strong> será contabilizado no Centro de Custo <strong>{novoForm.centroCustoNome}</strong>.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNovoModalOpen(false)} className="text-xs">
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="text-xs bg-orange-600 hover:bg-orange-700 text-white font-semibold">
                Salvar Licença & Contabilizar no Financeiro
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: LANÇAR DESPESA DIRETA NO CONTAS A PAGAR COM SELEÇÃO DE CENTRO DE CUSTO E CATEGORIA */}
      <Dialog open={!!licencaParaLancar} onOpenChange={(open) => !open && setLicencaParaLancar(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-orange-600">
              <Receipt className="w-4 h-4" /> Lançar Mensalidade no Contas a Pagar
            </DialogTitle>
            <DialogDescription className="text-xs">
              Selecione o <strong>Centro de Custo</strong>, <strong>Categoria</strong> e data de vencimento da mensalidade de <strong>{licencaParaLancar?.nome}</strong> para contabilizar a despesa.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 bg-muted/40 rounded-lg border space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Software / Fornecedor:</span>
                <span className="font-semibold text-foreground">{licencaParaLancar?.nome} ({licencaParaLancar?.fabricante})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Valor da Mensalidade (R$):</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={lancarModalForm.valor}
                  onChange={(e) => setLancarModalForm({ ...lancarModalForm, valor: Number(e.target.value) })}
                  className="w-28 text-right font-bold text-orange-600 h-7 text-xs"
                />
              </div>
            </div>

            {/* SELEÇÃO DO CENTRO DE CUSTO */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5 text-orange-600" />
                Centro de Custo para Direcionar *
              </Label>
              <Select
                value={lancarModalForm.centroCustoId || lancarModalForm.centroCustoNome}
                onValueChange={(val) => {
                  const matched = centrosCusto.find(c => c.id === val || c.nome === val);
                  setLancarModalForm({
                    ...lancarModalForm,
                    centroCustoId: matched ? matched.id : val,
                    centroCustoNome: matched ? matched.nome : val,
                  });
                }}
              >
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Selecione o Centro de Custo" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  {centrosCusto.map((cc) => (
                    <SelectItem key={cc.id} value={cc.id}>
                      {cc.codigo ? `${cc.codigo} - ` : ''}{cc.nome} ({cc.tipo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* SELEÇÃO DA CATEGORIA FINANCEIRA */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-orange-600" />
                Categoria da Despesa *
              </Label>
              <Select
                value={lancarModalForm.categoria}
                onValueChange={(val) => setLancarModalForm({ ...lancarModalForm, categoria: val })}
              >
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Selecione a Categoria" />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  {categoriasDespesa.map((cat) => (
                    <SelectItem key={cat.id} value={cat.nome}>
                      {cat.codigo ? `${cat.codigo} - ` : ''}{cat.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Data de Vencimento da Cobrança *</Label>
              <Input
                type="date"
                required
                value={lancarModalForm.vencimento}
                onChange={(e) => setLancarModalForm({ ...lancarModalForm, vencimento: e.target.value })}
                className="text-xs h-8 font-bold"
              />
              <p className="text-[10px] text-muted-foreground">Ex: Escolha o dia 10 do mês desejado para o pagamento da mensalidade.</p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button variant="outline" size="sm" onClick={() => setLicencaParaLancar(null)} className="text-xs">
              Cancelar
            </Button>
            <Button variant="default" size="sm" onClick={handleConfirmarLancamentoManual} className="text-xs bg-orange-600 hover:bg-orange-700 text-white font-semibold">
              Confirmar Lançamento Financeiro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
