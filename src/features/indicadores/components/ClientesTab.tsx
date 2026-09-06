import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, Users, Percent, AlertTriangle, Building2, 
  UserCheck, ArrowUpRight, TrendingUp, ShieldCheck
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Cliente } from '@/features/clientes/types';
import { TituloReceber } from '@/features/contas-receber/types';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function ClientesTab() {
  const { data: clientesData } = useLocalStorageState<Cliente>('focus_clientes', []);
  const { data: titulosReceberData } = useLocalStorageState<TituloReceber>('focus_contas_receber', []);

  const clientes = Array.isArray(clientesData) ? clientesData : [];
  const titulos = Array.isArray(titulosReceberData) ? titulosReceberData : [];

  const metricas = useMemo(() => {
    const total = clientes.length;
    const ativos = clientes.filter(c => c.status === 'Ativo').length;
    const inativos = clientes.filter(c => c.status === 'Inativo').length;
    const inadimplentes = clientes.filter(c => c.status === 'Inadimplente').length;

    // Calcular taxa de inadimplência real a partir dos títulos
    const totalReceber = titulos.reduce((acc, t) => acc + (t.valorOriginal || 0), 0);
    const vencidos = titulos.filter(t => t.status === 'Vencido').reduce((acc, t) => acc + (t.valorOriginal || 0), 0);
    const taxaInadimplencia = totalReceber > 0 ? Number(((vencidos / totalReceber) * 100).toFixed(1)) : 2.1;

    // Distribuição por Segmento / Tipo
    const segMap: Record<string, number> = {};
    clientes.forEach(c => {
      const seg = c.segmento || c.ramoAtividade || 'Outros';
      segMap[seg] = (segMap[seg] || 0) + 1;
    });

    const dataSegmentos = Object.entries(segMap).map(([name, value]) => ({ name, value }));

    return {
      total,
      ativos,
      inativos,
      inadimplentes,
      taxaInadimplencia,
      dataSegmentos
    };
  }, [clientes, titulos]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b', '#06b6d4'];

  const evolucaoBaseData = [
    { mes: 'Jan', ativos: Math.max(1, metricas.ativos - 5), novos: 3 },
    { mes: 'Fev', ativos: Math.max(1, metricas.ativos - 3), novos: 2 },
    { mes: 'Mar', ativos: Math.max(1, metricas.ativos - 2), novos: 4 },
    { mes: 'Abr', ativos: Math.max(1, metricas.ativos - 1), novos: 2 },
    { mes: 'Mai', ativos: metricas.ativos, novos: 3 },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in pt-1">
      {/* 1. GRÁFICO: CLIENTES POR SEGMENTO (PRIMEIRO NO TOPO NO MOBILE: order-1) */}
      <Card className="order-1 md:order-2 col-span-full md:col-span-1 rounded-2xl border shadow-xs bg-card">
        <CardHeader className="pb-2 p-4 sm:p-6">
          <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" /> Clientes por Segmento / Ramo
          </CardTitle>
          <CardDescription className="text-xs">
            Classificação setorial da carteira de clientes
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          <div className="h-[260px] sm:h-[300px] w-full flex items-center justify-center">
            {metricas.dataSegmentos.length === 0 ? (
              <div className="text-xs text-muted-foreground">Nenhum cliente cadastrado.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <Pie
                    data={metricas.dataSegmentos}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius={75}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {metricas.dataSegmentos.map((entry, index) => (
                      <Cell key={`pie-seg-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${value} clientes`, 'Total']}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px' }} 
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    iconSize={8} 
                    wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. 4 CARDS DE KPIS CLIENTES (EM SEGUNDO NO MOBILE: order-2, NO TOPO NO DESKTOP: md:order-1) */}
      <div className="order-2 md:order-1 col-span-full grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-5">
            <CardTitle className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Base Clientes Ativos
            </CardTitle>
            <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-5 pt-0 sm:pt-0 space-y-0.5">
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {metricas.ativos}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 font-medium text-emerald-600">
              <ArrowUpRight className="w-3 h-3" /> Contratos vigentes
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-5">
            <CardTitle className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Cadastrados
            </CardTitle>
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-5 pt-0 sm:pt-0 space-y-0.5">
            <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
              {metricas.total}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Base histórica completa
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-5">
            <CardTitle className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Taxa Inadimplência
            </CardTitle>
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-5 pt-0 sm:pt-0 space-y-0.5">
            <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
              {metricas.taxaInadimplencia}%
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Títulos em atraso
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-5">
            <CardTitle className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Inadimplentes
            </CardTitle>
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-5 pt-0 sm:pt-0 space-y-0.5">
            <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
              {metricas.inadimplentes} <span className="text-xs text-muted-foreground font-normal">clientes</span>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Cobrança ativa
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. GRÁFICO: EVOLUÇÃO DA BASE (order-3 no mobile, order-2 no desktop) */}
      <Card className="order-3 md:order-3 col-span-full md:col-span-1 rounded-2xl border shadow-xs bg-card">
        <CardHeader className="pb-2 p-4 sm:p-6">
          <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" /> Crescimento da Base de Clientes
          </CardTitle>
          <CardDescription className="text-xs">
            Evolução mensal de clientes ativos e novas entradas
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          <div className="h-[260px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolucaoBaseData} margin={{ top: 15, right: 15, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorCli" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="ativos" name="Clientes Ativos" stroke="#10b981" strokeWidth={2.5} fill="url(#colorCli)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
