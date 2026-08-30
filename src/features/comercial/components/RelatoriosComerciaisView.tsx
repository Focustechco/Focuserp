import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileSpreadsheet, Download, Filter, TrendingUp, DollarSign, 
  Users, Target, Calendar, CheckCircle2, BarChart3
} from 'lucide-react';
import { useComercialStore } from '../hooks/useComercialStore';
import { formatDateBrasilia } from '@/lib/dateUtils';
import { toast } from 'sonner';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function RelatoriosComerciaisView() {
  const { equipe, oportunidades, atividades, propostas, kpisExecutivos } = useComercialStore();
  const [tipoRelatorio, setTipoRelatorio] = useState('performance');
  const [periodo, setPeriodo] = useState('mes');

  // Exportar para CSV
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (tipoRelatorio === 'performance') {
      headers = ['Consultor', 'Funcao', 'Oportunidades', 'Receita_Fechada_R$', 'Meta_Mensal_R$'];
      rows = equipe.map(m => {
        const userOps = oportunidades.filter(o => o.responsavel === m.nome);
        const vendas = userOps.filter(o => (o.etapa || '').toLowerCase().includes('ganh'));
        const rec = vendas.reduce((acc, o) => acc + (o.valorR$ || 0), 0);
        return [m.nome, m.funcao, String(userOps.length), String(rec), String(m.metaMensalR$)];
      });
    } else {
      headers = ['ID', 'Cliente', 'Etapa', 'Valor_R$', 'Responsavel', 'Data_Prevista'];
      rows = oportunidades.map(o => [
        o.clickUpTaskId,
        o.empresaNome || o.titulo,
        o.etapa,
        String(o.valorR$ || 0),
        o.responsavel,
        o.dataPrevistaFechamento
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_comercial_${tipoRelatorio}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Relatório comercial exportado em CSV com sucesso!');
  };

  return (
    <div className="space-y-6 animate-fade-in pt-1">
      {/* Header & Ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
            <FileSpreadsheet className="w-5 h-5 text-orange-500" /> Relatórios Analíticos & Inteligência Comercial
          </h3>
          <p className="text-xs text-muted-foreground">
            Relatórios estruturados com base nas atividades, oportunidades e vendas reais da equipe.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
            <SelectTrigger className="w-[180px] h-8 text-xs bg-background rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="performance">Performance por Consultor</SelectItem>
              <SelectItem value="pipeline">Aging & Status do Pipeline</SelectItem>
              <SelectItem value="produtividade">Produtividade de Atividades</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={handleExportCSV}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1.5 font-bold text-xs h-8 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" /> Exportar CSV
          </Button>
        </div>
      </div>

      {/* Relatório Selecionado */}
      <Card className="rounded-2xl border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>
              {tipoRelatorio === 'performance' && 'Relatório de Performance Comercial por Membro da Equipe'}
              {tipoRelatorio === 'pipeline' && 'Relatório Geral do Pipeline de Vendas'}
              {tipoRelatorio === 'produtividade' && 'Relatório de Produtividade & Interações Comerciais'}
            </span>
          </CardTitle>
          <CardDescription className="text-xs">
            Dados sincronizados em tempo real com a operação comercial da Focus Tech.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tipoRelatorio === 'performance' && (
            <div className="border rounded-xl overflow-x-auto bg-card text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/50 border-b text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3">Consultor</th>
                    <th className="p-3">Função</th>
                    <th className="p-3 text-center">Oportunidades</th>
                    <th className="p-3 text-right">Meta Mensal (R$)</th>
                    <th className="p-3 text-right">Receita Fechada (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {equipe.map(m => {
                    const userOps = oportunidades.filter(o => o.responsavel === m.nome);
                    const vendas = userOps.filter(o => (o.etapa || '').toLowerCase().includes('ganh'));
                    const rec = vendas.reduce((acc, o) => acc + (o.valorR$ || 0), 0);

                    return (
                      <tr key={m.id} className="hover:bg-muted/30">
                        <td className="p-3 font-bold text-foreground">{m.nome}</td>
                        <td className="p-3 text-muted-foreground">{m.funcao}</td>
                        <td className="p-3 text-center font-bold">{userOps.length}</td>
                        <td className="p-3 text-right">{formatCurrency(m.metaMensalR$)}</td>
                        <td className="p-3 text-right font-extrabold text-emerald-600">{formatCurrency(rec)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {tipoRelatorio === 'pipeline' && (
            <div className="border rounded-xl overflow-x-auto bg-card text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/50 border-b text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3">ID / Tarefa</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Etapa Atual</th>
                    <th className="p-3">Responsável</th>
                    <th className="p-3 text-right">Valor R$</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {oportunidades.map(op => (
                    <tr key={op.id} className="hover:bg-muted/30">
                      <td className="p-3 font-mono font-bold text-orange-600">{op.clickUpTaskId}</td>
                      <td className="p-3 font-semibold text-foreground">{op.empresaNome || op.titulo}</td>
                      <td className="p-3">
                        <Badge className="text-[10px]" style={{ backgroundColor: op.statusColor || '#94a3b8', color: '#fff' }}>
                          {op.etapa}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{op.responsavel}</td>
                      <td className="p-3 text-right font-extrabold text-foreground">{formatCurrency(op.valorR$)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tipoRelatorio === 'produtividade' && (
            <div className="border rounded-xl overflow-x-auto bg-card text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/50 border-b text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3">Data / Hora</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Empresa</th>
                    <th className="p-3">Responsável</th>
                    <th className="p-3">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {atividades.map(atv => (
                    <tr key={atv.id} className="hover:bg-muted/30">
                      <td className="p-3 font-mono text-muted-foreground">{formatDateBrasilia(atv.data)} {atv.horario}</td>
                      <td className="p-3"><Badge variant="outline">{atv.tipo}</Badge></td>
                      <td className="p-3 font-semibold text-foreground">{atv.empresa}</td>
                      <td className="p-3 text-muted-foreground">{atv.responsavel}</td>
                      <td className="p-3 font-medium text-primary">{atv.resultado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
