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
  ChevronRight,
  Sparkles,
  X,
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
        case "cliente":
          setNovoClienteOpen(true);
          break;
        case "receber":
          setNovoRecebimentoOpen(true);
          break;
        case "pagar":
          setNovoPagamentoOpen(true);
          break;
        case "projeto":
          setNovoProjetoOpen(true);
          break;
        case "contrato":
          setNovoContratoOpen(true);
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

  const actions = [
    {
      key: "cliente",
      title: "Cliente",
      desc: "Cadastrar novo cliente no diretório",
      icon: Users,
    },
    {
      key: "receber",
      title: "Recebimento (Entrada)",
      desc: "Lançar no Contas a Receber e Fluxo de Caixa",
      icon: TrendingUp,
    },
    {
      key: "pagar",
      title: "Despesa (Saída)",
      desc: "Lançar no Contas a Pagar e Fluxo de Caixa",
      icon: TrendingDown,
    },
    {
      key: "projeto",
      title: "Projeto",
      desc: "Iniciar novo projeto e cronograma",
      icon: Briefcase,
    },
    {
      key: "contrato",
      title: "Contrato",
      desc: "Registrar contrato de prestação de serviços",
      icon: FileText,
    },
    {
      key: "crm",
      title: "Oportunidade (CRM)",
      desc: "Adicionar negócio no pipeline de vendas",
      icon: Target,
    },
    {
      key: "fiscal",
      title: "Nota Fiscal (NFe/NFSe)",
      desc: "Emissão de documento fiscal eletrônico",
      icon: Receipt,
    },
  ];

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] p-0 bg-white dark:bg-zinc-900 border-t border-slate-200/80 dark:border-zinc-800 shadow-2xl">
          {/* Top orange accent line */}
          <div className="h-1 w-full bg-[#FF6A00]" />

          <div className="p-4 pb-3 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <div className="w-10 h-1 bg-slate-200 dark:bg-zinc-700 rounded-full mb-2" />
              <SheetTitle className="text-base font-extrabold text-slate-900 dark:text-white">
                Criar novo
              </SheetTitle>
              <SheetDescription className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Selecione a ação rápida que deseja executar
              </SheetDescription>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer shrink-0"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 overflow-y-auto max-h-[calc(85vh-100px)] space-y-2 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
            {actions.map((act) => {
              const Icon = act.icon;
              return (
                <button
                  key={act.key}
                  onClick={() => handleAction(act.key)}
                  className="w-full p-3 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-[#FF6A00]/40 transition-all flex items-center justify-between group active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#FFF4EA] dark:bg-orange-950/40 text-[#FF6A00] flex items-center justify-center shrink-0">
                      <Icon className="w-4.5 h-4.5 text-[#FF6A00]" />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-[#FF6A00] transition-colors block truncate">
                        + {act.title}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-zinc-400 block truncate">
                        {act.desc}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 group-hover:text-[#FF6A00] transition-all shrink-0 ml-2" />
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheets de Formulários Oficiais Reais */}
      <NovoRecebimentoSheet open={novoRecebimentoOpen} onOpenChange={setNovoRecebimentoOpen} />
      <NovaContaSheet open={novoPagamentoOpen} onOpenChange={setNovoPagamentoOpen} />
      <NovoClienteSheet open={novoClienteOpen} onOpenChange={setNovoClienteOpen} />
      <NovoContratoSheet open={novoContratoOpen} onOpenChange={setNovoContratoOpen} />
      <NovoProjetoSheet open={novoProjetoOpen} onOpenChange={setNovoProjetoOpen} />
    </>
  );
}
