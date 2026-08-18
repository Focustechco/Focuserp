import React, { useState } from 'react';
import { Wrench, Plus, CheckCircle2, Clock, DollarSign, Search, Trash2, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEstoquePatrimonio } from '../hooks/useEstoquePatrimonio';

export function ManutencoesView() {
  const { manutencoes, updateManutencao, updateEquipamento, equipamentos } = useEstoquePatrimonio();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = manutencoes.filter((m) => {
    if (!m) return false;
    const search = searchTerm.toLowerCase();
    return (
      (m.equipamentoNome || '').toLowerCase().includes(search) ||
      (m.descricao || '').toLowerCase().includes(search) ||
      (m.responsavelNome || '').toLowerCase().includes(search)
    );
  });

  const totalGastoManutencao = manutencoes.reduce((acc, m) => acc + m.valor, 0);

  const handleConcluirManutencao = (manutId: string, equipamentoId: string) => {
    updateManutencao(manutId, { status: 'Concluda' });

    // Atualizar situao do equipamento de volta para Disponvel / Em Uso
    const eq = equipamentos.find((e) => e.id === equipamentoId);
    if (eq) {
      updateEquipamento(equipamentoId, {
        situacao: eq.colaboradorNome ? 'Em Uso' : 'Disponvel',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Ordens de Manutenção & Upgrades</h2>
          <p className="text-xs text-muted-foreground">
            Controle de manutenções preventivas, corretivas, substituição de componentes e custos operacionais
          </p>
        </div>
      </div>

      {/* KPI GASTO EM MANUTENÇÃO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-amber-600 dark:text-amber-400 font-bold">
              Total Investido em Manutenções
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">
              R$ {(totalGastoManutencao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Soma de upgrades e reparos técnicos</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-blue-600 dark:text-blue-400 font-bold">
              Ordens Concluídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">
              {manutencoes.filter((m) => m.status === 'Concluída' || m.status === 'Concluído').length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Serviços executados e validados</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-500/5 border-purple-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-purple-600 dark:text-purple-400 font-bold">
              Em Execução
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">
              {manutencoes.filter((m) => m.status === 'Em Execução' || m.status === 'Em Progresso').length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Equipamentos em assistência técnica</p>
          </CardContent>
        </Card>
      </div>

      {/* SEARCH BAR */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por equipamento, descrição do serviço ou técnico responsável..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* TABELA DE MANUTENÇÕES */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-sm font-semibold">Chamados de Manutenção ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Data</TableHead>
                <TableHead className="text-xs">Equipamento</TableHead>
                <TableHead className="text-xs">Tipo</TableHead>
                <TableHead className="text-xs">Descrição dos Serviços</TableHead>
                <TableHead className="text-xs">Valor (R$)</TableHead>
                <TableHead className="text-xs">Técnico / Responsável</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                    Nenhuma ordem de manutenção encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((manut) => (
                  <TableRow key={manut.id} className="hover:bg-muted/50">
                    <TableCell className="text-xs font-mono text-muted-foreground">{manut.data}</TableCell>

                    <TableCell className="text-xs font-bold text-foreground">
                      {manut.equipamentoNome}
                    </TableCell>

                    <TableCell className="text-xs">
                      <Badge variant="outline" className="text-[10px]">
                        {manut.tipo}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs max-w-[220px] truncate text-muted-foreground">
                      {manut.descricao}
                    </TableCell>

                    <TableCell className="text-xs font-bold text-foreground">
                      R$ {(manut.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">{manut.responsavelNome}</TableCell>

                    <TableCell>
                      {manut.status === 'Concluda' ? (
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                          Concluda
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">
                          Em Execuo
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      {manut.status !== 'Concluda' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-emerald-600 hover:text-emerald-700 gap-1"
                          onClick={() => handleConcluirManutencao(manut.id, manut.equipamentoId)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Finalizar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
