import React from 'react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Contrato } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { differenceInDays } from 'date-fns';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function Dashboard() {
  const { data: rawContratos } = useLocalStorageState<Contrato>('focus_contratos', []);

  const contratos = React.useMemo(() => {
    const seenIds = new Set<string>();
    const seenKeys = new Set<string>();
    return (rawContratos || []).filter((c) => {
      if (!c || (!c.id && !c.numeroContrato && !c.nome)) return false;
      if (seenIds.has(c.id)) return false;
      const key = `${c.numeroContrato || ''}_${c.clienteNome || ''}_${c.nome || ''}`;
      if (seenKeys.has(key)) return false;
      seenIds.add(c.id);
      seenKeys.add(key);
      return true;
    });
  }, [rawContratos]);

  const total = contratos.length;
  const ativos = contratos.filter(c => c.status === 'Vigente').length;
  
  const hoje = new Date();
  
  const vencendo = contratos.filter(c => {
    if (!c.dataFinal || c.status !== 'Vigente') return false;
    const dias = differenceInDays(new Date(c.dataFinal), hoje);
    return dias > 0 && dias <= 90;
  }).length;

  const totalContratado = contratos.reduce((acc, c) => acc + (c.valorTotal || 0), 0);

  // Contratos por Tipo
  const tipoCount: Record<string, number> = {};
  contratos.forEach(c => {
    if (c.tipoServico) {
      tipoCount[c.tipoServico] = (tipoCount[c.tipoServico] || 0) + 1;
    }
  });
  const dataTipo = Object.entries(tipoCount).map(([name, value]) => ({ name, value }));

  // Receita x Despesa
  const categoriaCount: Record<string, number> = { Receita: 0, Despesa: 0, Interno: 0 };
  contratos.forEach(c => {
    if (c.categoria) {
      categoriaCount[c.categoria] = (categoriaCount[c.categoria] || 0) + 1;
    }
  });
  const dataCategoria = Object.entries(categoriaCount).filter(([_, v]) => v > 0).map(([name, value]) => ({ name, value }));

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];
  const CATEGORY_COLORS: Record<string, string> = {
    Receita: '#10b981',
    Despesa: '#f43f5e',
    Interno: '#64748b'
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contratado</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(totalContratado)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor global da base
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {ativos}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Em plena vigência
            </p>
          </CardContent>
        </Card>

        <Card className={vencendo > 0 ? "border-orange-200 bg-orange-50/50 dark:border-orange-900/50 dark:bg-orange-950/20" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencendo (90 dias)</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${vencendo > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${vencendo > 0 ? "text-orange-600 dark:text-orange-400" : ""}`}>
              {vencendo}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Necessitam de renovação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Base de Contratos</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {total}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Documentos no sistema
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contratos por Categoria (Receita/Despesa)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataCategoria}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {dataCategoria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Tipos de Serviço</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataTipo} margin={{ top: 20, right: 30, left: 0, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" width={120} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
