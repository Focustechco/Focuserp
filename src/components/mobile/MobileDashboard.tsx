import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Users,
  Wallet,
  TrendingUp,
  TrendingDown,
  Briefcase,
  Boxes,
  UserCog,
  BarChart3,
  ArrowRight,
  Zap,
  ChevronRight,
  FolderOpen,
  FileCheck2,
  Package,
  Layers,
  Sparkles,
  LayoutGrid,
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useContasReceberQuery } from "@/features/contas-receber/hooks/useContasReceberQuery";
import { useContasPagarQuery } from "@/features/contas-pagar/hooks/useContasPagarQuery";
import { useClientesQuery } from "@/features/clientes/hooks/useClientesQuery";
import { useLocalStorageState } from "@/hooks/useDataStore";
import { Contrato } from "@/features/contratos/types";
import { Projeto } from "@/features/projetos/types";
import { formatDateBrasilia, getBrasiliaTodayIso } from "@/lib/dateUtils";
import { Badge } from "@/components/ui/badge";

// Modais Oficiais
import { NovoRecebimentoSheet } from "@/features/contas-receber/components/NovoRecebimentoSheet";
import { NovaContaSheet } from "@/features/contas-pagar/components/NovaContaSheet";
import { NovoClienteSheet } from "@/features/clientes/components/NovoClienteSheet";
import { NovoContratoSheet } from "@/features/contratos/components/NovoContratoSheet";
import { NovoProjetoSheet } from "@/features/projetos/components/NovoProjetoSheet";

const formatBRL = (v?: number | null) => {
  const num = typeof v === "number" && !isNaN(v) ? v : 0;
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
};

