import React, { useState } from 'react';
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Calendar,
  User,
  Search,
  FileCheck,
  Trash2,
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
import { useEstoquePatrimonio } from '../hooks/useEstoquePatrimonio';
import { Inventario } from '../types';

export function InventarioView() {
  const { inventarios, addInventario, updateInventario, deleteInventario, estoqueItens } = useEstoquePatrimonio();

  const [isNovoModalOpen, setIsNovoModalOpen] = useState(false);
  const [selectedInventario, setSelectedInventario] = useState<Inventario | null>(null);

  const [novoForm, setNovoForm] = useState({
    titulo: `Inventário de Ativos & Estoque Q${Math.floor((new Date().getMonth() + 3) / 3)} ${new Date().getFullYear()}`,
    responsavelNome: 'Mariana Oliveira (Gestora TI)',
    localizacao: 'Head Office SP - Todos os Setores',
  });

  const validInventarios = (inventarios || []).filter(
    (inv) => inv && (inv.titulo || inv.responsavelNome || inv.dataInicio)
  );

  const handleCreateInventario = (e: React.FormEvent) => {
    e.preventDefault();

    const itensIniciais = (estoqueItens || []).map((item) => ({
      itemId: item.id,
      nome: item.nome,
      codigo: item.codigo,
      quantidadeEsperada: item.quantidade,
      quantidadeFisica: item.quantidade,
      divergencia: 0,
      estado: 'Bom',
      localizacao: item.localizacao || 'Almoxarifado SP',
    }));

    addInventario({
      id: crypto.randomUUID(),
      titulo: novoForm.titulo || `Inventário Q${Math.floor((new Date().getMonth() + 3) / 3)} ${new Date().getFullYear()}`,
      dataInicio: new Date().toISOString().split('T')[0],
      status: 'Em Progresso',
      responsavelId: 'usr-admin',
      responsavelNome: novoForm.responsavelNome || 'Mariana Oliveira (Gestora TI)',
      localizacao: novoForm.localizacao || 'Head Office SP - Todos os Setores',
      divergenciasCount: 0,
      perdasCount: 0,
      danificadosCount: 0,
      itens: itensIniciais,
      createdAt: new Date().toISOString(),
    });

    setIsNovoModalOpen(false);
  };

  const handleConcluirInventario = (invId: string) => {
    updateInventario(invId, {
      status: 'Concluído',
      dataFim: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Campanhas de Inventário Físico</h2>
          <p className="text-xs text-muted-foreground">
            Auditoria física periódica de ativos e estoque, conciliação de divergências e conferência de perdas
          </p>
        </div>
        <Button onClick={() => setIsNovoModalOpen(true)} className="gap-2 text-xs">
          <Plus className="h-4 w-4" /> Nova Campanha de Inventário
        </Button>
      </div>

      {/* LISTA DE CAMPANHAS DE INVENTÁRIO OU EMPTY STATE */}
      {validInventarios.length === 0 ? (
        <Card className="p-8 text-center border-dashed border-2">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <ClipboardList className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-foreground">Nenhuma Campanha de Inventário Criada</h3>
            <p className="text-xs text-muted-foreground max-w-md">
              Inicie a primeira auditoria física de ativos para conferência de estoque, conciliação e histórico de patrimônio.
            </p>
            <Button onClick={() => setIsNovoModalOpen(true)} className="gap-2 text-xs mt-2">
              <Plus className="h-4 w-4" /> Nova Campanha de Inventário
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {validInventarios.map((inv) => (
            <Card key={inv.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">
                      {inv.titulo || 'Campanha de Inventário Físico'}
                    </CardTitle>
                    <CardDescription className="text-xs flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 text-primary" /> {inv.localizacao || 'Matriz SP'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {inv.status === 'Concluído' ? (
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                        Concluído
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">
                        Em Progresso
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-rose-600"
                      onClick={() => deleteInventario(inv.id)}
                      title="Excluir campanha"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-xs p-3 rounded-xl bg-muted/30 border border-border">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Início / Fim</span>
                    <span className="font-semibold text-foreground">
                      {inv.dataInicio || inv.dataFim || new Date().toISOString().split('T')[0]}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Auditor TI</span>
                    <span className="font-semibold text-foreground truncate block">
                      {inv.responsavelNome || 'Mariana Oliveira (TI)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Divergências</span>
                    <span
                      className={`font-bold ${
                        (inv.divergenciasCount || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'
                      }`}
                    >
                      {inv.divergenciasCount ?? 0} item(ns)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1"
                    onClick={() => setSelectedInventario(inv)}
                  >
                    <FileCheck className="h-3.5 w-3.5" /> Ver Detalhes e Checklist
                  </Button>
                  {inv.status === 'Em Progresso' && (
                    <Button
                      size="sm"
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleConcluirInventario(inv.id)}
                    >
                      Finalizar Inventário
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL: NOVA CAMPANHA DE INVENTÁRIO */}
      <Dialog open={isNovoModalOpen} onOpenChange={setIsNovoModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" /> Criar Campanha de Inventário Físico
            </DialogTitle>
            <DialogDescription className="text-xs">
              Inicie um ciclo de auditoria física de ativos para comparar estoques reais com registros contábeis.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateInventario} className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Título da Campanha de Inventário *</Label>
              <Input
                required
                value={novoForm.titulo}
                onChange={(e) => setNovoForm({ ...novoForm, titulo: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Auditor Responsável *</Label>
              <Input
                required
                value={novoForm.responsavelNome}
                onChange={(e) => setNovoForm({ ...novoForm, responsavelNome: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Escopo / Localização Física *</Label>
              <Input
                required
                value={novoForm.localizacao}
                onChange={(e) => setNovoForm({ ...novoForm, localizacao: e.target.value })}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNovoModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm">
                Iniciar Campanha
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: CHECKLIST E DETALHES DO INVENTÁRIO */}
      <Dialog open={!!selectedInventario} onOpenChange={() => setSelectedInventario(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-emerald-600" /> Auditoria Físico-Contábil
            </DialogTitle>
            <DialogDescription className="text-xs">{selectedInventario?.titulo}</DialogDescription>
          </DialogHeader>

          {selectedInventario && (
            <div className="space-y-4 py-2">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs">Item / Código</TableHead>
                    <TableHead className="text-xs text-center">Esperado</TableHead>
                    <TableHead className="text-xs text-center">Físico</TableHead>
                    <TableHead className="text-xs text-center">Divergência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedInventario.itens && selectedInventario.itens.length > 0 ? (
                    selectedInventario.itens.map((it) => (
                      <TableRow key={it.itemId}>
                        <TableCell className="text-xs font-semibold">{it.nome}</TableCell>
                        <TableCell className="text-center text-xs font-mono">{it.quantidadeEsperada}</TableCell>
                        <TableCell className="text-center text-xs font-mono font-bold text-foreground">
                          {it.quantidadeFisica}
                        </TableCell>
                        <TableCell className="text-center text-xs">
                          {it.divergencia === 0 ? (
                            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600">
                              Ok (0)
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px]">
                              {it.divergencia} un
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-xs text-muted-foreground">
                        Todos os ativos físicos conferidos sem divergências registradas.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSelectedInventario(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
