import React, { useState } from 'react';
import { Projeto } from '../../types';
import { useProjetoWorkspaceStore } from '../useProjetoWorkspaceStore';
import { ProjectRequirement, TipoRequisito, PrioridadeRequisito, StatusRequisito } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { 
  FileCheck, 
  Plus, 
  Search, 
  Trash2, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileCode2,
  Shield,
  Cpu
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface ProjectRequisitosTabProps {
  projeto: Projeto;
  onNavigateTab: (tabId: string) => void;
}

export function ProjectRequisitosTab({ projeto, onNavigateTab }: ProjectRequisitosTabProps) {
  const { requirements, addRequirement, updateRequirement, deleteRequirement, addBacklogItem } = useProjetoWorkspaceStore(projeto);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('Todos');
  const [openModal, setOpenModal] = useState(false);

  // Form State
  const [tipo, setTipo] = useState<TipoRequisito>('Funcional');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('Core');
  const [prioridade, setPrioridade] = useState<PrioridadeRequisito>('Essencial');
  const [status, setStatus] = useState<StatusRequisito>('Especificado');
  const [responsavel, setResponsavel] = useState(projeto.responsavelPrincipal || '');
  const [versao, setVersao] = useState('1.0');

  const filteredRequirements = requirements.filter(req => {
    const matchesSearch = (req.codigo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (req.titulo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (req.descricao || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filterTipo === 'Todos' || req.tipo === filterTipo;
    return matchesSearch && matchesTipo;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    addRequirement({
      tipo,
      titulo,
      descricao,
      categoria: categoria || 'Geral',
      prioridade,
      status,
      responsavel: responsavel || undefined,
      versao: versao || '1.0',
    });

    setTitulo('');
    setDescricao('');
    setCategoria('Core');
    setOpenModal(false);
  };

  const handleConvertToBacklog = (req: ProjectRequirement) => {
    addBacklogItem({
      titulo: `[${req.codigo}] ${req.titulo}`,
      descricao: req.descricao,
      tipo: req.tipo === 'Técnico' ? 'Técnica' : 'Feature',
      prioridade: req.prioridade === 'Essencial' ? 'Alta' : 'Média',
      complexidade: 'M',
      storyPoints: 5,
      estimativaHoras: 16,
      requisitoId: req.id,
      status: 'Pronto para Sprint',
      responsavel: req.responsavel,
    });
  };

  const getTipoBadge = (tipo: TipoRequisito) => {
    switch (tipo) {
      case 'Funcional':
        return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 gap-1"><Layers className="w-3 h-3" /> RF (Funcional)</Badge>;
      case 'Não Funcional':
        return <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20 gap-1"><Shield className="w-3 h-3" /> RNF (Não Funcional)</Badge>;
      case 'Técnico':
        return <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 gap-1"><Cpu className="w-3 h-3" /> RT (Técnico)</Badge>;
    }
  };

  const getStatusBadge = (status: StatusRequisito) => {
    switch (status) {
      case 'Aprovado':
        return <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">Aprovado</Badge>;
      case 'Em Desenvolvimento':
        return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">Em Desenvolvimento</Badge>;
      case 'Testado':
        return <Badge className="bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20">Testado & Validado</Badge>;
      case 'Especificado':
        return <Badge variant="outline" className="bg-muted">Especificado</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner de Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-medium">Requisitos Funcionais</span>
              <div className="text-2xl font-bold text-blue-600">{requirements.filter(r => r.tipo === 'Funcional').length}</div>
              <p className="text-[11px] text-muted-foreground">Regras de negócio e telas</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600">
              <Layers className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-medium">Não Funcionais (RNF)</span>
              <div className="text-2xl font-bold text-purple-600">{requirements.filter(r => r.tipo === 'Não Funcional').length}</div>
              <p className="text-[11px] text-muted-foreground">Segurança, SLA e performance</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-600">
              <Shield className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-medium">Requisitos Técnicos (RT)</span>
              <div className="text-2xl font-bold text-amber-600">{requirements.filter(r => r.tipo === 'Técnico').length}</div>
              <p className="text-[11px] text-muted-foreground">Banco, arquitetura e APIs</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600">
              <Cpu className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-medium">Requisitos Aprovados</span>
              <div className="text-2xl font-bold text-emerald-600">{requirements.filter(r => r.status === 'Aprovado' || r.status === 'Testado').length}</div>
              <p className="text-[11px] text-muted-foreground">Prontos ou em execução</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Requirements List */}
      <Card className="rounded-2xl border shadow-xs bg-card">
        <CardHeader className="pb-3 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-orange-500" /> Matriz de Requisitos do Sistema
            </CardTitle>
            <CardDescription className="text-xs">
              Rastreabilidade de requisitos funcionais, não funcionais e técnicos vinculados ao Backlog.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-48 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input 
                placeholder="Buscar código ou título..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="pl-8 text-xs h-8 rounded-xl"
              />
            </div>

            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="h-8 text-xs rounded-xl w-32">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos os Tipos</SelectItem>
                <SelectItem value="Funcional">Funcional (RF)</SelectItem>
                <SelectItem value="Não Funcional">Não Funcional (RNF)</SelectItem>
                <SelectItem value="Técnico">Técnico (RT)</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={openModal} onOpenChange={setOpenModal}>
              <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 font-bold text-xs h-8 shadow-xs cursor-pointer">
                  <Plus className="w-3.5 h-3.5" /> Novo Requisito
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-base font-bold flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-orange-500" /> Cadastrar Novo Requisito
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSave} className="space-y-4 pt-2 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="font-semibold">Tipo de Requisito *</Label>
                      <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
                        <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Funcional">Funcional (RF) — Comportamento</SelectItem>
                          <SelectItem value="Não Funcional">Não Funcional (RNF) — Desempenho/Segurança</SelectItem>
                          <SelectItem value="Técnico">Técnico (RT) — Arquitetura/DB/API</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold">Categoria / Módulo</Label>
                      <Input 
                        placeholder="Ex: Autenticação, Fiscal, Relatórios" 
                        value={categoria} 
                        onChange={e => setCategoria(e.target.value)} 
                        className="rounded-xl h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-semibold">Título do Requisito *</Label>
                    <Input 
                      placeholder="Ex: O sistema deve permitir emissão de nota fiscal em lote" 
                      value={titulo} 
                      onChange={e => setTitulo(e.target.value)} 
                      required 
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-semibold">Descrição Detalhada / Regra de Negócio</Label>
                    <Textarea 
                      placeholder="Detalhes de validação, critérios de aceite e especificações técnicas..." 
                      value={descricao} 
                      onChange={e => setDescricao(e.target.value)} 
                      className="rounded-xl h-24 text-xs resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="font-semibold">Prioridade</Label>
                      <Select value={prioridade} onValueChange={(v: any) => setPrioridade(v)}>
                        <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Essencial">Essencial (Must have)</SelectItem>
                          <SelectItem value="Importante">Importante (Should have)</SelectItem>
                          <SelectItem value="Desejável">Desejável (Nice to have)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold">Status Inicial</Label>
                      <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                        <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Especificado">Especificado</SelectItem>
                          <SelectItem value="Pendente">Pendente</SelectItem>
                          <SelectItem value="Em Desenvolvimento">Em Desenvolvimento</SelectItem>
                          <SelectItem value="Aprovado">Aprovado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold">Versão</Label>
                      <Input 
                        value={versao} 
                        onChange={e => setVersao(e.target.value)} 
                        className="rounded-xl h-9 text-xs"
                      />
                    </div>
                  </div>

                  <DialogFooter className="pt-3">
                    <Button type="button" variant="outline" onClick={() => setOpenModal(false)} className="rounded-xl text-xs h-8">
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs h-8">
                      Salvar Requisito
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="p-5">
          {filteredRequirements.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-2xl p-6">
              <FileCheck className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-foreground">Nenhum requisito cadastrado</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Cadastre os requisitos funcionais, não funcionais e técnicos para manter o escopo alinhado com o cliente.
              </p>
              <Button 
                onClick={() => setOpenModal(true)} 
                variant="outline" 
                size="sm" 
                className="mt-4 rounded-xl text-xs gap-1.5 font-semibold text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/20"
              >
                <Plus className="w-3.5 h-3.5" /> Criar Primeiro Requisito
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequirements.map((req) => (
                <div 
                  key={req.id} 
                  className="p-4 rounded-2xl border bg-card hover:border-orange-500/40 transition-all shadow-2xs space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-2 py-0.5 rounded-lg border border-orange-200 dark:border-orange-900">
                        {req.codigo}
                      </span>
                      {getTipoBadge(req.tipo)}
                      <Badge variant="outline" className="text-[10px]">{req.categoria}</Badge>
                      <h4 className="font-bold text-sm text-foreground">{req.titulo}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(req.status)}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteRequirement(req.id)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive rounded-lg cursor-pointer"
                        title="Excluir requisito"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {req.descricao && (
                    <p className="text-xs text-muted-foreground">{req.descricao}</p>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t text-[11px] text-muted-foreground">
                    <div className="flex flex-wrap items-center gap-3">
                      <span>Prioridade: <strong>{req.prioridade}</strong></span>
                      <span>•</span>
                      <span>Versão: <strong>v{req.versao}</strong></span>
                      {req.responsavel && (
                        <>
                          <span>•</span>
                          <span>Resp: <strong>{req.responsavel}</strong></span>
                        </>
                      )}
                    </div>

                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleConvertToBacklog(req)}
                      className="h-7 text-[11px] rounded-lg gap-1 text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/20 font-semibold"
                    >
                      <ArrowRight className="w-3 h-3" /> Gerar Item no Backlog
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
