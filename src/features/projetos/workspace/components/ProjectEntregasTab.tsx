import React, { useState } from 'react';
import { Projeto } from '../../types';
import { useProjetoWorkspaceStore } from '../useProjetoWorkspaceStore';
import { ProjectDeliverable, StatusEntrega } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { 
  CheckCircle2, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Calendar, 
  UserCheck, 
  Clock, 
  FileCheck2,
  Send,
  Sparkles
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface ProjectEntregasTabProps {
  projeto: Projeto;
  onNavigateTab: (tabId: string) => void;
}

export function ProjectEntregasTab({ projeto }: ProjectEntregasTabProps) {
  const { deliverables, addDeliverable, updateDeliverable, deleteDeliverable } = useProjetoWorkspaceStore(projeto);

  const [openModal, setOpenModal] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataPrevista, setDataPrevista] = useState('');
  const [responsavel, setResponsavel] = useState(projeto.responsavelPrincipal || '');
  const [linkEntrega, setLinkEntrega] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    addDeliverable({
      nome,
      descricao,
      dataPrevista: dataPrevista || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      responsavel: responsavel || projeto.responsavelPrincipal,
      status: 'Em Desenvolvimento',
      linkEntrega: linkEntrega || undefined,
    });

    setNome('');
    setDescricao('');
    setLinkEntrega('');
    setOpenModal(false);
  };

  const getStatusBadge = (status: StatusEntrega) => {
    switch (status) {
      case 'Entregue':
      case 'Aprovada':
        return <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 gap-1"><CheckCircle2 className="w-3 h-3" /> Entregue & Aprovada</Badge>;
      case 'Pronta para Validação':
        return <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20 gap-1"><Send className="w-3 h-3" /> Aguardando Validação</Badge>;
      case 'Em Desenvolvimento':
        return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 gap-1"><Clock className="w-3 h-3" /> Em Desenvolvimento</Badge>;
      default:
        return <Badge variant="secondary">Planejada</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Card */}
      <Card className="rounded-2xl border shadow-xs bg-card">
        <CardHeader className="pb-3 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-orange-500" /> Pipeline de Entregas & Releases
            </CardTitle>
            <CardDescription className="text-xs">
              Validação, links de homologação e aprovação formal dos entregáveis do projeto {projeto.codigo}.
            </CardDescription>
          </div>

          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 font-bold text-xs h-8 shadow-xs cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> Nova Entrega
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-orange-500" /> Cadastrar Novo Entregável
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4 pt-2 text-xs">
                <div className="space-y-1.5">
                  <Label className="font-semibold">Nome da Entrega / Release *</Label>
                  <Input 
                    placeholder="Ex: Release v1.2 — Checkout Transparente e PIX" 
                    value={nome} 
                    onChange={e => setNome(e.target.value)} 
                    required 
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold">Descrição / Escopo da Release</Label>
                  <Textarea 
                    placeholder="Especificações das funcionalidades entregues nesta versão..." 
                    value={descricao} 
                    onChange={e => setDescricao(e.target.value)} 
                    className="rounded-xl h-20 text-xs resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Data Prevista *</Label>
                    <Input 
                      type="date" 
                      value={dataPrevista} 
                      onChange={e => setDataPrevista(e.target.value)} 
                      required 
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Responsável</Label>
                    <Input 
                      value={responsavel} 
                      onChange={e => setResponsavel(e.target.value)} 
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold">Link de Homologação / Produção (Opcional)</Label>
                  <Input 
                    placeholder="https://app-staging.empresa.com" 
                    value={linkEntrega} 
                    onChange={e => setLinkEntrega(e.target.value)} 
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <DialogFooter className="pt-3">
                  <Button type="button" variant="outline" onClick={() => setOpenModal(false)} className="rounded-xl text-xs h-8">
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs h-8">
                    Salvar Entrega
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="p-5">
          {deliverables.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-2xl p-6">
              <FileCheck2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-foreground">Nenhuma entrega cadastrada</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Registre os pacotes de software, deploys e homologações de versão.
              </p>
              <Button 
                onClick={() => setOpenModal(true)} 
                variant="outline" 
                size="sm" 
                className="mt-4 rounded-xl text-xs gap-1.5 font-semibold text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/20"
              >
                <Plus className="w-3.5 h-3.5" /> Criar Primeira Entrega
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {deliverables.map((deliv) => {
                return (
                  <div 
                    key={deliv.id} 
                    className="p-4 rounded-2xl border bg-card hover:border-orange-500/40 transition-all shadow-2xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <h4 className="font-bold text-sm text-foreground">{deliv.nome}</h4>
                        {getStatusBadge(deliv.status)}
                      </div>

                      <div className="flex items-center gap-2">
                        <Select 
                          value={deliv.status} 
                          onValueChange={(newStatus: StatusEntrega) => updateDeliverable(deliv.id, { 
                            status: newStatus,
                            dataEntrega: (newStatus === 'Entregue' || newStatus === 'Aprovada') ? new Date().toISOString().split('T')[0] : undefined,
                            aprovadoPor: (newStatus === 'Entregue' || newStatus === 'Aprovada') ? projeto.responsavelPrincipal : undefined
                          })}
                        >
                          <SelectTrigger className="h-7 text-[11px] rounded-lg w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Planejada">Planejada</SelectItem>
                            <SelectItem value="Em Desenvolvimento">Em Desenvolvimento</SelectItem>
                            <SelectItem value="Pronta para Validação">Pronta para Validação</SelectItem>
                            <SelectItem value="Aprovada">Aprovada</SelectItem>
                            <SelectItem value="Entregue">Entregue</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteDeliverable(deliv.id)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {deliv.descricao && (
                      <p className="text-xs text-muted-foreground">{deliv.descricao}</p>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t text-[11px] text-muted-foreground">
                      <div className="flex flex-wrap items-center gap-3">
                        <span>Previsão: <strong>{new Date(deliv.dataPrevista).toLocaleDateString('pt-BR')}</strong></span>
                        {deliv.dataEntrega && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            • Concluída em: {new Date(deliv.dataEntrega).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                        <span>• Resp: <strong>{deliv.responsavel}</strong></span>
                      </div>

                      {deliv.linkEntrega && (
                        <a href={deliv.linkEntrega} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="h-6 text-[10px] rounded-lg gap-1 text-blue-600">
                            <ExternalLink className="w-3 h-3" /> Acessar Ambiente
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
