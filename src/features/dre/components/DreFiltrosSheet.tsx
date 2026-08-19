import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, CheckCircle2, RotateCcw } from 'lucide-react';
import { FiltrosDREState, PeriodoDRE } from '../services/dreEngine';
import { useClientesQuery } from '@/features/clientes/hooks/useClientesQuery';

interface DreFiltrosSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filtros: FiltrosDREState;
  onApplyFiltros: (filtros: FiltrosDREState) => void;
}

export function DreFiltrosSheet({ isOpen, onClose, filtros, onApplyFiltros }: DreFiltrosSheetProps) {
  const { clientes = [] } = useClientesQuery();
  const [localFiltros, setLocalFiltros] = useState<FiltrosDREState>(filtros);

  useEffect(() => {
    setLocalFiltros(filtros);
  }, [filtros, isOpen]);

  const handleApply = () => {
    onApplyFiltros(localFiltros);
    onClose();
  };

  const handleReset = () => {
    const defaultFiltros: FiltrosDREState = {
      periodo: 'mes_atual',
      regime: 'competencia',
      clienteId: 'todos'
    };
    setLocalFiltros(defaultFiltros);
    onApplyFiltros(defaultFiltros);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[450px] flex flex-col p-0 h-full overflow-hidden">
        
        <div className="p-6 pb-4 border-b bg-muted/20">
          <SheetHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 border shadow-sm">
                <Filter className="w-5 h-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-xl">Filtros da DRE</SheetTitle>
                <SheetDescription>
                  Personalize o período contábil e as dimensões da Demonstração de Resultado.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-2">
            <Label>Período de Análise</Label>
            <Select 
              value={localFiltros.periodo} 
              onValueChange={(val: PeriodoDRE) => setLocalFiltros(prev => ({ ...prev, periodo: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mes_atual">Mês Atual</SelectItem>
                <SelectItem value="mes_anterior">Mês Anterior</SelectItem>
                <SelectItem value="dois_meses_atras">2 Meses Atrás</SelectItem>
                <SelectItem value="trimestre_atual">Trimestre Atual</SelectItem>
                <SelectItem value="trimestre_anterior">Trimestre Anterior</SelectItem>
                <SelectItem value="semestre_atual">Semestre Atual</SelectItem>
                <SelectItem value="ano_atual">Ano Atual</SelectItem>
                <SelectItem value="ano_anterior">Ano Anterior</SelectItem>
                <SelectItem value="todos">Todo o Histórico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>DRE Filtrada por Cliente</Label>
            <Select 
              value={localFiltros.clienteId || 'todos'} 
              onValueChange={(val) => setLocalFiltros(prev => ({ ...prev, clienteId: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os Clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Clientes</SelectItem>
                {clientes.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nomeFantasia || c.razaoSocial} ({c.codigo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Regime Contábil</Label>
            <Select 
              value={localFiltros.regime} 
              onValueChange={(val: 'competencia' | 'caixa') => setLocalFiltros(prev => ({ ...prev, regime: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Regime" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="competencia">Competência (Data de Vencimento / Emissão)</SelectItem>
                <SelectItem value="caixa">Caixa (Títulos Efetivamente Recebidos / Pagos)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-6 border-t bg-background flex items-center justify-between">
          <Button variant="outline" onClick={handleReset} className="gap-1.5 text-xs">
            <RotateCcw className="w-3.5 h-3.5" /> Limpar Filtros
          </Button>
          <Button className="gap-2" onClick={handleApply}>
            <CheckCircle2 className="w-4 h-4" /> Aplicar na DRE
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
