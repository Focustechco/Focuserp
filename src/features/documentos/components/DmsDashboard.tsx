import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Files, HardDrive, UploadCloud, Star, Trash2, ShieldCheck, PieChart as PieIcon, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useDocumentosStore } from '../hooks/useDocumentosStore';

export function DmsDashboard() {
  const { documentos, lixeira, auditLogs } = useDocumentosStore();

  const totalDocs = documentos.length;
  const docsHoje = documentos.filter(d => new Date(d.dataUpload).toDateString() === new Date().toDateString()).length;
  const totalFavoritos = documentos.filter(d => d.favorito).length;
  const totalLixeira = lixeira.length;

  const totalBytes = documentos.reduce((acc, d) => acc + (d.tamanhoBytes || 1000000), 0);
  const espacoUtilizadoMb = (totalBytes / (1024 * 1024)).toFixed(1);

  // Gráfico 1: Documentos por Módulo
  const modCounts: Record<string, number> = {};
  documentos.forEach(d => {
    const mod = d?.moduloOrigem || 'Geral';
    modCounts[mod] = (modCounts[mod] || 0) + 1;
  });

  const moduloData = Object.entries(modCounts).map(([name, count]) => ({
    name,
    count
  }));

  // Gráfico 2: Tipos de Arquivo
  const typeCounts: Record<string, number> = {};
  documentos.forEach(d => {
    const ext = (d?.extensao || 'OUTROS').toUpperCase();
    typeCounts[ext] = (typeCounts[ext] || 0) + 1;
  });

  const typeColors: Record<string, string> = {
    PDF: '#ef4444',
    PNG: '#3b82f6',
    JPG: '#3b82f6',
    XML: '#f59e0b',
    DOCX: '#6366f1',
    XLSX: '#10b981'
  };

  const typeData = Object.entries(typeCounts).map(([name, value]) => ({
    name,
    value,
    color: typeColors[name] || '#94a3b8'
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Documentos</CardTitle>
            <Files className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDocs}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Armazenados no DMS</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Uploads Hoje</CardTitle>
            <UploadCloud className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{docsHoje}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Novos arquivos hoje</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Espaço Utilizado</CardTitle>
            <HardDrive className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{espacoUtilizadoMb} MB</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">De 100 GB alocados</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Favoritos</CardTitle>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFavoritos}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Arquivos marcados</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Lixeira</CardTitle>
            <Trash2 className="w-4 h-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{totalLixeira}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Arquivos pendentes</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Log Auditoria</CardTitle>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs.length}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Eventos registrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos do Dashboard DMS */}
      <div className="grid gap-6 md:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Documentos Armazenados por Módulo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moduloData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip />
                  <Bar dataKey="count" name="Qtd Documentos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-emerald-500" />
              Distribuição por Tipo de Arquivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(val) => [`${val} arquivos`, 'Quantidade']} />
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
