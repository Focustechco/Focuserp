import React, { useState } from 'react';
import { Projeto } from '../projetos/types';
import { ItemBacklog, BugItem, SprintDelivery } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  Code2,
  Bug,
  Rocket,
  ArrowRight,
  GitBranch,
  FolderKanban,
  Users,
  CheckCircle2,
} from 'lucide-react';

interface ProjetosDeliveryListProps {
  projetosTecnicos: Projeto[];
  backlogItems: ItemBacklog[];
  bugs: BugItem[];
  sprints: SprintDelivery[];
  onSelectProjeto: (projeto: Projeto) => void;
}

export function ProjetosDeliveryList({
  projetosTecnicos,
  backlogItems,
  bugs,
  sprints,
  onSelectProjeto,
}: ProjetosDeliveryListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProjetos = projetosTecnicos.filter((p) => {
    if (!p) return false;
    const search = searchTerm.toLowerCase();
    return (p.nome || '').toLowerCase().includes(search) ||
           (p.codigo || '').toLowerCase().includes(search) ||
           (p.tipo || '').toLowerCase().includes(search);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* BARRA DE PESQUISA */}
      <Card className="border-border/80">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar workspace de desenvolvimento por nome, código ou linguagem..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
          <span className="text-xs font-semibold text-muted-foreground shrink-0">
            {filteredProjetos.length} Software Workspaces Ativos
          </span>
        </CardContent>
      </Card>

      {/* GRID DE WORKSPACES DE PROJETOS TÉCNICOS */}
      {filteredProjetos.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-2">
            <Code2 className="h-10 w-10 text-muted-foreground/60" />
            <h3 className="text-base font-bold text-foreground">Nenhum projeto de software encontrado</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              Crie um novo projeto do tipo 'Software', 'Sistema' ou 'Aplicativo' no módulo Projetos para gerar seu Workspace de Desenvolvimento automaticamente.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjetos.map((proj) => {
            const projBacklog = backlogItems.filter((b) => b.projetoId === proj.id);
            const projBugs = bugs.filter((b) => b.projetoId === proj.id && b.status !== 'Resolvido' && b.status !== 'Fechado');
            const activeSprint = sprints.find((s) => s.projetoId === proj.id && s.status === 'Em Andamento');

            return (
              <Card
                key={proj.id}
                onClick={() => onSelectProjeto(proj)}
                className="group hover:shadow-xl transition-all cursor-pointer border-border/80 flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Top Bar Header */}
                  <div className="h-3 w-full bg-gradient-to-r from-primary via-blue-600 to-indigo-600" />
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] font-mono font-bold">
                            {proj.codigo}
                          </Badge>
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold">
                            {proj.tipo}
                          </Badge>
                        </div>
                        <CardTitle className="text-base font-extrabold text-foreground group-hover:text-primary transition-colors mt-2">
                          {proj.nome}
                        </CardTitle>
                      </div>
                    </div>
                    <CardDescription className="text-xs line-clamp-2 mt-2">
                      {proj.descricaoGeral || `Desenvolvimento técnico do software ${proj.nome}`}
                    </CardDescription>
                  </CardHeader>
                </div>

                <div>
                  <CardContent className="p-5 pt-0 space-y-3">
                    {/* Status da Sprint Atual */}
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                        Sprint Atual:
                      </span>
                      <span className="text-xs font-extrabold text-foreground block truncate">
                        {activeSprint ? activeSprint.nome : 'Nenhuma sprint em andamento'}
                      </span>
                    </div>

                    {/* Barra de Progresso Global do Projeto */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progresso da Entrega:</span>
                        <span className="font-bold text-foreground">{proj.progressoGlobal || 0}%</span>
                      </div>
                      <Progress value={proj.progressoGlobal || 0} className="h-1.5" />
                    </div>

                    {/* Stats rápidas (Bugs & Backlog) */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Code2 className="h-3.5 w-3.5 text-blue-500" />
                        <span className="font-bold text-foreground">{projBacklog.length}</span> tarefas
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Bug className={`h-3.5 w-3.5 ${projBugs.length > 0 ? 'text-rose-600' : 'text-emerald-500'}`} />
                        <span className={`font-bold ${projBugs.length > 0 ? 'text-rose-600' : 'text-foreground'}`}>
                          {projBugs.length}
                        </span>{' '}
                        bugs
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-4 bg-muted/20 border-t border-border/40 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      Tech Lead: <span className="font-semibold text-foreground">{proj.responsavelPrincipal || 'Lead'}</span>
                    </span>
                    <Button size="sm" variant="ghost" className="text-xs font-bold gap-1 text-primary hover:text-primary">
                      Workspace Técnico <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </CardFooter>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
