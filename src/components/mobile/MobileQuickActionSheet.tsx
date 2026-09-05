import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Briefcase,
  Target,
  Receipt,
  Plus,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { NovoRecebimentoSheet } from "@/features/contas-receber/components/NovoRecebimentoSheet";
import { NovaContaSheet } from "@/features/contas-pagar/components/NovaContaSheet";
import { NovoClienteSheet } from "@/features/clientes/components/NovoClienteSheet";
import { NovoContratoSheet } from "@/features/contratos/components/NovoContratoSheet";
import { NovoProjetoSheet } from "@/features/projetos/components/NovoProjetoSheet";

interface MobileQuickActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileQuickActionSheet({ open, onOpenChange }: MobileQuickActionSheetProps) {
  const navigate = useNavigate();

  const [novoRecebimentoOpen, setNovoRecebimentoOpen] = useState(false);
  const [novoPagamentoOpen, setNovoPagamentoOpen] = useState(false);
  const [novoClienteOpen, setNovoClienteOpen] = useState(false);
  const [novoContratoOpen, setNovoContratoOpen] = useState(false);
  const [novoProjetoOpen, setNovoProjetoOpen] = useState(false);

  const handleAction = (actionKey: string) => {
    onOpenChange(false);
    setTimeout(() => {
      switch (actionKey) {
        case "receber":
          setNovoRecebimentoOpen(true);
          break;
        case "pagar":
          setNovoPagamentoOpen(true);
          break;
        case "cliente":
          setNovoClienteOpen(true);
          break;
        case "contrato":
          setNovoContratoOpen(true);
          break;
        case "projeto":
          setNovoProjetoOpen(true);
          break;
        case "crm":
          navigate({ to: "/crm" });
          break;
        case "fiscal":
          navigate({ to: "/fiscal" });
          break;
      }
    }, 150);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] p-0 bg-white dark:bg-card border-t shadow-2xl">
          <div className="p-5 pb-3 border-b bg-gradient-to-b from-orange-50/50 to-transparent dark:from-orange-950/20">
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-lg font-extrabold text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  Criar Novo Registro
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                  Selecione a ação rápida que deseja executar no Focus ERP
                </SheetDescription>
              </div>
            </div>
          </div>

          <div className="p-4 overflow-y-auto max-h-[calc(85vh-100px)] space-y-2.5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
            {/* 1. NOVO RECEBIMENTO */}
            <button
              onClick={() => handleAction("receber")}
              className="w-full p-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/80 transition-all flex items-center justify-between group active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm shadow-emerald-500/30">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-extrabold text-sm text-foreground">Novo Recebimento</p>
                  <p className="text-[11px] text-muted-foreground">Lançar entrada no Contas a Receber</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* 2. NOVA DESPESA / PAGAMENTO */}
            <button
              onClick={() => handleAction("pagar")}
              className="w-full p-3.5 rounded-2xl border border-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50/80 transition-all flex items-center justify-between group active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-sm shadow-rose-500/30">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-extrabold text-sm text-foreground">Nova Conta a Pagar</p>
                  <p className="text-[11px] text-muted-foreground">Registrar despesa no financeiro</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-rose-600 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* 3. CADASTRAR CLIENTE */}
            <button
              onClick={() => handleAction("cliente")}
              className="w-full p-3.5 rounded-2xl border border-blue-500/20 bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/80 transition-all flex items-center justify-between group active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-sm shadow-blue-500/30">
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-extrabold text-sm text-foreground">Cadastrar Cliente</p>
                  <p className="text-[11px] text-muted-foreground">Pessoa Jurídica ou Física</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* 4. NOVO PROJETO */}
            <button
              onClick={() => handleAction("projeto")}
              className="w-full p-3.5 rounded-2xl border border-amber-500/20 bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50/80 transition-all flex items-center justify-between group active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm shadow-amber-500/30">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-extrabold text-sm text-foreground">Novo Projeto Técnico</p>
                  <p className="text-[11px] text-muted-foreground">Criar projeto e workspace de delivery</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* 5. NOVO CONTRATO */}
            <button
              onClick={() => handleAction("contrato")}
              className="w-full p-3.5 rounded-2xl border border-purple-500/20 bg-purple-50/40 dark:bg-purple-950/20 hover:bg-purple-50/80 transition-all flex items-center justify-between group active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center shadow-sm shadow-purple-500/30">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-extrabold text-sm text-foreground">Novo Contrato</p>
                  <p className="text-[11px] text-muted-foreground">Registrar contrato de prestação / MRR</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* 6. NOVA OPORTUNIDADE CRM */}
            <button
              onClick={() => handleAction("crm")}
              className="w-full p-3.5 rounded-2xl border border-orange-500/20 bg-orange-50/40 dark:bg-orange-950/20 hover:bg-orange-50/80 transition-all flex items-center justify-between group active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-sm shadow-orange-500/30">
                  <Target className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-extrabold text-sm text-foreground">Nova Oportunidade (CRM)</p>
                  <p className="text-[11px] text-muted-foreground">Adicionar lead no funil de vendas</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-orange-600 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheets Funcionais Oficiais */}
      <NovoRecebimentoSheet open={novoRecebimentoOpen} onOpenChange={setNovoRecebimentoOpen} />
      <NovaContaSheet open={novoPagamentoOpen} onOpenChange={setNovoPagamentoOpen} />
      <NovoClienteSheet open={novoClienteOpen} onOpenChange={setNovoClienteOpen} />
      <NovoContratoSheet open={novoContratoOpen} onOpenChange={setNovoContratoOpen} />
      <NovoProjetoSheet open={novoProjetoOpen} onOpenChange={setNovoProjetoOpen} />
    </>
  );
}
