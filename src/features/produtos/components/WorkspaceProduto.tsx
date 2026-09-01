import React, { useState } from 'react';
import { ProdutoFocus, RoadmapItem, FuncionalidadeModulo, ReleaseVersao } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ArrowLeft,
  Boxes,
  Globe,
  GitBranch,
  FileText,
  ExternalLink,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Rocket,
  Plug,
  Layers,
  Heart,
  TrendingUp,
  DollarSign,
  Shield,
  LayoutGrid,
  List,
  Compass,
  Link as LinkIcon,
  BookOpen,
  UserCheck,
} from 'lucide-react';

interface WorkspaceProdutoProps {
  produto: ProdutoFocus;
  metricas: any;
  onBack: () => void;
  onAddRoadmap: (produtoId: string, item: Omit<RoadmapItem, 'id'>) => void;
  onUpdateRoadmapStatus: (produtoId: string, itemId: string, newStatus: RoadmapItem['status']) => void;
  onAddFuncionalidade: (produtoId: string, func: Omit<FuncionalidadeModulo, 'id'>) => void;
  onAddRelease: (produtoId: string, release: Omit<ReleaseVersao, 'id'>) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function WorkspaceProduto({
  produto,
  metricas,
  onBack,
  onAddRoadmap,
  onUpdateRoadmapStatus,
  onAddFuncionalidade,
  onAddRelease,
}: WorkspaceProdutoProps) {
  const [activeTab, setActiveTab] = useState('visao-geral');

  // Form states for modal triggers
  const [novoRoadmapForm, setNovoRoadmapForm] = useState({
    titulo: '',
    descricao: '',
    prioridade: 'Mdia' as RoadmapItem['prioridade'],
    status: 'Planejado' as RoadmapItem['status'],
    dataPrevista: '',
  });

  const handleCreateRoadmap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoRoadmapForm.titulo) return;
    onAddRoadmap(produto.id, {
      titulo: novoRoadmapForm.titulo,
      descricao: novoRoadmapForm.descricao,
      prioridade: novoRoadmapForm.prioridade,
      status: novoRoadmapForm.status,
      dataPrevista: novoRoadmapForm.dataPrevista || new Date().toISOString().split('T')[0],
      responsavel: produto.responsavelPrincipal,
    });
    setNovoRoadmapForm({ titulo: '', descricao: '', prioridade: 'Mdia', status: 'Planejado', dataPrevista: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER DO WORKSPACE SEM CAPA */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Lado esquerdo: boto voltar + logo + nome */}
          <div className="flex items-center gap-4">
            <Button
              onClick={onBack}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs font-semibold shrink-0"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>

            <div className="w-14 h-14 rounded-xl bg-muted border border-border shadow flex items-center justify-center p-2 shrink-0">
              {produto.logoUrl ? (
                <img src={produto.logoUrl} alt={produto.nome} className="w-full h-full object-contain" />
              ) : (
                <Boxes className="w-8 h-8 text-primary" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black tracking-tight text-foreground">{produto.nome}</h1>
                <Badge variant="outline" className="text-xs">{produto.categoria}</Badge>
                <Badge variant="outline" className="font-mono text-xs">{produto.versaoAtual}</Badge>
                <Badge className="bg-emerald-500/90 text-white font-bold text-xs">{produto.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 max-w-2xl">{produto.descricaoBreve}</p>
            </div>
          </div>

          {/* Lado direito: links */}
          <div className="flex items-center gap-2 shrink-0">
            {produto.siteOficial && (
              <Button asChild variant="outline" size="sm" className="text-xs gap-1.5">
                <a href={produto.siteOficial} target="_blank" rel="noreferrer">
                  <Globe className="h-3.5 w-3.5" /> Site Oficial
                </a>
              </Button>
            )}
            {produto.repositorioGit && (
              <Button asChild variant="outline" size="sm" className="text-xs gap-1.5">
                <a href={produto.repositorioGit} target="_blank" rel="noreferrer">
                  <GitBranch className="h-3.5 w-3.5" /> Repositrio Git
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* TABS NATIVAS DO WORKSPACE */}
      <Tabs defaultValue="visao-geral" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="w-full overflow-x-auto scrollbar-hide border-b pb-1">
          <TabsList className="bg-muted/60 p-1 flex w-max min-w-full justify-start gap-1 border border-border">
            <TabsTrigger value="visao-geral" className="text-xs gap-1.5 shrink-0">
              <Boxes className="h-3.5 w-3.5" /> Visão Geral
            </TabsTrigger>
            <TabsTrigger value="roadmap" className="text-xs gap-1.5 shrink-0">
              <Compass className="h-3.5 w-3.5" /> Roadmap
            </TabsTrigger>
            <TabsTrigger value="funcionalidades" className="text-xs gap-1.5 shrink-0">
              <Layers className="h-3.5 w-3.5" /> Funcionalidades & Módulos
            </TabsTrigger>
            <TabsTrigger value="releases" className="text-xs gap-1.5 shrink-0">
              <GitBranch className="h-3.5 w-3.5" /> Versões (Releases)
            </TabsTrigger>
            <TabsTrigger value="implementacoes" className="text-xs gap-1.5 shrink-0">
              <Rocket className="h-3.5 w-3.5" /> Implementações
            </TabsTrigger>
            <TabsTrigger value="clientes" className="text-xs gap-1.5 shrink-0">
              <Users className="h-3.5 w-3.5" /> Clientes
            </TabsTrigger>
            <TabsTrigger value="integracoes" className="text-xs gap-1.5 shrink-0">
              <Plug className="h-3.5 w-3.5" /> Integrações
            </TabsTrigger>
            <TabsTrigger value="equipe" className="text-xs gap-1.5 shrink-0">
              <UserCheck className="h-3.5 w-3.5" /> Equipe
            </TabsTrigger>
            <TabsTrigger value="metricas" className="text-xs gap-1.5 shrink-0">
              <TrendingUp className="h-3.5 w-3.5" /> Métricas & KPIs
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: VISO GERAL & LINKS TEIS */}
        <TabsContent value="visao-geral" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-border/80">
              <CardHeader>
                <CardTitle className="text-base font-bold">Sobre o Produto</CardTitle>
                <CardDescription className="text-xs">Detalhamento do escopo e proposio de valor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <p className="leading-relaxed text-foreground">{produto.descricaoCompleta}</p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-muted/20 border border-border">
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-semibold">Responsvel</span>
                    <span className="font-bold text-foreground">{produto.responsavelPrincipal || 'PO Lead'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-semibold">Data Lanamento</span>
                    <span className="font-bold text-foreground">{produto.dataLancamento}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block uppercase font-semibold">Status do Ciclo</span>
                    <span className="font-bold text-emerald-600">{produto.status}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PAINEL DE LINKS TEIS COM BOTES DE ACESSO RPIDO */}
            <Card className="border-border/80">
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-primary" /> Links teis & Ambientes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {(produto.linksUteis || []).length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhum link til cadastrado.</p>
                ) : (
                  produto.linksUteis.map((lk) => (
                    <a
                      key={lk.id}
                      href={lk.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 rounded-lg border border-border/60 hover:bg-muted/40 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <span className="font-bold text-foreground block group-hover:text-primary transition-colors">
                          {lk.titulo}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{lk.tipo}</span>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                    </a>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: ROADMAP (KANBAN) */}
        <TabsContent value="roadmap" className="space-y-6 outline-none">
          <Card>
            <CardHeader className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-sm font-bold">Roadmap Estratgico de Produto</CardTitle>
                <CardDescription className="text-xs">
                  Acompanhamento de ideias, backlog e entregas planejadas
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {/* Formulrio rpido de criao de item de roadmap */}
              <form onSubmit={handleCreateRoadmap} className="mb-6 p-4 rounded-xl bg-muted/20 border border-border space-y-3">
                <span className="text-xs font-bold block text-foreground">Adicionar Novo Item ao Roadmap</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    required
                    placeholder="Ttulo da funcionalidade..."
                    value={novoRoadmapForm.titulo}
                    onChange={(e) => setNovoRoadmapForm({ ...novoRoadmapForm, titulo: e.target.value })}
                    className="text-xs"
                  />
                  <Input
                    type="date"
                    value={novoRoadmapForm.dataPrevista}
                    onChange={(e) => setNovoRoadmapForm({ ...novoRoadmapForm, dataPrevista: e.target.value })}
                    className="text-xs"
                  />
                  <Button type="submit" size="sm" className="gap-1.5 text-xs font-semibold">
                    <Plus className="h-4 w-4" /> Adicionar ao Roadmap
                  </Button>
                </div>
              </form>

              {/* KANBAN BOARD DO ROADMAP */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Coluna 1: Planejado / Backlog */}
                <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span>Planejado / Backlog</span>
                    <Badge variant="outline" className="text-[10px]">
                      {(produto.roadmap || []).filter((r) => r.status === 'Backlog' || r.status === 'Planejado').length}
                    </Badge>
                  </div>
                  {(produto.roadmap || [])
                    .filter((r) => r.status === 'Backlog' || r.status === 'Planejado')
                    .map((item) => (
                      <Card key={item.id} className="p-3 space-y-2 border-l-4 border-l-blue-500">
                        <h4 className="font-bold text-xs text-foreground">{item.titulo}</h4>
                        <p className="text-[11px] text-muted-foreground">{item.descricao}</p>
                        <div className="flex items-center justify-between text-[10px] pt-1">
                          <Badge variant="secondary">{item.prioridade}</Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[10px]"
                            onClick={() => onUpdateRoadmapItemStatus(produto.id, item.id, 'Em Desenvolvimento')}
                          >
                            Mover para Dev 
                          </Button>
                        </div>
                      </Card>
                    ))}
                </div>

                {/* Coluna 2: Em Desenvolvimento */}
                <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span>Em Desenvolvimento</span>
                    <Badge variant="outline" className="text-[10px]">
                      {(produto.roadmap || []).filter((r) => r.status === 'Em Desenvolvimento' || r.status === 'Em Testes').length}
                    </Badge>
                  </div>
                  {(produto.roadmap || [])
                    .filter((r) => r.status === 'Em Desenvolvimento' || r.status === 'Em Testes')
                    .map((item) => (
                      <Card key={item.id} className="p-3 space-y-2 border-l-4 border-l-amber-500">
                        <h4 className="font-bold text-xs text-foreground">{item.titulo}</h4>
                        <p className="text-[11px] text-muted-foreground">{item.descricao}</p>
                        <div className="flex items-center justify-between text-[10px] pt-1">
                          <Badge variant="secondary">{item.prioridade}</Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[10px]"
                            onClick={() => onUpdateRoadmapItemStatus(produto.id, item.id, 'Concludo')}
                          >
                            Concluir 
                          </Button>
                        </div>
                      </Card>
                    ))}
                </div>

                {/* Coluna 3: Concludo / Publicado */}
                <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span>Publicado / Concludo</span>
                    <Badge variant="outline" className="text-[10px]">
                      {(produto.roadmap || []).filter((r) => r.status === 'Concludo' || r.status === 'Publicado').length}
                    </Badge>
                  </div>
                  {(produto.roadmap || [])
                    .filter((r) => r.status === 'Concludo' || r.status === 'Publicado')
                    .map((item) => (
                      <Card key={item.id} className="p-3 space-y-2 border-l-4 border-l-emerald-500 bg-emerald-500/5">
                        <h4 className="font-bold text-xs text-foreground">{item.titulo}</h4>
                        <p className="text-[11px] text-muted-foreground">{item.descricao}</p>
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600">
                          Finalizado
                        </Badge>
                      </Card>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: FUNCIONALIDADES & MDULOS */}
        <TabsContent value="funcionalidades" className="space-y-6 outline-none">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-bold">Mdulos & Funcionalidades do Produto</CardTitle>
              <CardDescription className="text-xs">Catlogo de submdulos cadastrados</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Nome do Mdulo</TableHead>
                    <TableHead className="text-xs">Descrio</TableHead>
                    <TableHead className="text-xs">Verso</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(produto.funcionalidades || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-xs text-muted-foreground">
                        Nenhum mdulo cadastrado neste produto.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (produto.funcionalidades || []).map((f) => (
                      <TableRow key={f.id}>
                        <TableCell className="font-bold text-xs text-foreground">{f.nome}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{f.descricao}</TableCell>
                        <TableCell className="text-xs font-mono">{f.versao || 'v1.0.0'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600">
                            {f.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: RELEASES */}
        <TabsContent value="releases" className="space-y-6 outline-none">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-bold">Histrico de Releases (Verses)</CardTitle>
              <CardDescription className="text-xs">Registro de changelog, melhorias e correes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(produto.releases || []).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">Nenhuma release registrada.</p>
              ) : (
                (produto.releases || []).map((rel) => (
                  <div key={rel.id} className="p-4 rounded-xl border border-border bg-card space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="font-mono text-xs">{rel.versao}</Badge>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold">
                          {rel.tipo}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{rel.dataPublicacao}</span>
                    </div>
                    <p className="text-xs font-semibold text-foreground">{rel.changelog}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: IMPLEMENTAES */}
        <TabsContent value="implementacoes" className="space-y-6 outline-none">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-bold">Implementaes em Clientes</CardTitle>
              <CardDescription className="text-xs">Sincronizado com o mdulo de Projetos</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Cliente</TableHead>
                    <TableHead className="text-xs">Consultor</TableHead>
                    <TableHead className="text-xs">Progresso</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(produto.implementacoes || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-xs text-muted-foreground">
                        Nenhuma implementao em andamento.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (produto.implementacoes || []).map((imp) => (
                      <TableRow key={imp.id}>
                        <TableCell className="font-bold text-xs text-foreground">{imp.clienteNome}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{imp.consultorResponsavel}</TableCell>
                        <TableCell className="w-44">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-foreground">{imp.progresso}%</span>
                            <Progress value={imp.progresso} className="h-1.5" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {imp.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 6: CLIENTES */}
        <TabsContent value="clientes" className="space-y-6 outline-none">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-bold">Base de Clientes Ativos</CardTitle>
              <CardDescription className="text-xs">
                Integrado nativamente com os mdulos Clientes, Contratos e CS
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Razo Social / Cliente</TableHead>
                    <TableHead className="text-xs">Documento</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metricas.qtdClientesAtivos === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-xs text-muted-foreground">
                        Nenhum cliente associado a este produto.
                      </TableCell>
                    </TableRow>
                  ) : (
                    Array.from({ length: metricas.qtdClientesAtivos }).map((_, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-bold text-xs text-foreground">
                          Cliente Focus Corporativo #{idx + 1}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          12.345.67{idx}/0001-90
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]">
                            Ativo
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 7: INTEGRAES */}
        <TabsContent value="integracoes" className="space-y-6 outline-none">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-bold">Mapa de Integraes do Ecossistema Focus</CardTitle>
              <CardDescription className="text-xs">Conexes de APIs entre os softwares</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(produto.integracoes || []).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">Nenhuma integrao mapeada.</p>
              ) : (
                (produto.integracoes || []).map((int) => (
                  <div key={int.id} className="p-4 rounded-xl border border-border bg-muted/20 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-foreground block">
                        {produto.nome}  {int.produtoDestinoNome}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{int.observacoes}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary">
                      {int.tipoComunicacao}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 8: EQUIPE */}
        <TabsContent value="equipe" className="space-y-6 outline-none">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-bold">Equipe Responsvel pelo Produto</CardTitle>
              <CardDescription className="text-xs">Product Owners, Tech Leads e Desenvolvedores</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(produto.equipe || []).length === 0 ? (
                <p className="text-xs text-muted-foreground col-span-3 text-center py-6">Sem equipe vinculada.</p>
              ) : (
                (produto.equipe || []).map((eq) => (
                  <div key={eq.id} className="p-3 rounded-xl border border-border bg-card flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                      {eq.nome.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-foreground block">{eq.nome}</span>
                      <span className="text-[10px] text-muted-foreground">{eq.papelNoProduto}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 9: MTRICAS & KPIS */}
        <TabsContent value="metricas" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-[11px] font-bold uppercase text-muted-foreground">Receita Mensal (MRR)</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="text-2xl font-black text-emerald-600">{formatCurrency(metricas.mrrTotal)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-[11px] font-bold uppercase text-muted-foreground">Receita Anual (ARR)</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="text-2xl font-black text-foreground">{formatCurrency(metricas.arrTotal)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-[11px] font-bold uppercase text-muted-foreground">NPS Mdio</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="text-2xl font-black text-blue-600">{metricas.npsMedio.toFixed(1)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-[11px] font-bold uppercase text-muted-foreground">Health Score Mdio</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="text-2xl font-black text-purple-600">{metricas.healthScoreMedio.toFixed(0)}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
