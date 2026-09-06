import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Network, CheckCircle2, AlertTriangle, Zap, Webhook, Key, Activity, BarChart3, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useIntegracoesStore } from '../hooks/useIntegracoesStore';

export function HubDashboard() {
  const { conectores, webhooks, apiKeys, logs } = useIntegracoesStore();

  const totalAtivas = conectores.filter(c => c.status === 'Conectado').length;
  const totalAtencao = conectores.filter(c => c.status === 'Atencao').length;
  const totalDesconectados = conectores.filter(c => c.status === 'Desconectado').length;
  const webhooksAtivos = webhooks.filter(w => w.status === 'Ativo').length;
  const totalKeys = apiKeys.length;
  const errosLog = logs.filter(l => l.status === 'Erro').length;

  // Gráfico 1: Conectores por Categoria
  const catCounts: Record<string, number> = {};
  conectores.forEach(c => {
    catCounts[c.categoria] = (catCounts[c.categoria] || 0) + 1;
  });

  const categoryData = Object.entries(catCounts).map(([name, value]) => ({
    name,
    value
  }));

  // Gráfico 2: Chamadas API por Dia (Mocked Timeline)
  const apiCallsData = [
    { dia: 'Seg', chamadas: 1420, erros: 2 },
    { dia: 'Ter', chamadas: 1890, erros: 1 },
    { dia: 'Qua', chamadas: 2300, erros: 0 },
    { dia: 'Qui', chamadas: 1950, erros: 4 },
    { dia: 'Sex', chamadas: 2780, erros: 2 },
    { dia: 'Sáb', chamadas: 890, erros: 0 },
    { dia: 'Dom', chamadas: 450, erros: 0 },
  ];

  return (
    <div className="flex flex-col space-y-6 animate-fade-in">
      {/* Cards de Métricas Principais */}
      <div className="order-2 md:order-1 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Integrações Ativas</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{totalAtivas}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Conectores operacionais</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Atenção / Reautenticar</CardTitle>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{totalAtencao}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Requer intervenção</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Desconectados</CardTitle>
            <Network className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-500">{totalDesconectados}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Disponíveis no Hub</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Webhooks Ativos</CardTitle>
            <Webhook className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{webhooksAtivos}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Endpoints escutando</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">API Keys & Tokens</CardTitle>
            <Key className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalKeys}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Credenciais ativas</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Erros de API (7d)</CardTitle>
            <Activity className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{errosLog}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Falhas registradas</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos do Hub */}
      <div className="order-1 md:order-2 grid gap-6 md:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Volume de Chamadas de API (Últimos 7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={apiCallsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="dia" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip />
                  <Bar dataKey="chamadas" name="Chamadas API" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="erros" name="Erros HTTP" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              Conectores por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${(index * 45) % 360}, 70%, 50%)`} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
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
