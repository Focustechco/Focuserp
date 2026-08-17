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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEstoquePatrimonio } from '../hooks/useEstoquePatrimonio';

const SOFTWARE_EXEMPLOS = [
  'Microsoft 365',
  'Google Workspace',
  'Adobe Creative Cloud',
  'Figma',
  'ClickUp',
  'GitHub Enterprise',
  'JetBrains All Products',
  'ChatGPT Plus / Team',
  'Canva Pro',
  'AWS Cloud',
  'Microsoft Azure',
  'Outro Software / SaaS',
];

export function LicencasView() {
  const { licencas, addLicenca, updateLicenca, deleteLicenca } = useEstoquePatrimonio();

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

    const qtdTotal = Number(novoForm.quantidadeTotal);
    const qtdUsada = Number(novoForm.quantidadeUsada);
    const qtdDisp = Math.max(0, qtdTotal - qtdUsada);

    addLicenca({
      id: 'lic-' + Date.now(),
      nome: novoForm.nome,
      fabricante: novoForm.fabricante,
      plano: novoForm.plano,
      tipo: novoForm.tipo,
      quantidadeTotal: qtdTotal,
      quantidadeUsada: qtdUsada,
      quantidadeDisponivel: qtdDisp,
      dataCompra: novoForm.dataCompra,
      vencimento: novoForm.vencimento,
      valor: Number(novoForm.valor),
      responsavelNome: novoForm.responsavelNome,
      centroCustoNome: novoForm.centroCustoNome,
      observacoes: novoForm.observacoes,
      createdAt: new Date().toISOString(),
    });

    setIsNovoModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Gestão de Licenças & Softwares SaaS</h2>
          <p className="text-xs text-muted-foreground">
            Controle de assinaturas corporativas, contagem de assentos (seats), vencimentos e custos por software
          </p>
        </div>
        <Button onClick={() => setIsNovoModalOpen(true)} className="gap-2 text-xs">
          <Plus className="h-4 w-4" /> Cadastrar Licenca / SaaS
        </Button>
      </div>

      {/* SEARCH BAR */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do software, fabricante (ex: Microsoft, Adobe, AWS) ou plano..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* CARDS VISUAIS DE LICENÇAS CRÍTICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredLicencas.map((lic) => {
          const percUsado = Math.round((lic.quantidadeUsada / lic.quantidadeTotal) * 100);
          const isProximoVencimento =
            lic.vencimento &&
            (new Date(lic.vencimento).getTime() - new Date().getTime()) / (1000 * 3600 * 24) <= 60;

          return (
            <Card key={lic.id} className="hover:shadow-md transition-shadow relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground truncate max-w-[200px]">
                      {lic.nome}
                    </CardTitle>
                    <CardDescription className="text-[11px] font-medium text-primary">
                      {lic.fabricante} • {lic.plano}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {lic.tipo}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Ocupação de Assentos</span>
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
                    <span className="text-[10px] text-muted-foreground block">Valor Unitário/Mensal</span>
                    <span className="font-bold text-foreground">
                      R$ {lic.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Renovação / Vencimento</span>
                    <span
                      className={`font-semibold ${
                        isProximoVencimento ? 'text-rose-600 font-bold' : 'text-foreground'
                      }`}
                    >
                      {lic.vencimento ? new Date(lic.vencimento).toLocaleDateString('pt-BR') : 'Perpétua'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                    CC: {lic.centroCustoNome || 'Geral'}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-rose-600"
                    onClick={() => deleteLicenca(lic.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* MODAL: NOVA LICENÇA */}
      <Dialog open={isNovoModalOpen} onOpenChange={setIsNovoModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-indigo-600" /> Cadastrar Licença de Software / SaaS
            </DialogTitle>
            <DialogDescription className="text-xs">
              Registre subscrições corporativas como Microsoft 365, Google Workspace, Adobe, Figma, etc.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateLicenca} className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Nome do Software / Produto *</Label>
              <Input
                required
                placeholder="Ex: Microsoft 365 Business Premium"
                value={novoForm.nome}
                onChange={(e) => setNovoForm({ ...novoForm, nome: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Fabricante *</Label>
                <Input
                  required
                  placeholder="Ex: Microsoft, Google, Adobe"
                  value={novoForm.fabricante}
                  onChange={(e) => setNovoForm({ ...novoForm, fabricante: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Plano / Versão *</Label>
                <Input
                  required
                  placeholder="Ex: Business Premium / Annual"
                  value={novoForm.plano}
                  onChange={(e) => setNovoForm({ ...novoForm, plano: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Qtd Total Seats *</Label>
                <Input
                  type="number"
                  min="1"
                  required
                  value={novoForm.quantidadeTotal}
                  onChange={(e) => setNovoForm({ ...novoForm, quantidadeTotal: Number(e.target.value) })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Qtd Utilizada *</Label>
                <Input
                  type="number"
                  min="0"
                  required
                  value={novoForm.quantidadeUsada}
                  onChange={(e) => setNovoForm({ ...novoForm, quantidadeUsada: Number(e.target.value) })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Valor Seat/Mês (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={novoForm.valor}
                  onChange={(e) => setNovoForm({ ...novoForm, valor: Number(e.target.value) })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Data da Compra</Label>
                <Input
                  type="date"
                  value={novoForm.dataCompra}
                  onChange={(e) => setNovoForm({ ...novoForm, dataCompra: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data de Renovação</Label>
                <Input
                  type="date"
                  value={novoForm.vencimento}
                  onChange={(e) => setNovoForm({ ...novoForm, vencimento: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Centro de Custo / Setor</Label>
              <Input
                placeholder="Ex: Engenharia de Software"
                value={novoForm.centroCustoNome}
                onChange={(e) => setNovoForm({ ...novoForm, centroCustoNome: e.target.value })}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNovoModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm">
                Cadastrar Licença
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
