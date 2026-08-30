import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, Award, TrendingUp, Target, DollarSign, CheckCircle2, 
  MessageSquare, Calendar, Search, ArrowUpRight, BarChart3, Filter,
  Building2, ExternalLink, Flame, Sparkles, RefreshCw, UserCheck
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { useCrmStore } from '../hooks/useCrmStore';
import { OportunidadeCrm } from '../types';
import { formatDateBrasilia } from '@/lib/dateUtils';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

// Avatar do Usuário ClickUp
function UserAvatar({ name, avatarUrl, size = 'md' }: { name: string; avatarUrl?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = size === 'lg' ? 'w-12 h-12 text-sm' : size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs';

  if (avatarUrl && avatarUrl.trim()) {
    return (
      <img 
        src={avatarUrl} 
        alt={name} 
        className={`${sizeClasses} rounded-full object-cover ring-2 ring-border shadow-xs`}
        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
      />
    );
  }

  const initials = (name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('');

  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = (name || '').charCodeAt(i) + ((hash << 5) - hash);
  }
  const gradients = [
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-amber-600',
    'from-purple-500 to-pink-600',
    'from-rose-500 to-red-600'
  ];
  const grad = gradients[Math.abs(hash) % gradients.length];

  return (
    <div className={`${sizeClasses} rounded-full bg-gradient-to-br ${grad} text-white font-bold flex items-center justify-center shadow-xs shrink-0 ring-1 ring-white/20`}>
      {initials || 'U'}
    </div>
  );
}

export function LeadsView() {
  const { oportunidades, interacoes, config } = useCrmStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserModal, setSelectedUserModal] = useState<string | null>(null);

  // Calcular métricas de desempenho agrupadas por cada responsável real
  const userPerformance = useMemo(() => {
    const userMap = new Map<string, {
      name: string;
      avatar?: string;
      totalCards: number;
      valorTotal: number;
      diagnosticosAgendados: number;
      diagnosticosRealizados: number;
      followUpsRealizados: number;
      fechadosGanhos: number;
      perdidos: number;
      emNegociacao: number;
      cards: OportunidadeCrm[];
    }>();

    oportunidades.forEach(op => {
      const resp = (op.responsavel || 'Equipe Comercial').trim();
      const st = (op.etapa || '').toLowerCase();

      if (!userMap.has(resp)) {
        userMap.set(resp, {
          name: resp,
          avatar: op.responsavelAvatar,
          totalCards: 0,
          valorTotal: 0,
          diagnosticosAgendados: 0,
          diagnosticosRealizados: 0,
          followUpsRealizados: 0,
          fechadosGanhos: 0,
          perdidos: 0,
          emNegociacao: 0,
          cards: []
        });
      }

      const cur = userMap.get(resp)!;
      cur.totalCards += 1;
      cur.valorTotal += op.valorR$ || 0;
      cur.cards.push(op);

      if (!cur.avatar && op.responsavelAvatar) {
        cur.avatar = op.responsavelAvatar;
      }

      // Classificar etapas reais
      if (st.includes('agendado') || st.includes('diagnostico agendado')) {
        cur.diagnosticosAgendados += 1;
      }
      if (st.includes('realizado') || st.includes('diagnostico realizado') || st.includes('apresentad')) {
        cur.diagnosticosRealizados += 1;
      }
      if (st.includes('negocia') || st.includes('fechamento')) {
        cur.emNegociacao += 1;
      }
      if (st.includes('ganh') || st.includes('won') || st.includes('fechad') || st.includes('complet')) {
        cur.fechadosGanhos += 1;
      }
      if (st.includes('perdid') || st.includes('lost') || st.includes('cancel')) {
        cur.perdidos += 1;
      }
    });

    // Somar interações / follow-ups registrados
    interacoes.forEach(it => {
      const resp = (it.responsavel || '').trim();
      if (resp && userMap.has(resp)) {
        userMap.get(resp)!.followUpsRealizados += 1;
      }
    });

    return Array.from(userMap.values()).sort((a, b) => b.totalCards - a.totalCards || b.valorTotal - a.valorTotal);
  }, [oportunidades, interacoes]);

  // Filtrar usuários por busca
  const filteredUsers = useMemo(() => {
    return userPerformance.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [userPerformance, searchTerm]);

  // Totais Gerais
  const totalCardsGeral = oportunidades.length;
  const totalValorGeral = oportunidades.reduce((acc, o) => acc + (o.valorR$ || 0), 0);
  const totalDiagnosticos = userPerformance.reduce((acc, u) => acc + u.diagnosticosAgendados + u.diagnosticosRealizados, 0);
  const totalFollowUps = interacoes.length;

  // Dados para o Gráfico de Comparação de Desempenho
  const chartData = useMemo(() => {
    return userPerformance.map(u => ({
      name: u.name.split(' ')[0],
      'Cards / Oportunidades': u.totalCards,
      'Diagnósticos Realizados': u.diagnosticosRealizados,
      'Ganhos / Fechados': u.fechadosGanhos
    }));
  }, [userPerformance]);

  const activeUserCards = useMemo(() => {
    if (!selectedUserModal) return [];
    return oportunidades.filter(o => o.responsavel === selectedUserModal);
  }, [oportunidades, selectedUserModal]);

  return (
    <div className="space-y-6 animate-fade-in pt-1">
      {/* Cabeçalho da Seção de Desempenho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
            <Award className="w-5 h-5 text-orange-500" /> Desempenho Comercial & Equipe (ClickUp Real)
          </h3>
          <p className="text-xs text-muted-foreground">
            Métricas de produtividade, diagnósticos, reuniões e volume de negócios por responsável.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input 
            placeholder="Buscar por usuário / vendedor..." 
            className="pl-8 h-8 text-xs bg-background rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* KPI Cards de Resumo Global */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="shadow-2xs bg-card border">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Membros Ativos</span>
            <div className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" /> {userPerformance.length} usuários
            </div>
            <p className="text-[10px] text-muted-foreground">Com tarefas atribuídas no ClickUp</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs bg-card border">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Total no Pipeline</span>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalValorGeral)}
            </div>
            <p className="text-[10px] text-muted-foreground">{totalCardsGeral} cards em andamento</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs bg-card border">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Diagnósticos & Reuniões</span>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-500" /> {totalDiagnosticos}
            </div>
            <p className="text-[10px] text-muted-foreground">Agendados e realizados</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs bg-card border">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Follow-ups Registrados</span>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-500" /> {totalFollowUps}
            </div>
            <p className="text-[10px] text-muted-foreground">Interações e contatos efetuados</p>
          </CardContent>
        </Card>
      </div>

      {/* TOP 3 RANKING DE DESEMPENHO */}
      {userPerformance.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {userPerformance.slice(0, 3).map((user, rankIdx) => {
            const medal = rankIdx === 0 ? '🥇 1º Lugar' : rankIdx === 1 ? '🥈 2º Lugar' : '🥉 3º Lugar';
            const borderColors = rankIdx === 0 ? 'border-amber-400/60 bg-amber-50/20 dark:bg-amber-950/10' : 'border-border bg-card';

            return (
              <Card key={user.name} className={`shadow-xs transition-all hover:shadow-md ${borderColors} rounded-2xl`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={user.name} avatarUrl={user.avatar} size="md" />
                      <div>
                        <h4 className="font-bold text-xs text-foreground">{user.name}</h4>
                        <Badge variant="outline" className="text-[9px] mt-0.5 font-bold border-amber-500/40 text-amber-700 dark:text-amber-300">
                          {medal}
                        </Badge>
                      </div>
                    </div>

                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedUserModal(user.name)}
                      className="h-7 text-[10px] gap-1 text-primary hover:bg-primary/10 rounded-lg"
                    >
                      <span>Ver Cards</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center">
                    <div className="p-2 rounded-xl bg-muted/40">
                      <span className="text-[10px] text-muted-foreground block font-medium">Cards</span>
                      <span className="font-extrabold text-xs text-foreground">{user.totalCards}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-muted/40">
                      <span className="text-[10px] text-muted-foreground block font-medium">Diagnósticos</span>
                      <span className="font-extrabold text-xs text-amber-600">{user.diagnosticosAgendados + user.diagnosticosRealizados}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-muted/40">
                      <span className="text-[10px] text-muted-foreground block font-medium">Ganhos</span>
                      <span className="font-extrabold text-xs text-emerald-600">{user.fechadosGanhos}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1 text-[11px]">
                    <span className="text-muted-foreground font-medium">Volume em Carteira:</span>
                    <span className="font-bold text-foreground">{formatCurrency(user.valorTotal)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* TABELA DETALHADA DE DESEMPENHO DOS USUÁRIOS */}
      <Card className="rounded-2xl border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>Quadro Geral de Produtividade por Usuário</span>
            <span className="text-xs font-normal text-muted-foreground">{filteredUsers.length} responsáveis</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Detalhamento de tarefas, diagnósticos agendados e realizados, follow-ups e valor sob gestão.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-xl overflow-x-auto bg-card text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted/50 border-b text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3">Responsável</th>
                  <th className="p-3 text-center">Total de Cards</th>
                  <th className="p-3 text-center">Diagnósticos Agendados</th>
                  <th className="p-3 text-center">Diagnósticos Realizados</th>
                  <th className="p-3 text-center">Follow-ups Registrados</th>
                  <th className="p-3 text-center">Em Negociação</th>
                  <th className="p-3 text-center">Fechado Ganho</th>
                  <th className="p-3 text-right">Valor em Carteira (R$)</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground text-xs">
                      Nenhum usuário encontrado com tarefas no ClickUp.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.name} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar name={user.name} avatarUrl={user.avatar} size="sm" />
                          <div>
                            <div className="font-bold text-foreground text-xs">{user.name}</div>
                            <div className="text-[10px] text-muted-foreground">ClickUp Assignee</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 text-center font-bold text-foreground">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {user.totalCards}
                        </Badge>
                      </td>

                      <td className="p-3 text-center">
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs font-semibold">
                          {user.diagnosticosAgendados}
                        </Badge>
                      </td>

                      <td className="p-3 text-center">
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs font-semibold">
                          {user.diagnosticosRealizados}
                        </Badge>
                      </td>

                      <td className="p-3 text-center font-semibold text-purple-700 dark:text-purple-300">
                        {user.followUpsRealizados} follow-ups
                      </td>

                      <td className="p-3 text-center font-semibold text-indigo-600">
                        {user.emNegociacao}
                      </td>

                      <td className="p-3 text-center">
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-bold">
                          {user.fechadosGanhos}
                        </Badge>
                      </td>

                      <td className="p-3 text-right font-extrabold text-foreground">
                        {formatCurrency(user.valorTotal)}
                      </td>

                      <td className="p-3 text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setSelectedUserModal(user.name)}
                          className="h-7 text-xs gap-1 rounded-lg"
                        >
                          <span>Ver Cards</span>
                          <ArrowUpRight className="w-3 h-3 text-orange-500" />
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

      {/* GRÁFICO COMPARATIVO */}
      {chartData.length > 0 && (
        <Card className="rounded-2xl border shadow-xs">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Comparativo de Volume de Tarefas por Membro da Equipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.15} />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="Cards / Oportunidades" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Diagnósticos Realizados" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Ganhos / Fechados" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Detalhes dos Cards do Usuário Selecionado */}
      <Dialog open={!!selectedUserModal} onOpenChange={(open) => !open && setSelectedUserModal(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Users className="w-5 h-5 text-primary" /> Cards & Oportunidades de {selectedUserModal}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="border rounded-xl overflow-hidden bg-card">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/50 border-b text-[11px] text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-2.5">ID / Tarefa</th>
                    <th className="p-2.5">Cliente / Empresa</th>
                    <th className="p-2.5">Etapa ClickUp</th>
                    <th className="p-2.5 text-right">Valor R$</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {activeUserCards.map(c => (
                    <tr key={c.id} className="hover:bg-muted/30">
                      <td className="p-2.5">
                        <Badge variant="outline" className="font-mono text-[9px] text-orange-600 border-orange-300">
                          {c.clickUpTaskId}
                        </Badge>
                        <div className="font-bold text-foreground text-xs mt-0.5">{c.titulo}</div>
                      </td>
                      <td className="p-2.5 font-medium text-foreground">{c.empresaNome}</td>
                      <td className="p-2.5">
                        <Badge className="text-[10px]" style={{ backgroundColor: c.statusColor || '#94a3b8', color: '#fff' }}>
                          {c.etapa}
                        </Badge>
                      </td>
                      <td className="p-2.5 text-right font-extrabold text-emerald-600">
                        {c.valorR$ > 0 ? formatCurrency(c.valorR$) : 'R$ 0,00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
