import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, DollarSign, Target, Award, CheckCircle2, TrendingUp, 
  Phone, MessageSquare, Video, Mail, Calendar, Clock, ArrowUpRight, Flame
} from 'lucide-react';
import { useComercialStore } from '../hooks/useComercialStore';
import { formatDateBrasilia } from '@/lib/dateUtils';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function MinhaPerformanceView() {
  const { equipe, oportunidades, atividades, propostas, regrasComissao } = useComercialStore();
  const [selectedConsultor, setSelectedConsultor] = useState(equipe[0]?.nome || '');

  // Dados do Consultor Selecionado
  const consultor = equipe.find(e => e.nome === selectedConsultor) || equipe[0];

  const consultorOps = useMemo(() => {
    if (!selectedConsultor) return [];
    return oportunidades.filter(o => o.responsavel === selectedConsultor);
  }, [oportunidades, selectedConsultor]);

  const vendasGanhas = useMemo(() => {
    return consultorOps.filter(o => 
      (o.etapa || '').toLowerCase().includes('ganh') || 
      (o.etapa || '').toLowerCase().includes('won') || 
      (o.etapa || '').toLowerCase().includes('fechad')
    );
  }, [consultorOps]);

  const receitaGerada = useMemo(() => {
    return vendasGanhas.reduce((acc, o) => acc + (o.valorR$ || 0), 0);
  }, [vendasGanhas]);

  const metaMensal = consultor?.metaMensalR$ || 0;
  const percentualMeta = metaMensal > 0 ? ((receitaGerada / metaMensal) * 100).toFixed(1) : '0.0';

  const comissaoPercentual = consultor?.comissaoPercentual || 0;
  const comissaoPrevista = (receitaGerada * comissaoPercentual) / 100;

  const ticketMedio = vendasGanhas.length > 0 ? (receitaGerada / vendasGanhas.length) : 0;
  const taxaConversao = consultorOps.length > 0 ? ((vendasGanhas.length / consultorOps.length) * 100).toFixed(1) : '0.0';

  // Atividades do Consultor
  const consultorAtividades = useMemo(() => {
    if (!selectedConsultor) return [];
    return atividades.filter(a => a.responsavel === selectedConsultor);
  }, [atividades, selectedConsultor]);

  const totalLigacoes = consultorAtividades.filter(a => a.tipo === 'Ligação').length;
  const totalWhatsapp = consultorAtividades.filter(a => a.tipo === 'WhatsApp').length;
  const totalReunioes = consultorAtividades.filter(a => a.tipo === 'Reunião' || a.tipo === 'Demonstração').length;
  const totalEmails = consultorAtividades.filter(a => a.tipo === 'E-mail').length;
  const totalFollowUps = consultorAtividades.filter(a => a.tipo === 'Follow-up').length;

  if (equipe.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground bg-muted/10 rounded-2xl border border-dashed my-4 animate-fade-in">
        <User className="w-12 h-12 text-orange-500 opacity-40 mx-auto mb-3" />
        <h4 className="font-bold text-sm text-foreground">Nenhum membro cadastrado na equipe comercial.</h4>
        <p className="text-xs mt-1">Cadastre executivos de contas, SDRs ou closers na aba "Equipe Comercial" para acompanhar a performance individual.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pt-1">
      {/* Seletor de Consultor & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-muted/20 p-4 border rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
            {(consultor?.nome || 'Consultor').split(' ').map(p => p[0]).join('').slice(0, 2)}
          </div>
          <div>
            <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
              <span>{consultor?.nome || 'Consultor'}</span>
              <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-400 bg-orange-50">
                {consultor?.funcao}
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">{consultor?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Visualizar Consultor:</span>
          <Select value={selectedConsultor} onValueChange={setSelectedConsultor}>
            <SelectTrigger className="w-[200px] h-8 text-xs bg-background rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {equipe.map(m => (
                <SelectItem key={m.id} value={m.nome}>{m.nome} ({m.funcao})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid de Cards de Performance Individual */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Minha Meta Mensal</span>
            <div className="text-2xl font-black text-foreground">
              {formatCurrency(metaMensal)}
            </div>
            <div className="space-y-1 pt-1 border-t">
              <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                <span>{percentualMeta}% Atingido</span>
                <span>Faltam {formatCurrency(Math.max(0, metaMensal - receitaGerada))}</span>
              </div>
              <Progress value={parseFloat(percentualMeta)} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Receita Fechada</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(receitaGerada)}
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t">
              <span>{vendasGanhas.length} vendas ganhas</span>
              <span className="text-emerald-600 font-bold">100% Real</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Comissão Prevista</span>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {formatCurrency(comissaoPrevista)}
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t">
              <span>Alíquota de {comissaoPercentual}%</span>
              <span>Prevista</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Taxa de Conversão</span>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {taxaConversao}%
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t">
              <span>Ticket Médio: {formatCurrency(ticketMedio)}</span>
              <span>Individual</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Produtividade Diária & Contatos */}
      <Card className="rounded-2xl border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-500" /> Registro de Produtividade Comercial
          </CardTitle>
          <CardDescription className="text-xs">
            Contatos, ligações, reuniões e interações registradas no período.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl border bg-blue-50/30 dark:bg-blue-950/20 text-center space-y-1">
              <Phone className="w-4 h-4 text-blue-600 mx-auto" />
              <span className="text-[10px] text-muted-foreground block font-semibold uppercase">Ligações</span>
              <span className="text-xl font-extrabold text-blue-600">{totalLigacoes}</span>
            </div>

            <div className="p-3.5 rounded-xl border bg-emerald-50/30 dark:bg-emerald-950/20 text-center space-y-1">
              <MessageSquare className="w-4 h-4 text-emerald-600 mx-auto" />
              <span className="text-[10px] text-muted-foreground block font-semibold uppercase">WhatsApp</span>
              <span className="text-xl font-extrabold text-emerald-600">{totalWhatsapp}</span>
            </div>

            <div className="p-3.5 rounded-xl border bg-purple-50/30 dark:bg-purple-950/20 text-center space-y-1">
              <Video className="w-4 h-4 text-purple-600 mx-auto" />
              <span className="text-[10px] text-muted-foreground block font-semibold uppercase">Reuniões</span>
              <span className="text-xl font-extrabold text-purple-600">{totalReunioes}</span>
            </div>

            <div className="p-3.5 rounded-xl border bg-amber-50/30 dark:bg-amber-950/20 text-center space-y-1">
              <Mail className="w-4 h-4 text-amber-600 mx-auto" />
              <span className="text-[10px] text-muted-foreground block font-semibold uppercase">E-mails</span>
              <span className="text-xl font-extrabold text-amber-600">{totalEmails}</span>
            </div>

            <div className="p-3.5 rounded-xl border bg-rose-50/30 dark:bg-rose-950/20 text-center space-y-1 col-span-2 sm:col-span-1">
              <Flame className="w-4 h-4 text-rose-600 mx-auto" />
              <span className="text-[10px] text-muted-foreground block font-semibold uppercase">Follow-ups</span>
              <span className="text-xl font-extrabold text-rose-600">{totalFollowUps}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Oportunidades sob Gestão deste Consultor */}
      <Card className="rounded-2xl border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>Oportunidades sob Gestão de {selectedConsultor}</span>
            <Badge variant="secondary" className="text-xs">{consultorOps.length} negócios</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-xl overflow-x-auto bg-card text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted/50 border-b text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3">ID / Tarefa ClickUp</th>
                  <th className="p-3">Cliente / Empresa</th>
                  <th className="p-3">Etapa Atual</th>
                  <th className="p-3 text-right">Valor R$</th>
                  <th className="p-3">Data Prevista</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {consultorOps.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground text-xs">
                      Nenhuma oportunidade atribuída no ClickUp para este consultor.
                    </td>
                  </tr>
                ) : (
                  consultorOps.map(op => (
                    <tr key={op.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono text-orange-600 font-bold">{op.clickUpTaskId}</td>
                      <td className="p-3 font-semibold text-foreground">{op.empresaNome || op.titulo}</td>
                      <td className="p-3">
                        <Badge className="text-[10px]" style={{ backgroundColor: op.statusColor || '#94a3b8', color: '#fff' }}>
                          {op.etapa}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-extrabold text-foreground">
                        {op.valorR$ > 0 ? formatCurrency(op.valorR$) : 'R$ 0,00'}
                      </td>
                      <td className="p-3 text-muted-foreground">{formatDateBrasilia(op.dataPrevistaFechamento)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
