import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Usuario } from '../types';
import { INITIAL_USUARIOS } from '../data/initialData';
import { ShieldAlert, Users, Key, Laptop } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

export function UsuariosDashboard() {
  const { data: usuarios } = useLocalStorageState<Usuario>('focus_usuarios', INITIAL_USUARIOS);

  const totalUsuarios = usuarios.length;
  const ativos = usuarios.filter(u => u.status === 'Ativo').length;
  const inativos = usuarios.filter(u => u.status === 'Inativo').length;
  const bloqueados = usuarios.filter(u => u.status === 'Bloqueado').length;
  const onlineAgora = usuarios.filter(u => u.status === 'Ativo').length;

  const sessoesHoraData = [
    { hora: '08:00', logados: Math.max(1, Math.floor(totalUsuarios * 0.4)) },
    { hora: '10:00', logados: totalUsuarios },
    { hora: '12:00', logados: Math.max(1, Math.floor(totalUsuarios * 0.6)) },
    { hora: '14:00', logados: totalUsuarios },
    { hora: '16:00', logados: Math.max(1, Math.floor(totalUsuarios * 0.8)) },
    { hora: '18:00', logados: Math.max(1, Math.floor(totalUsuarios * 0.3)) },
  ];

  const deptoMap: Record<string, number> = {};
  usuarios.forEach(u => {
    const d = u.departamento || 'Outros';
    deptoMap[d] = (deptoMap[d] || 0) + 1;
  });

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
  const pieData = Object.keys(deptoMap).map((key, idx) => ({
    name: key,
    value: deptoMap[key],
    color: colors[idx % colors.length]
  }));

  return (
    <div className="flex flex-col space-y-6 animate-fade-in pt-4">
      <div className="order-2 md:order-1 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totalUsuarios}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-emerald-500 font-medium">{ativos} ativos</span> / {inativos} inativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessões Online Agora</CardTitle>
            <Laptop className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {onlineAgora}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Usuários ativos com permissão de sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Segurança (Últimas 24h)</CardTitle>
            <ShieldAlert className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              0
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Nenhuma tentativa de intrusão registrada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas Bloqueadas</CardTitle>
            <Key className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {bloqueados}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Requer desbloqueio administrativo
            </p>
          </CardContent>
        </Card>

      </div>

      <div className="order-1 md:order-2 grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Volume de Acessos por Horário</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={sessoesHoraData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                 <XAxis dataKey="hora" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                 <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                 <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                 <Bar dataKey="logados" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Usuários Online" />
               </BarChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Licenças Alocadas por Departamento</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                   {pieData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip contentStyle={{ borderRadius: '8px' }} />
                 <Legend verticalAlign="bottom" height={36}/>
               </PieChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
