import React, { useState } from 'react';
import {
  DollarSign,
  TrendingDown,
  Building2,
  ShieldAlert,
  Archive,
  Search,
  Plus,
  Trash2,
  FileCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useEstoquePatrimonio } from '../hooks/useEstoquePatrimonio';

export function PatrimonioView() {
  const { patrimonios, deletePatrimonio, updatePatrimonio } = useEstoquePatrimonio();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatrimonios = patrimonios.filter((p) => {
    if (!p) return false;
    const search = searchTerm.toLowerCase();
    return (
      (p.numeroPatrimonial || '').toLowerCase().includes(search) ||
      (p.categoria || '').toLowerCase().includes(search) ||
      (p.codigoInterno || '').toLowerCase().includes(search)
    );
  });

  const valorTotalOriginal = patrimonios.reduce((acc, p) => acc + p.valorCompra, 0);
  const valorTotalAtual = patrimonios.reduce((acc, p) => acc + p.valorAtual, 0);
  const depreciacaoTotal = patrimonios.reduce((acc, p) => acc + p.depreciacaoAcumulada, 0);

  const handleBaixarPatrimonio = (id: string, acao: 'Baixado' | 'Descarte') => {
    updatePatrimonio(id, {
      situacao: acao,
      valorAtual: 0,
      estadoConservacao: 'Obsoleto',
    });
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Central de Gestão Patrimonial</h2>
          <p className="text-xs text-muted-foreground">
            Acompanhamento do valor contábil, vida útil, estado de conservação e curva de depreciação acumulada dos ativos
          </p>
        </div>
      </div>

      {/* KPIS PATRIMONIAIS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-emerald-600 dark:text-emerald-400 font-bold">
              Valor Contábil Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">
              R$ {(valorTotalAtual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Patrimônio ativo em balanço</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-blue-600 dark:text-blue-400 font-bold">
              Valor de Aquisição Original
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">
              R$ {(valorTotalOriginal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Investimento histórico em bens</p>
          </CardContent>
        </Card>

        <Card className="bg-rose-500/5 border-rose-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-rose-600 dark:text-rose-400 font-bold">
              Depreciação Acumulada Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
              R$ {(depreciacaoTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Perda de valor contábil pelo uso/tempo</p>
          </CardContent>
        </Card>
      </div>

      {/* FILTRO DE BUSCA */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número patrimonial, código interno ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* TABELA DE REGISTRO PATRIMONIAL */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-sm font-semibold">Bens Registrados ({filteredPatrimonios.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Número Patrimonial</TableHead>
                <TableHead className="text-xs">Categoria / CC</TableHead>
                <TableHead className="text-xs">Valor Compra</TableHead>
                <TableHead className="text-xs">Valor Atual</TableHead>
                <TableHead className="text-xs">Depreciação</TableHead>
                <TableHead className="text-xs">Conservação</TableHead>
                <TableHead className="text-xs">Situação</TableHead>
                <TableHead className="text-xs text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatrimonios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                    Nenhum bem patrimonial encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatrimonios.map((pat) => {
                  const percDepreciado = Math.round((pat.depreciacaoAcumulada / pat.valorCompra) * 100);
                  return (
                    <TableRow key={pat.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-xs font-mono text-primary">{pat.numeroPatrimonial}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">{pat.codigoInterno}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{pat.categoria}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {pat.centroCustoNome || 'Geral'}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs font-semibold">
                        R$ {(pat.valorCompra || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>

                      <TableCell className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        R$ {(pat.valorAtual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>

                      <TableCell className="text-xs">
                        <div className="w-28 space-y-1">
                          <Progress value={percDepreciado} className="h-1.5" />
                          <span className="text-[10px] text-muted-foreground block font-mono">
                            -{percDepreciado}% ({pat.vidaUtilAnos} anos)
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {pat.estadoConservacao}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {pat.situacao === 'Ativo' && (
                          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                            Ativo
                          </Badge>
                        )}
                        {pat.situacao === 'Baixado' && (
                          <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">
                            Baixado
                          </Badge>
                        )}
                        {pat.situacao === 'Descarte' && (
                          <Badge variant="destructive" className="text-[10px]">
                            Descarte
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {pat.situacao === 'Ativo' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-amber-600 hover:text-amber-700"
                              onClick={() => handleBaixarPatrimonio(pat.id, 'Baixado')}
                            >
                              Baixa Contábil
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-rose-600"
                            onClick={() => deletePatrimonio(pat.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
