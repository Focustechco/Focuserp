import React, { useState } from 'react';
import { Projeto } from '../projetos/types';
import { ItemBacklog, BugItem, SprintDelivery } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Code2,
  Bug,
  Rocket,
  ArrowRight,
  GitBranch,
  Terminal,
  UserCheck,
  CheckCircle2,
  Sparkles,
  Layers,
} from 'lucide-react';

interface ProjetosDeliveryListProps {
  projetosTecnicos?: Projeto[];
  backlogItems?: ItemBacklog[];
  bugs?: BugItem[];
  sprints?: SprintDelivery[];
  onSelectProjeto: (projeto: Projeto) => void;
}

export function ProjetosDeliveryList({
  projetosTecnicos = [],
  backlogItems = [],
  bugs = [],
  sprints = [],
  onSelectProjeto,
}: ProjetosDeliveryListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProjetos = (projetosTecnicos || []).filter((p) => {
    if (!p) return false;
    const search = searchTerm.toLowerCase();
    return (
      (p.nome || '').toLowerCase().includes(search) ||
      (p.codigo || '').toLowerCase().includes(search) ||
      (p.tipo || '').toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* BARRA DE PESQUISA & STATUS */}
      <Card className="border-border/70 bg-card/60 backdrop-blur-md shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar workspace de desenvolvimento por nome, código ou tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 text-xs bg-background/50 border-border/80 rounded-xl focus-visible:ring-primary/40"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-muted-foreground">
              {filteredProjetos.length} {filteredProjetos.length === 1 ? 'Workspace Ativo' : 'Workspaces Ativos'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* GRID DE WORKSPACES DE PROJETOS TÉCNICOS */}
      {filteredProjetos.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-border/80 bg-card/30">
          <CardContent className="flex flex-col items-center justify-center gap-3">
            <div className="p-4 rounded-2xl bg-muted/50 border border-border">
              <Code2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-bold text-foreground">Nenhum projeto de software encontrado</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              Crie um novo projeto do tipo 'Software', 'Sistema' ou 'Aplicativo' no módulo Projetos para gerar seu Workspace de Desenvolvimento automaticamente.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjetos.map((proj) => {
            const projBacklog = (backlogItems || []).filter((b) => b && b.projetoId === proj.id);
            const projBugs = (bugs || []).filter(
              (b) => b && b.projetoId === proj.id && b.status !== 'Resolvido' && b.status !== 'Fechado'
            );
            const activeSprint = (sprints || []).find(
              (s) => s && s.projetoId === proj.id && s.status === 'Em Andamento'
            );
            const progresso = Math.min(100, Math.max(0, proj.progressoGlobal || 0));

            return (
              <Card
                key={proj.id}
                onClick={() => onSelectProjeto(proj)}
                className="group relative bg-card/80 hover:bg-card border-border/70 hover:border-primary/50 shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 rounded-2xl flex flex-col justify-between overflow-hidden cursor-pointer hover:-translate-y-1"
              >
                {/* Top Accent Gradient Bar com Shine */}
                <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-amber-500 to-primary group-hover:from-primary group-hover:via-blue-500 group-hover:to-indigo-500 transition-all duration-500" />

                <div>
                  <CardHeader className="p-5 pb-3 space-y-2.5">
                    {/* Tags e Badges no Topo */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-muted text-foreground border border-border/80 tracking-wider">
                          {proj.codigo || 'PRJ'}
                        </span>
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          {proj.tipo || 'Software'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping opacity-75" />
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                      </div>
                    </div>

                    {/* Título do Projeto */}
                    <CardTitle className="text-lg font-black text-foreground group-hover:text-primary transition-colors tracking-tight pt-1">
                      {proj.nome}
                    </CardTitle>

                    {/* Descrição */}
                    <CardDescription className="text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed min-h-[34px]">
                      {proj.descricaoGeral || `Desenvolvimento técnico do software ${proj.nome}`}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-5 pt-0 space-y-4">
                    {/* Card de Sprint Atual */}
                    <div className="p-3.5 rounded-xl bg-muted/40 backdrop-blur-sm border border-border/70 group-hover:border-primary/30 transition-colors space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Rocket className="h-3.5 w-3.5 text-primary" />
                          Sprint Atual
                        </span>
                        {activeSprint ? (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Em Andamento
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-muted-foreground">Planejamento</span>
                        )}
                      </div>
                      <div className="text-xs font-extrabold text-foreground truncate flex items-center gap-2">
                        {activeSprint ? activeSprint.nome : 'Sprint 1 - Início & Arquitetura ' + (proj.codigo || '')}
                      </div>
                    </div>

                    {/* Barra de Progresso Refinada e Grossa */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary/80" />
                          Progresso da Entrega:
                        </span>
                        <span className="font-mono font-black text-xs px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-foreground">
                          {progresso}%
                        </span>
                      </div>

                      {/* Barra de Progresso Customizada - Mais Grossa e Refinada */}
                      <div className="relative h-3.5 w-full rounded-full bg-muted/80 border border-border/80 p-0.5 overflow-hidden shadow-inner">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                          style={{ width: `${Math.max(progresso, 2)}%` }}
                        >
                          {/* Efeito sutil de brilho interno */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/30" />
                        </div>
                      </div>
                    </div>

                    {/* Stats Rápidas (Tarefas & Bugs) em formato de micro-pills */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400 transition-colors group-hover:border-blue-500/40">
                        <Code2 className="h-4 w-4 shrink-0 text-blue-400" />
                        <span className="font-bold text-foreground">{projBacklog.length || 4}</span>
                        <span className="text-[11px] text-muted-foreground">tarefas</span>
                      </div>

                      <div
                        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
                          projBugs.length > 0
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 group-hover:border-rose-500/50'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover:border-emerald-500/40'
                        }`}
                      >
                        <Bug className="h-4 w-4 shrink-0" />
                        <span className="font-bold text-foreground">{projBugs.length}</span>
                        <span className="text-[11px] text-muted-foreground">bugs</span>
                      </div>
                    </div>
                  </CardContent>
                </div>

                {/* Footer do Card */}
                <CardFooter className="p-4 bg-muted/30 border-t border-border/60 flex items-center justify-between backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-[11px] font-black text-primary uppercase">
                      {(proj.responsavelPrincipal || 'L').charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground font-medium">Tech Lead</span>
                      <span className="text-xs font-bold text-foreground truncate max-w-[120px]">
                        {proj.responsavelPrincipal || 'Lead'}
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs font-bold gap-1.5 text-primary hover:text-primary hover:bg-primary/10 rounded-xl px-3 transition-all"
                  >
                    <span>Workspace Técnico</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
