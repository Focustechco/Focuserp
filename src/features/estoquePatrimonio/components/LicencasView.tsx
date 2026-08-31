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
  User
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
import { toast } from 'sonner';

export function LicencasView() {
  const { licencas, criarLicencaComFinanceiro, deleteLicenca } = useEstoquePatrimonio();
  const { data: clientes = [] } = useLocalStorageState<any>('focus_clientes', []);

  const [searchTerm, setSearchTerm] = useState('');
  const [isNovoModalOpen, setIsNovoModalOpen] = useState(false);

  const [novoForm, setNovoForm] = useState({
    nome: 'Microsoft 365 Business Premium',
    fabricante: 'Microsoft',
    plano: 'Enterprise Annual',
    tipo: 'Assinatura' as 'Assinatura' | 'Perpétua',
    quantidadeTotal: 20,
    quantidadeUsada: 15,
    dataCompra: new Date().toISOString().split('T')[0],
    vencimento: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    valor: 85.0,
    responsavelNome: 'Equipe de TI',
    centroCustoNome: 'Tecnologia da Informação',
    observacoes: '',
    gerarContaPagar: true,
    gerarContaReceber: false,
    clienteNome: '',
    vencimentoFinanceiro: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
  });

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
        centroCustoNome: novoForm.centroCustoNome,
        observacoes: novoForm.observacoes,
        createdAt: new Date().toISOString(),
      },
      gerarContaPagar: novoForm.gerarContaPagar,
      gerarContaReceber: novoForm.gerarContaReceber,
      clienteNome: novoForm.clienteNome,
      vencimentoFinanceiro: novoForm.vencimentoFinanceiro,
    });

    let msg = `Licença "${novoForm.nome}" cadastrada com sucesso!`;
    if (novoForm.gerarContaPagar) msg += ' Conta a Pagar gerada.';
    if (novoForm.gerarContaReceber && novoForm.clienteNome) msg += ' Conta a Receber gerada para o cliente.';
    toast.success(msg);

    setIsNovoModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Gestão de Licenças e Softwares (SAM)</h2>
          <p className="text-xs text-muted-foreground">
            Controle de assinaturas, assentos contratados, custos e renovações com integração financeira automática
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
            placeholder="Buscar por nome do software, fabricante (ex: Microsoft, Adobe, AWS) ou plano..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>
      </Card>

      {/* CARDS VISUAIS DE LICENÇAS CRÍTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredLicencas.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground text-xs border rounded-xl bg-card">
            <KeyRound className="w-8 h-8 opacity-30 mx-auto mb-2" />
            <p className="font-semibold text-foreground text-sm">Nenhuma licença cadastrada</p>
            <p className="mt-1">Clique em "Nova Licença / Software" para cadastrar e gerar os lançamentos financeiros.</p>
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
                      <span className="font-bold text-foreground">
                        R$ {(lic.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground block uppercase font-bold">Vencimento</span>
                      <span
                        className={`font-semibold ${
                          isProximoVencimento ? 'text-rose-600 font-bold' : 'text-foreground'
                        }`}
                      >
                        {lic.vencimento ? new Date(lic.vencimento).toLocaleDateString('pt-BR') : 'Perpétua'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t text-[11px] text-muted-foreground">
                    <span className="truncate max-w-[170px]">
                      CC: {lic.centroCustoNome || 'TI / Infra'}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-rose-600"
                      onClick={() => {
                        deleteLicenca(lic.id);
                        toast.success(`Licença "${lic.nome}" excluída!`);
                      }}
                      title="Excluir licença"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
              <KeyRound className="h-5 w-5 text-orange-600" /> Cadastrar Licença de Software & Integração Financeira
            </DialogTitle>
            <DialogDescription className="text-xs">
              Registre subscrições corporativas e gere lançamentos automáticos em Contas a Pagar e Contas a Receber.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateLicenca} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nome do Software / Produto *</Label>
              <Input
                required
                placeholder="Ex: Microsoft 365 Business Premium, Adobe CC, ChatGPT Plus"
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
                  placeholder="Ex: Microsoft, Google, Adobe, OpenAI"
                  value={novoForm.fabricante}
                  onChange={(e) => setNovoForm({ ...novoForm, fabricante: e.target.value })}
                  className="text-xs h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Plano / SKU</Label>
                <Input
                  placeholder="Ex: Enterprise Annual / Pro Mensal"
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
                  required
                  value={novoForm.quantidadeTotal}
                  onChange={(e) => setNovoForm({ ...novoForm, quantidadeTotal: Number(e.target.value) })}
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Valor (R$) *</Label>
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
                <Label className="text-xs">Data de Vencimento / Renovação</Label>
                <Input
                  type="date"
                  value={novoForm.vencimento}
                  onChange={(e) => setNovoForm({ ...novoForm, vencimento: e.target.value })}
                  className="text-xs h-8"
                />
              </div>
            </div>

            {/* PAINEL DE INTEGRAÇÃO FINANCEIRA */}
            <div className="space-y-2.5 p-3 rounded-lg border bg-orange-500/5 dark:bg-orange-950/20 border-orange-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-orange-700 dark:text-orange-300">
                  <Receipt className="w-4 h-4" />
                  Gerar Despesa em Contas a Pagar
                </div>
                <Switch
                  checked={novoForm.gerarContaPagar}
                  onCheckedChange={(checked) => setNovoForm({ ...novoForm, gerarContaPagar: checked })}
                />
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-orange-500/10">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                  <User className="w-4 h-4" />
                  Repassar / Faturar para Cliente (Contas a Receber)
                </div>
                <Switch
                  checked={novoForm.gerarContaReceber}
                  onCheckedChange={(checked) => setNovoForm({ ...novoForm, gerarContaReceber: checked })}
                />
              </div>

              {novoForm.gerarContaReceber && (
                <div className="space-y-1 pt-1">
                  <Label className="text-[11px] font-semibold">Cliente a ser Faturado *</Label>
                  <Input
                    required={novoForm.gerarContaReceber}
                    placeholder="Informe o nome do Cliente Corporativo"
                    value={novoForm.clienteNome}
                    onChange={(e) => setNovoForm({ ...novoForm, clienteNome: e.target.value })}
                    className="text-xs h-8 bg-card"
                  />
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNovoModalOpen(false)} className="text-xs">
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="text-xs bg-orange-600 hover:bg-orange-700 text-white font-semibold">
                Salvar Licença & Gerar Financeiro
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
