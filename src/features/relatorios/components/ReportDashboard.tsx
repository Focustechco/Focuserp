import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calendar, Download, Share2, Star, Clock, CheckCircle2, TrendingUp, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useRelatoriosStore } from '../hooks/useRelatoriosStore';

export function ReportDashboard() {
  const { history, favorites, schedules, catalog } = useRelatoriosStore();

  const relatoriosHoje = history.filter(h => new Date(h.generatedAt).toDateString() === new Date().toDateString()).length;
  const relatoriosMes = history.length;
  const totalExportacoes = history.length;
  const agendamentosAtivos = schedules.filter(s => s.status === 'Ativo').length;
  const totalFavoritos = catalog.filter((c) => favorites.includes(c.id)).length;

  // Gráfico 1: Relatórios por Módulo/Categoria
  const categoryCounts: Record<string, number> = {};
  catalog.forEach(c => {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
  });

  const categoryData = Object.entries(categoryCounts).map(([name, count]) => ({
    name,
    qtd: count
  }));

  // Gráfico 2: Exportações por Formato
  const formatCounts: Record<string, number> = { PDF: 14, XLSX: 8, DOCX: 5, CSV: 3 };
  history.forEach(h => {
    formatCounts[h.format] = (formatCounts[h.format] || 0) + 1;
  });

  const formatColors: Record<string, string> = {
    PDF: '#ef4444',
    XLSX: '#10b981',
    DOCX: '#3b82f6',
    CSV: '#f59e0b'
  };

  const formatData = Object.entries(formatCounts).map(([name, value]) => ({
    name,
    value,
    color: formatColors[name] || '#94a3b8'
  }));

  return (
    <div className="flex flex-col space-y-6 animate-fade-in">
      {/* Cards de Métricas Principais */}
      <div className="order-2 md:order-1 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Gerados Hoje</CardTitle>
            <Clock className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{relatoriosHoje}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Emissões no dia</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Relatórios do Mês</CardTitle>
            <FileText className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{relatoriosMes}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Acumulado mensal</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Exportações</CardTitle>
            <Download className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExportacoes}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Downloads realizados</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Agendamentos</CardTitle>
            <Calendar className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{agendamentosAtivos}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Recorrências ativas</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Compartilhados</CardTitle>
            <Share2 className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Links ativos</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Favoritos</CardTitle>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFavoritos}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Modelos salvos</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos do Dashboard */}
      <div className="order-1 md:order-2 grid gap-6 md:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Catálogo de Relatórios por Módulo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip />
                  <Bar dataKey="qtd" name="Qtd de Relatórios" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Exportações por Formato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={formatData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {formatData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(val) => [`${val} downloads`, 'Quantidade']} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
