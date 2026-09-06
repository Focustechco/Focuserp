import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Users, Building2, Lock, CheckCircle2, RefreshCw, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { usePermissoesStore } from '../hooks/usePermissoesStore';

export function PermissoesDashboard() {
  const { usuarios, colaboradores, perfis } = usePermissoesStore();

  const totalUsuarios = usuarios.length;
  const totalColaboradores = colaboradores.length;
  const totalPerfis = perfis.length;

  // Gráfico 1: Usuários por Setor / Departamento
  const depCounts: Record<string, number> = {};
  usuarios.forEach(u => {
    const dep = u.departamento || 'Geral';
    depCounts[dep] = (depCounts[dep] || 0) + 1;
  });

  const depData = Object.entries(depCounts).map(([name, count]) => ({
    name,
    count
  }));

  // Gráfico 2: Usuários por Perfil de Acesso
  const profileCounts: Record<string, number> = {};
  usuarios.forEach(u => {
    profileCounts[u.perfil] = (profileCounts[u.perfil] || 0) + 1;
  });

  const profileData = Object.entries(profileCounts).map(([name, value]) => ({
    name,
    value
  }));

  return (
    <div className="flex flex-col space-y-6 animate-fade-in">
      {/* Cards de Métricas */}
      <div className="order-2 md:order-1 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Usuários Mapeados</CardTitle>
            <Users className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsuarios}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Usuários ativos na governança</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Colaboradores RH Sync</CardTitle>
            <Building2 className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{totalColaboradores}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Sincronizados com módulo RH</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Perfis de Acesso</CardTitle>
            <ShieldCheck className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPerfis}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Regras de RBAC ativas</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Sincronização de Setores</CardTitle>
            <RefreshCw className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">Reativa</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Permissões ↔ RH ↔ Usuários</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos do Dashboard */}
      <div className="order-1 md:order-2 grid gap-6 md:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Distribuição de Usuários por Setor / Departamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={depData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip />
                  <Bar dataKey="count" name="Qtd Colaboradores" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              Perfis de Acesso Atribuídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={profileData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {profileData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${(index * 60) % 360}, 70%, 50%)`} />
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