export function MobileDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Queries de Dados Reais
  const { data: contasReceber = [] } = useContasReceberQuery();
  const { data: contasPagar = [] } = useContasPagarQuery();
  const { data: clientes = [] } = useClientesQuery();
  const { data: contratos = [] } = useLocalStorageState<Contrato>("focus_contratos");
  const { data: projetos = [] } = useLocalStorageState<Projeto>("focus_projetos");

  // Modais de Criação Rápida
  const [novoRecebimentoOpen, setNovoRecebimentoOpen] = useState(false);
  const [novoPagamentoOpen, setNovoPagamentoOpen] = useState(false);
  const [novoClienteOpen, setNovoClienteOpen] = useState(false);
  const [novoContratoOpen, setNovoContratoOpen] = useState(false);
  const [novoProjetoOpen, setNovoProjetoOpen] = useState(false);

  // Saudação Dinâmica por Horário
  const greeting = useMemo(() => {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) return "Bom dia";
    if (hora >= 12 && hora < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  const dataHojeStr = useMemo(() => {
    const hoje = getBrasiliaTodayIso();
    return formatDateBrasilia(hoje);
  }, []);

  const primeiroNome = useMemo(() => {
    const nomeCompleto = currentUser?.nome || "Adriano";
    return nomeCompleto.split(" ")[0];
  }, [currentUser]);

  // Cálculos Financeiros Reais
  const metrics = useMemo(() => {
    const hojeIso = getBrasiliaTodayIso();

    const totalRecebido = (contasReceber || [])
      .filter((t) => {
        const st = String(t.status || "").toLowerCase();
        return st === "recebido" || st === "liquidado" || st === "pago";
      })
      .reduce((acc, t) => acc + (Number(t.valorRecebido ?? t.valorOriginal ?? t.valor ?? 0) || 0), 0);

    const totalPago = (contasPagar || [])
      .filter((p) => {
        const st = String(p.status || "").toLowerCase();
        return st === "pago" || st === "liquidado" || st === "paga";
      })
      .reduce((acc, p) => acc + (Number(p.valorPago ?? p.valorOriginal ?? p.valor ?? 0) || 0), 0);

    const saldoReal = totalRecebido - totalPago;

    const receberHoje = (contasReceber || [])
      .filter((t) => {
        const st = String(t.status || "").toLowerCase();
        const isNaoPago = st !== "recebido" && st !== "liquidado" && st !== "pago";
        return isNaoPago && t.dataVencimento === hojeIso;
      })
      .reduce((acc, t) => acc + (Number(t.valorOriginal ?? t.valor ?? 0) || 0), 0);

    const pagarHoje = (contasPagar || [])
      .filter((p) => {
        const st = String(p.status || "").toLowerCase();
        const isNaoPago = st !== "pago" && st !== "liquidado" && st !== "paga";
        return isNaoPago && p.dataVencimento === hojeIso;
      })
      .reduce((acc, p) => acc + (Number(p.valorOriginal ?? p.valor ?? 0) || 0), 0);

    const clientesAtivos = (clientes || []).filter((c) => String(c.status || "").toLowerCase() !== "inativo").length;
    const contratosAtivos = (contratos || []).filter((c) => String(c.status || "").toLowerCase() === "ativo").length;
    const projetosAtivos = (projetos || []).filter((p) => p.status === "Em Andamento" || p.status === "Planejamento").length;

    return {
      saldoReal,
      totalRecebido,
      totalPago,
      receberHoje,
      pagarHoje,
      clientesAtivos,
      contratosAtivos,
      projetosAtivos,
    };
  }, [contasReceber, contasPagar, clientes, contratos, projetos]);

// Lista dos Principais Módulos do Focus ERP (Grid de 2 Colunas conforme o design)
  const modulesGrid = [
    {
      title: "Clientes",
      desc: "Consultar e gerenciar seus clientes",
      url: "/clientes",
      icon: Users,
    },
    {
      title: "Produtos",
      desc: "Consultar produtos e estoque",
      url: "/produtos",
      icon: Package,
    },
    {
      title: "Financeiro",
      desc: "Visão financeira da empresa",
      url: "/fluxo-de-caixa",
      icon: Wallet,
    },
    {
      title: "Oportunidades",
      desc: "Acompanhe suas oportunidades",
      url: "/crm",
      icon: Sparkles,
    },
    {
      title: "Projetos",
      desc: "Gerencie seus projetos",
      url: "/projetos",
      icon: FolderOpen,
    },
    {
      title: "Tarefas",
      desc: "Acompanhe suas tarefas",
      url: "/agenda-de-entregas",
      icon: FileCheck2,
    },
  ];

  return (
    <div className="space-y-4 p-4 pb-28 bg-[#F8F9FA] dark:bg-zinc-950 min-h-screen animate-fade-in">
      {/* 1. CARD DE RESUMO OPERACIONAL */}
      <div className="rounded-3xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs p-5 relative overflow-hidden">
        {/* Barra superior de destaque laranja */}
        <div className="h-1 w-28 bg-[#FF5000] rounded-full mb-3" />

        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-bold text-[#FF5000] uppercase tracking-wider block">
              Resumo Operacional
            </span>
            <span className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 block">
              Visão geral da empresa
            </span>
          </div>

          <div className="w-11 h-11 rounded-2xl bg-[#FFF3EC] dark:bg-orange-950/40 text-[#FF5000] flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-[#FF5000]" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {formatBRL(metrics.saldoReal)}
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
            Saldo Líquido Operacional
          </p>
        </div>

        {/* Sub-indicadores: A Receber Hoje & A Pagar Hoje */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {/* A Receber Hoje */}
          <div className="bg-[#E8F8F0] dark:bg-emerald-950/20 border border-[#BFF0D7] dark:border-emerald-800/40 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#00875A] dark:text-emerald-400 uppercase tracking-wider block">
                A Receber Hoje
              </span>
              <span className="text-sm sm:text-base font-extrabold text-[#006644] dark:text-emerald-300 block mt-0.5">
                {formatBRL(metrics.receberHoje)}
              </span>
            </div>
            <div className="w-7 h-7 rounded-full bg-[#D3F3E3] dark:bg-emerald-900/60 flex items-center justify-center text-[#00875A] dark:text-emerald-300 shrink-0">
              <TrendingDown className="w-4 h-4 rotate-180 stroke-[2.5px]" />
            </div>
          </div>

          {/* A Pagar Hoje */}
          <div className="bg-[#FFF0F0] dark:bg-rose-950/20 border border-[#FFD2D2] dark:border-rose-800/40 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#DE350B] dark:text-rose-400 uppercase tracking-wider block">
                A Pagar Hoje
              </span>
              <span className="text-sm sm:text-base font-extrabold text-[#BF2600] dark:text-rose-300 block mt-0.5">
                {formatBRL(metrics.pagarHoje)}
              </span>
            </div>
            <div className="w-7 h-7 rounded-full bg-[#FFE0E0] dark:bg-rose-900/60 flex items-center justify-center text-[#DE350B] dark:text-rose-300 shrink-0">
              <TrendingUp className="w-4 h-4 stroke-[2.5px]" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. ATALHOS RÁPIDOS */}
      <div className="space-y-2.5 pt-1">
        <div>
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-[#FF5000] fill-[#FF5000]/20" />
            Atalhos Rápidos
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Acesse as principais ações com poucos toques
          </p>
        </div>

        {/* 4 Cards de Atalho Horizontais */}
        <div className="grid grid-cols-4 gap-2">
          {/* 1. Cadastrar cliente */}
          <button
            onClick={() => setNovoClienteOpen(true)}
            className="p-2.5 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:border-[#FF5000]/50 transition-all flex flex-col justify-between h-28 text-left group active:scale-[0.97] cursor-pointer"
          >
            <div className="w-7 h-7 rounded-xl bg-[#FFF3EC] dark:bg-orange-950/40 text-[#FF5000] flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-[#FF5000]" />
            </div>
            <div>
              <span className="font-bold text-[11px] text-slate-900 dark:text-white group-hover:text-[#FF5000] transition-colors leading-tight block">
                Cadastrar cliente
              </span>
              <div className="flex justify-end mt-1">
                <ArrowRight className="w-3 h-3 text-[#FF5000] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>

          {/* 2. Nova venda */}
          <button
            onClick={() => setNovoRecebimentoOpen(true)}
            className="p-2.5 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:border-[#FF5000]/50 transition-all flex flex-col justify-between h-28 text-left group active:scale-[0.97] cursor-pointer"
          >
            <div className="w-7 h-7 rounded-xl bg-[#FFF3EC] dark:bg-orange-950/40 text-[#FF5000] flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 text-[#FF5000]" />
            </div>
            <div>
              <span className="font-bold text-[11px] text-slate-900 dark:text-white group-hover:text-[#FF5000] transition-colors leading-tight block">
                Nova venda
              </span>
              <div className="flex justify-end mt-1">
                <ArrowRight className="w-3 h-3 text-[#FF5000] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>

          {/* 3. Conta a receber */}
          <button
            onClick={() => setNovoRecebimentoOpen(true)}
            className="p-2.5 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:border-[#FF5000]/50 transition-all flex flex-col justify-between h-28 text-left group active:scale-[0.97] cursor-pointer"
          >
            <div className="w-7 h-7 rounded-xl bg-[#FFF3EC] dark:bg-orange-950/40 text-[#FF5000] flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4 text-[#FF5000]" />
            </div>
            <div>
              <span className="font-bold text-[11px] text-slate-900 dark:text-white group-hover:text-[#FF5000] transition-colors leading-tight block">
                Conta a receber
              </span>
              <div className="flex justify-end mt-1">
                <ArrowRight className="w-3 h-3 text-[#FF5000] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>

          {/* 4. Novo orçamento */}
          <button
            onClick={() => setNovoContratoOpen(true)}
            className="p-2.5 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:border-[#FF5000]/50 transition-all flex flex-col justify-between h-28 text-left group active:scale-[0.97] cursor-pointer"
          >
            <div className="w-7 h-7 rounded-xl bg-[#FFF3EC] dark:bg-orange-950/40 text-[#FF5000] flex items-center justify-center shrink-0">
              <FileCheck2 className="w-4 h-4 text-[#FF5000]" />
            </div>
            <div>
              <span className="font-bold text-[11px] text-slate-900 dark:text-white group-hover:text-[#FF5000] transition-colors leading-tight block">
                Novo orçamento
              </span>
              <div className="flex justify-end mt-1">
                <ArrowRight className="w-3 h-3 text-[#FF5000] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 4. SEÇÃO DE MÓDULOS (Grid de 2 Colunas conforme o design) */}
      <div className="space-y-2.5 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4 text-[#FF5000]" />
              Módulos
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Acompanhe e acesse seus fluxos de trabalho
            </p>
          </div>

          <button
            onClick={() => navigate({ to: "/fluxo-de-caixa" })}
            className="text-xs font-bold text-[#FF5000] hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
          >
            Ver todos
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {modulesGrid.map((m) => {
            const IconComponent = m.icon;
            return (
              <Link
                key={m.url}
                to={m.url as any}
                className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:border-[#FF5000]/40 transition-all flex items-center justify-between group active:scale-[0.98]"
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF3EC] dark:bg-orange-950/40 text-[#FF5000] flex items-center justify-center shrink-0">
                    <IconComponent className="w-4.5 h-4.5 text-[#FF5000]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-[#FF5000] transition-colors truncate block">
                      {m.title}
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 line-clamp-2 mt-0.5 leading-tight">
                      {m.desc}
                    </p>
                  </div>
                </div>

                <ArrowRight className="w-3.5 h-3.5 text-[#FF5000] group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Modais de Criação Rápida */}
      <NovoClienteSheet open={novoClienteOpen} onOpenChange={setNovoClienteOpen} />
      <NovoRecebimentoSheet open={novoRecebimentoOpen} onOpenChange={setNovoRecebimentoOpen} />
      <NovaContaSheet open={novoPagamentoOpen} onOpenChange={setNovoPagamentoOpen} />
      <NovoProjetoSheet open={novoProjetoOpen} onOpenChange={setNovoProjetoOpen} />
      <NovoContratoSheet open={novoContratoOpen} onOpenChange={setNovoContratoOpen} />
    </div>
  );
}
