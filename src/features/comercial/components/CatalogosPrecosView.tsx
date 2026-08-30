import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Wrench, Layers, Plus, Edit3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useComercialStore } from '../hooks/useComercialStore';
import { ProdutoComercial, ServicoComercial, TabelaPreco } from '../types';
import { toast } from 'sonner';

export function CatalogosPrecosView() {
  const { 
    produtos, servicos, tabelas, 
    addProdutoItem, updateProdutoItem, deleteProdutoItem, 
    addServicoItem, updateServicoItem, deleteServicoItem,
    addTabelaItem, updateTabelaItem, deleteTabelaItem 
  } = useComercialStore();

  // Estados Produto
  const [openProduto, setOpenProduto] = useState(false);
  const [editingProduto, setEditingProduto] = useState<ProdutoComercial | null>(null);
  const [novoProduto, setNovoProduto] = useState<Partial<ProdutoComercial>>({
    categoria: 'ERP',
    status: 'Ativo',
    precoBaseR$: 0,
    precoMinimoR$: 0,
    tipoCobranca: 'Mensal Recorrente (SaaS)'
  });

  // Estados Serviço
  const [openServico, setOpenServico] = useState(false);
  const [editingServico, setEditingServico] = useState<ServicoComercial | null>(null);
  const [novoServico, setNovoServico] = useState<Partial<ServicoComercial>>({
    categoria: 'Implantação',
    status: 'Ativo',
    precoR$: 0,
    tempoMedio: '40 horas'
  });

  // Handlers Produto
  const handleOpenCreateProduto = () => {
    setEditingProduto(null);
    setNovoProduto({
      nome: '',
      codigo: `PRD-${Date.now().toString().slice(-4)}`,
      categoria: 'ERP',
      descricao: '',
      precoBaseR$: 0,
      precoMinimoR$: 0,
      precoSugeridoR$: 0,
      tipoCobranca: 'Mensal Recorrente (SaaS)',
      status: 'Ativo'
    });
    setOpenProduto(true);
  };

  const handleOpenEditProduto = (p: ProdutoComercial) => {
    setEditingProduto(p);
    setNovoProduto({ ...p });
    setOpenProduto(true);
  };

  const handleDeleteProduto = (p: ProdutoComercial) => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${p.nome}"?`)) {
      deleteProdutoItem(p.id);
      toast.success(`Produto "${p.nome}" excluído com sucesso!`);
    }
  };

  const handleSaveProduto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoProduto.nome?.trim()) {
      toast.error('Informe o nome do produto.');
      return;
    }

    if (editingProduto) {
      updateProdutoItem(editingProduto.id, {
        codigo: novoProduto.codigo || editingProduto.codigo,
        nome: novoProduto.nome,
        categoria: novoProduto.categoria || 'ERP',
        descricao: novoProduto.descricao || '',
        precoBaseR$: Number(novoProduto.precoBaseR$) || 0,
        precoMinimoR$: Number(novoProduto.precoMinimoR$) || 0,
        precoSugeridoR$: Number(novoProduto.precoSugeridoR$) || 0,
        tipoCobranca: novoProduto.tipoCobranca || 'Mensal Recorrente (SaaS)',
        status: novoProduto.status || 'Ativo'
      });
      toast.success(`Produto "${novoProduto.nome}" atualizado!`);
    } else {
      addProdutoItem({
        id: `prd-${Date.now()}`,
        codigo: novoProduto.codigo || `PRD-${Date.now().toString().slice(-4)}`,
        nome: novoProduto.nome,
        categoria: novoProduto.categoria || 'ERP',
        descricao: novoProduto.descricao || '',
        precoBaseR$: Number(novoProduto.precoBaseR$) || 0,
        precoMinimoR$: Number(novoProduto.precoMinimoR$) || 0,
        precoSugeridoR$: Number(novoProduto.precoSugeridoR$) || 0,
        tipoCobranca: novoProduto.tipoCobranca || 'Mensal Recorrente (SaaS)',
        status: novoProduto.status || 'Ativo'
      } as ProdutoComercial);
      toast.success(`Produto "${novoProduto.nome}" cadastrado com sucesso!`);
    }

    setOpenProduto(false);
  };

  // Handlers Serviço
  const handleOpenCreateServico = () => {
    setEditingServico(null);
    setNovoServico({
      nome: '',
      codigo: `SRV-${Date.now().toString().slice(-4)}`,
      categoria: 'Implantação',
      descricao: '',
      precoR$: 0,
      tempoMedio: '40 horas',
      status: 'Ativo'
    });
    setOpenServico(true);
  };

  const handleOpenEditServico = (s: ServicoComercial) => {
    setEditingServico(s);
    setNovoServico({ ...s });
    setOpenServico(true);
  };

  const handleDeleteServico = (s: ServicoComercial) => {
    if (window.confirm(`Tem certeza que deseja excluir o serviço "${s.nome}"?`)) {
      deleteServicoItem(s.id);
      toast.success(`Serviço "${s.nome}" excluído com sucesso!`);
    }
  };

  const handleSaveServico = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoServico.nome?.trim()) {
      toast.error('Informe o nome do serviço.');
      return;
    }

    if (editingServico) {
      updateServicoItem(editingServico.id, {
        codigo: novoServico.codigo || editingServico.codigo,
        nome: novoServico.nome,
        categoria: novoServico.categoria || 'Implantação',
        descricao: novoServico.descricao || '',
        precoR$: Number(novoServico.precoR$) || 0,
        tempoMedio: novoServico.tempoMedio || '0 horas',
        status: novoServico.status || 'Ativo'
      });
      toast.success(`Serviço "${novoServico.nome}" atualizado!`);
    } else {
      addServicoItem({
        id: `srv-${Date.now()}`,
        codigo: novoServico.codigo || `SRV-${Date.now().toString().slice(-4)}`,
        nome: novoServico.nome,
        categoria: novoServico.categoria || 'Implantação',
        descricao: novoServico.descricao || '',
        precoR$: Number(novoServico.precoR$) || 0,
        tempoMedio: novoServico.tempoMedio || '0 horas',
        status: novoServico.status || 'Ativo'
      } as ServicoComercial);
      toast.success(`Serviço "${novoServico.nome}" cadastrado!`);
    }

    setOpenServico(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pt-1">
      {/* CATÁLOGO DE PRODUTOS */}
      <Card className="rounded-2xl border shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-500" /> Catálogo de Produtos Comerciais
          </CardTitle>
          <Button onClick={handleOpenCreateProduto} size="sm" className="h-8 gap-1 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs cursor-pointer shadow-xs">
            <Plus className="w-3.5 h-3.5" /> Novo Produto
          </Button>
        </CardHeader>
        <CardContent>
          {produtos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-xl bg-muted/20 text-xs">Nenhum produto cadastrado.</div>
          ) : (
            <div className="border rounded-xl overflow-x-auto bg-card text-xs">
              <table className="w-full text-left">
                <thead className="bg-muted/50 border-b text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3">Código</th>
                    <th className="p-3">Nome do Produto</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3 text-right">Preço Base (R$)</th>
                    <th className="p-3 text-right">Preço Mínimo (R$)</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {produtos.map(p => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono font-bold text-muted-foreground">{p.codigo}</td>
                      <td className="p-3 font-bold text-foreground">{p.nome}</td>
                      <td className="p-3"><Badge variant="outline">{p.categoria}</Badge></td>
                      <td className="p-3 text-right font-bold text-emerald-600">
                        R$ {p.precoBaseR$.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right text-muted-foreground font-mono">
                        R$ {p.precoMinimoR$.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-center">
                        <Badge className={`text-[10px] ${p.status === 'Ativo' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200' : 'bg-muted text-muted-foreground'}`}>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleOpenEditProduto(p)}
                            className="h-7 w-7 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                            title="Editar Produto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteProduto(p)}
                            className="h-7 w-7 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            title="Excluir Produto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Criar / Editar Produto */}
      <Dialog open={openProduto} onOpenChange={setOpenProduto}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Package className="w-5 h-5 text-orange-500" /> {editingProduto ? 'Editar Produto Comercial' : 'Adicionar Novo Produto'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveProduto} className="space-y-3.5 pt-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label className="font-semibold">Nome do Produto *</Label>
                <Input required value={novoProduto.nome || ''} onChange={e => setNovoProduto({...novoProduto, nome: e.target.value})} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">Código</Label>
                <Input placeholder="Ex: PRD-001" value={novoProduto.codigo || ''} onChange={e => setNovoProduto({...novoProduto, codigo: e.target.value})} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">Categoria</Label>
                <Select value={novoProduto.categoria} onValueChange={(val: any) => setNovoProduto({...novoProduto, categoria: val})}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ERP">ERP</SelectItem>
                    <SelectItem value="CRM">CRM</SelectItem>
                    <SelectItem value="BI">BI</SelectItem>
                    <SelectItem value="Automação">Automação</SelectItem>
                    <SelectItem value="Aplicativo">Aplicativo</SelectItem>
                    <SelectItem value="Portal">Portal</SelectItem>
                    <SelectItem value="Consultoria">Consultoria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">Preço Base (R$)</Label>
                <Input type="number" required min="0" step="0.01" value={novoProduto.precoBaseR$ || ''} onChange={e => setNovoProduto({...novoProduto, precoBaseR$: Number(e.target.value)})} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">Preço Mínimo (R$)</Label>
                <Input type="number" required min="0" step="0.01" value={novoProduto.precoMinimoR$ || ''} onChange={e => setNovoProduto({...novoProduto, precoMinimoR$: Number(e.target.value)})} className="rounded-xl" />
              </div>
              {editingProduto && (
                <div className="space-y-1.5 col-span-2">
                  <Label className="font-semibold">Status do Produto</Label>
                  <Select value={novoProduto.status} onValueChange={(val: any) => setNovoProduto({...novoProduto, status: val})}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Descontinuado">Descontinuado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenProduto(false)} className="rounded-xl">Cancelar</Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold">
                {editingProduto ? 'Atualizar Produto' : 'Salvar Produto'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CATÁLOGO DE SERVIÇOS */}
      <Card className="rounded-2xl border shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-500" /> Catálogo de Serviços Comerciais
          </CardTitle>
          <Button onClick={handleOpenCreateServico} size="sm" variant="outline" className="h-8 gap-1 rounded-xl font-semibold text-xs cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> Novo Serviço
          </Button>
        </CardHeader>
        <CardContent>
          {servicos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-xl bg-muted/20 text-xs">Nenhum serviço cadastrado.</div>
          ) : (
            <div className="border rounded-xl overflow-x-auto bg-card text-xs">
              <table className="w-full text-left">
                <thead className="bg-muted/50 border-b text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3">Código</th>
                    <th className="p-3">Serviço</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3">Tempo Médio</th>
                    <th className="p-3 text-right">Preço R$</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {servicos.map(s => (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono font-bold text-muted-foreground">{s.codigo}</td>
                      <td className="p-3 font-bold text-foreground">{s.nome}</td>
                      <td className="p-3"><Badge variant="outline">{s.categoria}</Badge></td>
                      <td className="p-3 text-muted-foreground">{s.tempoMedio}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">
                        R$ {s.precoR$.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-center">
                        <Badge className={`text-[10px] ${s.status === 'Ativo' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200' : 'bg-muted text-muted-foreground'}`}>
                          {s.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleOpenEditServico(s)}
                            className="h-7 w-7 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                            title="Editar Serviço"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteServico(s)}
                            className="h-7 w-7 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            title="Excluir Serviço"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Criar / Editar Serviço */}
      <Dialog open={openServico} onOpenChange={setOpenServico}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Wrench className="w-5 h-5 text-blue-500" /> {editingServico ? 'Editar Serviço Comercial' : 'Adicionar Novo Serviço'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveServico} className="space-y-3.5 pt-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label className="font-semibold">Nome do Serviço *</Label>
                <Input required value={novoServico.nome || ''} onChange={e => setNovoServico({...novoServico, nome: e.target.value})} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">Código</Label>
                <Input placeholder="Ex: SRV-001" value={novoServico.codigo || ''} onChange={e => setNovoServico({...novoServico, codigo: e.target.value})} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">Categoria</Label>
                <Select value={novoServico.categoria} onValueChange={(val: any) => setNovoServico({...novoServico, categoria: val})}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Implantação">Implantação</SelectItem>
                    <SelectItem value="Treinamento">Treinamento</SelectItem>
                    <SelectItem value="Consultoria">Consultoria</SelectItem>
                    <SelectItem value="Discovery">Discovery</SelectItem>
                    <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                    <SelectItem value="Suporte">Suporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">Preço Base (R$)</Label>
                <Input type="number" required min="0" step="0.01" value={novoServico.precoR$ || ''} onChange={e => setNovoServico({...novoServico, precoR$: Number(e.target.value)})} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">Tempo Médio</Label>
                <Input placeholder="Ex: 40 horas" required value={novoServico.tempoMedio || ''} onChange={e => setNovoServico({...novoServico, tempoMedio: e.target.value})} className="rounded-xl" />
              </div>
              {editingServico && (
                <div className="space-y-1.5 col-span-2">
                  <Label className="font-semibold">Status do Serviço</Label>
                  <Select value={novoServico.status} onValueChange={(val: any) => setNovoServico({...novoServico, status: val})}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenServico(false)} className="rounded-xl">Cancelar</Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold">
                {editingServico ? 'Atualizar Serviço' : 'Salvar Serviço'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
