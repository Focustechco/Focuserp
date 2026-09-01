import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FileText, Plus, Download, CheckCircle2, Eye, ShieldCheck, User } from 'lucide-react';
import { useComercialStore } from '../hooks/useComercialStore';
import { PropostaComercial, StatusProposta } from '../types';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Cliente } from '@/features/clientes/types';
import { formatDateBrasilia } from '@/lib/dateUtils';
import { toast } from 'sonner';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function PropostasComerciaisView() {
  const { propostas, produtos, servicos, addProposta, updatePropostaStatus } = useComercialStore();
  const { data: clientes = [] } = useLocalStorageState<Cliente>('focus_clientes', []);

  const [openModal, setOpenModal] = useState(false);
  const [selectedProposta, setSelectedProposta] = useState<PropostaComercial | null>(null);

  // Form State
  const [clienteId, setClienteId] = useState(clientes[0]?.id || '');
  const [responsavelNome, setResponsavelNome] = useState('');
  const [produtoId, setProdutoId] = useState(produtos[0]?.id || '');
  const [qtd, setQtd] = useState('1');
  const [condicoes, setCondicoes] = useState('');

  const handleCreateProposta = () => {
    const selectedCliente = clientes.find(c => c.id === clienteId) || clientes[0];
    const selectedProd = produtos.find(p => p.id === produtoId) || produtos[0];

    const clienteName = selectedCliente?.razaoSocial || selectedCliente?.nomeFantasia || 'Cliente';
    const prodName = selectedProd?.nome || 'Item Comercial';
    const prodPrice = selectedProd?.precoBaseR$ || 0;

    const quantidade = parseInt(qtd) || 1;
    const valorTotal = prodPrice * quantidade;

    addProposta({
      clienteId: selectedCliente?.id || `cli-${Date.now()}`,
      clienteNome: clienteName,
      contatoNome: 'Diretoria / Decisor',
      responsavel: responsavelNome,
      valorTotalR$: valorTotal,
      descontoR$: 0,
      valorFinalR$: valorTotal,
      validadeDias: 30,
      status: 'Em elaboração',
      condicoesPagamento: condicoes,
      itens: [
        {
          id: `it-${Date.now()}`,
          nomeItem: prodName,
          tipo: 'Produto',
          quantidade,
          valorUnitarioR$: prodPrice,
          valorTotalR$: valorTotal
        }
      ]
    });

    setOpenModal(false);
  };

  const handleStatusChange = (id: string, newStatus: StatusProposta) => {
    updatePropostaStatus(id, newStatus);
  };

  return (
    <div className="space-y-6 animate-fade-in pt-1">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
            <FileText className="w-5 h-5 text-orange-500" /> Propostas Comerciais
          </h3>
          <p className="text-xs text-muted-foreground">Elabore, versione e gerencie propostas comerciais com envio e cálculo de aprovação.</p>
        </div>
        <Button onClick={() => setOpenModal(true)} className="gap-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs h-8 shadow-xs">
          <Plus className="w-3.5 h-3.5" /> Nova Proposta
        </Button>
      </div>

      <Card className="rounded-2xl border shadow-xs">
        <CardContent className="pt-4">
          <div className="border rounded-xl overflow-x-auto bg-card text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted/50 border-b text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3">Número Proposta</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Responsável</th>
                  <th className="p-3 text-right">Valor Total</th>
                  <th className="p-3">Data Criação</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {propostas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground text-xs">
                      Nenhuma proposta comercial gerada ainda. Clique em "Nova Proposta" para criar a primeira!
                    </td>
                  </tr>
                ) : (
                  propostas.map(p => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono font-bold text-orange-600">{p.numero}</td>
                      <td className="p-3 font-bold text-foreground">{p.clienteNome}</td>
                      <td className="p-3 text-muted-foreground">{p.responsavel || (p as any).responsavelNome}</td>
                      <td className="p-3 text-right font-extrabold text-emerald-600">
                        {formatCurrency(p.valorFinalR$ || p.valorTotalR$)}
                      </td>
                      <td className="p-3 text-muted-foreground">{formatDateBrasilia(p.dataCriacao)}</td>
                      <td className="p-3 text-center">
                        <Select value={p.status} onValueChange={(v: any) => handleStatusChange(p.id, v)}>
                          <SelectTrigger className="h-7 text-[11px] w-36 rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Em elaboração">Em elaboração</SelectItem>
                            <SelectItem value="Em revisão">Em revisão</SelectItem>
                            <SelectItem value="Aguardando aprovação">Aguardando aprovação</SelectItem>
                            <SelectItem value="Enviada">Enviada</SelectItem>
                            <SelectItem value="Visualizada">Visualizada</SelectItem>
                            <SelectItem value="Em negociação">Em negociação</SelectItem>
                            <SelectItem value="Aprovada">Aprovada</SelectItem>
                            <SelectItem value="Recusada">Recusada</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3 text-right">
                        <Button size="icon" variant="ghost" onClick={() => setSelectedProposta(p)} className="h-7 w-7 rounded-lg">
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Nova Proposta */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <FileText className="w-5 h-5 text-orange-500" /> Gerar Nova Proposta Comercial
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold">Cliente</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                <SelectContent>
                  {clientes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.razaoSocial || c.nomeFantasia}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">Produto / Solução</Label>
                <Select value={produtoId} onValueChange={setProdutoId}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Produto" /></SelectTrigger>
                  <SelectContent>
                    {produtos.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nome} ({formatCurrency(p.precoBaseR$)})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Quantidade</Label>
                <Input type="number" value={qtd} onChange={e => setQtd(e.target.value)} className="rounded-xl" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold">Condições de Pagamento</Label>
              <Input value={condicoes} onChange={e => setCondicoes(e.target.value)} className="rounded-xl" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenModal(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleCreateProposta} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold">Criar Proposta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
