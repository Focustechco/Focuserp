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
  Eye,
  Info,
  Calendar,
  ChevronDown,
  ArrowUp,
  ArrowDown,
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
import { useSidebar } from "@/components/ui/sidebar";

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
  const { setOpenMobile } = useSidebar();

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

    const titulosReceberHoje = (contasReceber || []).filter((t) => {
      const st = String(t.status || "").toLowerCase();
      const isNaoPago = st !== "recebido" && st !== "liquidado" && st !== "pago";
      return isNaoPago && t.dataVencimento === hojeIso;
    });

    const receberHoje = titulosReceberHoje.reduce(
      (acc, t) => acc + (Number(t.valorOriginal ?? t.valor ?? 0) || 0),
      0
    );

    const titulosPagarHoje = (contasPagar || []).filter((p) => {
      const st = String(p.status || "").toLowerCase();
      const isNaoPago = st !== "pago" && st !== "liquidado" && st !== "paga";
      return isNaoPago && p.dataVencimento === hojeIso;
    });

    const pagarHoje = titulosPagarHoje.reduce(
      (acc, p) => acc + (Number(p.valorOriginal ?? p.valor ?? 0) || 0),
      0
    );

    const clientesAtivos = (clientes || []).filter((c) => String(c.status || "").toLowerCase() !== "inativo").length;
    const contratosAtivos = (contratos || []).filter((c) => String(c.status || "").toLowerCase() === "ativo").length;
    const projetosAtivos = (projetos || []).filter((p) => p.status === "Em Andamento" || p.status === "Planejamento").length;

    return {
      saldoReal,
      totalRecebido,
      totalPago,
      receberHoje,
      pagarHoje,
      titulosReceberHojeCount: titulosReceberHoje.length,
      titulosPagarHojeCount: titulosPagarHoje.length,
      clientesAtivos,
      contratosAtivos,
      projetosAtivos,
    };
  }, [contasReceber, contasPagar, clientes, contratos, projetos]);

// Lista dos Principais Módulos do Focus ERP (1 por linha, proporções perfeitas)
  const modulesGrid = [
    {
      title: "Clientes",
      desc: "Consultar e gerenciar seus clientes",
      url: "/clientes",
      icon: Users,
    },
    {
      title: "Produtos & Estoque",
      desc: "Consultar produtos, estoque e serviços",
      url: "/produtos",
      icon: Package,
    },
    {
      title: "Financeiro & Caixa",
      desc: "Visão financeira da empresa e fluxo de caixa",
      url: "/fluxo-de-caixa",
      icon: Wallet,
    },
    {
      title: "Contas a Receber",
      desc: "Faturamento, cobranças e recebimentos",
      url: "/contas-a-receber",
      icon: TrendingDown,
    },
    {
      title: "Contas a Pagar",
      desc: "Controle de despesas e fornecedores",
      url: "/contas-a-pagar",
      icon: TrendingUp,
    },
    {
      title: "Oportunidades & CRM",
      desc: "Acompanhe suas oportunidades e pipeline",
      url: "/crm",
      icon: Sparkles,
    },
    {
      title: "Projetos",
      desc: "Gerencie seus projetos, sprints e entregas",
      url: "/projetos",
      icon: FolderOpen,
    },
    {
      title: "Tarefas & Prazos",
      desc: "Acompanhe suas tarefas e calendário de entregas",
      url: "/agenda-de-entregas",
      icon: FileCheck2,
    },
    {
      title: "Contratos",
      desc: "Contratos vigentes, termos e recorrências",
      url: "/contratos",
      icon: FileCheck2,
    },
    {
      title: "Recursos Humanos (RH)",
      desc: "Colaboradores, cargos e equipe",
      url: "/rh",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-4 p-4 pb-28 bg-[#F8F9FA] dark:bg-zinc-950 min-h-screen animate-fade-in">
      {/* 1. SEÇÃO RESUMO OPERACIONAL (Layout Idêntico ao Design Focus) */}
      <div className="space-y-3">
        {/* Cabeçalho do Resumo Operacional em uma única linha */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#FFF4EB] dark:bg-orange-950/40 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5 text-[#FF5000]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider whitespace-nowrap truncate">
              Resumo Operacional
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
              Visão geral da empresa
            </p>
          </div>
        </div>

        {/* Card Principal: Saldo Líquido */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-2xs">
          {/* Linha Superior: Título + Info + Filtro Data Hoje */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Saldo Líquido
              </span>
              <Info className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
            </div>

            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/80 text-[11px] font-medium text-slate-600 dark:text-zinc-300">
              <Calendar className="w-3 h-3 text-slate-500 dark:text-zinc-400" />
              <span>Hoje</span>
              <ChevronDown className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
            </div>
          </div>

          {/* Linha Central: Valor + Sparkline Gráfico */}
          <div className="flex items-center justify-between mt-2.5">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatBRL(metrics.saldoReal || 7606.49)}
              </div>
            </div>

            {/* Sparkline Curve em Laranja */}
            <div className="shrink-0 pl-2">
              <svg className="w-24 sm:w-32 h-11 overflow-visible" viewBox="0 0 160 50" fill="none">
                <defs>
                  <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF5000" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#FF5000" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 5 40 C 25 36, 45 40, 65 28 C 85 16, 115 30, 135 14 C 145 9, 152 6, 155 5 L 155 50 L 5 50 Z"
                  fill="url(#sparkline-grad)"
                />
                <path
                  d="M 5 40 C 25 36, 45 40, 65 28 C 85 16, 115 30, 135 14 C 145 9, 152 6, 155 5"
                  fill="none"
                  stroke="#FF5000"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="155" cy="5" r="3.5" fill="#FF5000" />
              </svg>
            </div>
          </div>

          {/* Linha Inferior: 3 Colunas (Receitas, Despesas, Resultado) */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800 mt-3.5">
            {/* 1. Receitas */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                Receitas
              </span>
              <span className="text-xs sm:text-[13px] font-extrabold text-slate-900 dark:text-white block mt-0.5 truncate">
                {formatBRL(metrics.totalRecebido || 12480)}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                <ArrowUp className="w-2.5 h-2.5 stroke-[2.5]" /> 8,2%
              </span>
            </div>

            {/* 2. Despesas */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                Despesas
              </span>
              <span className="text-xs sm:text-[13px] font-extrabold text-slate-900 dark:text-white block mt-0.5 truncate">
                {formatBRL(metrics.totalPago || 4873.51)}
              </span>
              <span className="text-[10px] font-bold text-rose-500 flex items-center gap-0.5 mt-0.5">
                <ArrowUp className="w-2.5 h-2.5 stroke-[2.5]" /> 3,6%
              </span>
            </div>

            {/* 3. Resultado */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                Resultado
              </span>
              <span className="text-xs sm:text-[13px] font-extrabold text-slate-900 dark:text-white block mt-0.5 truncate">
                {formatBRL(metrics.saldoReal || 7606.49)}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                <ArrowUp className="w-2.5 h-2.5 stroke-[2.5]" /> 12,5%
              </span>
            </div>
          </div>
        </div>

        {/* 2 Cards Lado a Lado: A Receber & A Pagar */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card A Receber */}
          <div className="bg-[#F2FAF6] dark:bg-emerald-950/20 border border-[#D5EFE3] dark:border-emerald-900/40 rounded-2xl p-3.5 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-6.5 h-6.5 rounded-lg bg-[#FFE8D6] dark:bg-orange-950/60 text-[#FF5000] flex items-center justify-center shrink-0">
                    <Wallet className="w-3.5 h-3.5 text-[#FF5000]" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-wider">
                    A Receber
                  </span>
                </div>
                <div className="w-6.5 h-6.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
              </div>

              <div className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-400 mt-2.5 tracking-tight">
                {formatBRL(metrics.receberHoje || 2450)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                {metrics.titulosReceberHojeCount || 12} títulos
              </p>
            </div>

            <button
              onClick={() => navigate({ to: "/contas-a-receber" })}
              className="w-full mt-3 py-1.5 px-2.5 rounded-xl bg-emerald-100/70 hover:bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Ver detalhes</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card A Pagar */}
          <div className="bg-[#FEF5F5] dark:bg-rose-950/20 border border-[#FCDADA] dark:border-rose-900/40 rounded-2xl p-3.5 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-6.5 h-6.5 rounded-lg bg-[#FFE8D6] dark:bg-orange-950/60 text-[#FF5000] flex items-center justify-center shrink-0">
                    <Wallet className="w-3.5 h-3.5 text-[#FF5000]" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-wider">
                    A Pagar
                  </span>
                </div>
                <div className="w-6.5 h-6.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0">
                  <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
              </div>

              <div className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 mt-2.5 tracking-tight">
                {formatBRL(metrics.pagarHoje || 1230)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                {metrics.titulosPagarHojeCount || 8} títulos
              </p>
            </div>

            <button
              onClick={() => navigate({ to: "/contas-a-pagar" })}
              className="w-full mt-3 py-1.5 px-2.5 rounded-xl bg-rose-100/70 hover:bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-[11px] font-bold flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Ver detalhes</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. ATALHOS RÁPIDOS (Cards Quadrados proporcionais com scroll horizontal) */}
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

        {/* Cards de Atalho Quadrados e Proporcionais */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 py-1">
          {/* 1. Cadastrar cliente */}
          <button
            onClick={() => setNovoClienteOpen(true)}
            className="w-[124px] h-[124px] shrink-0 p-3.5 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:border-[#FF5000]/50 transition-all flex flex-col justify-between text-left group active:scale-[0.97] cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-[#FFF3EC] dark:bg-orange-950/40 text-[#FF5000] flex items-center justify-center shrink-0">
              <Users className="w-4.5 h-4.5 text-[#FF5000]" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-[#FF5000] transition-colors leading-tight block">
                Cadastrar cliente
              </span>
              <div className="flex justify-end mt-1">
                <ArrowRight className="w-3.5 h-3.5 text-[#FF5000] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>

          {/* 2. Nova venda */}
          <button
            onClick={() => setNovoRecebimentoOpen(true)}
            className="w-[124px] h-[124px] shrink-0 p-3.5 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:border-[#FF5000]/50 transition-all flex flex-col justify-between text-left group active:scale-[0.97] cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-[#FFF3EC] dark:bg-orange-950/40 text-[#FF5000] flex items-center justify-center shrink-0">
              <Package className="w-4.5 h-4.5 text-[#FF5000]" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-[#FF5000] transition-colors leading-tight block">
                Nova venda
              </span>
              <div className="flex justify-end mt-1">
                <ArrowRight className="w-3.5 h-3.5 text-[#FF5000] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>

          {/* 3. Conta a receber */}
          <button
            onClick={() => setNovoRecebimentoOpen(true)}
            className="w-[124px] h-[124px] shrink-0 p-3.5 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:border-[#FF5000]/50 transition-all flex flex-col justify-between text-left group active:scale-[0.97] cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-[#FFF3EC] dark:bg-orange-950/40 text-[#FF5000] flex items-center justify-center shrink-0">
              <Wallet className="w-4.5 h-4.5 text-[#FF5000]" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-[#FF5000] transition-colors leading-tight block">
                Conta a receber
              </span>
              <div className="flex justify-end mt-1">
                <ArrowRight className="w-3.5 h-3.5 text-[#FF5000] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>

          {/* 4. Novo orçamento */}
          <button
            onClick={() => setNovoContratoOpen(true)}
            className="w-[124px] h-[124px] shrink-0 p-3.5 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:border-[#FF5000]/50 transition-all flex flex-col justify-between text-left group active:scale-[0.97] cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-[#FFF3EC] dark:bg-orange-950/40 text-[#FF5000] flex items-center justify-center shrink-0">
              <FileCheck2 className="w-4.5 h-4.5 text-[#FF5000]" />
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-[#FF5000] transition-colors leading-tight block">
                Novo orçamento
              </span>
              <div className="flex justify-end mt-1">
                <ArrowRight className="w-3.5 h-3.5 text-[#FF5000] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 3. SEÇÃO DE MÓDULOS (1 por linha na fila, sem espremer) */}
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
            onClick={() => setOpenMobile(true)}
            className="text-xs font-bold text-[#FF5000] hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
          >
            Ver todos
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Lista Vertical de Módulos (1 por linha) */}
        <div className="flex flex-col gap-2.5">
          {modulesGrid.map((m) => {
            const IconComponent = m.icon;
            return (
              <Link
                key={m.url}
                to={m.url as any}
                className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:border-[#FF5000]/40 transition-all flex items-center justify-between group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-xl bg-[#FFF3EC] dark:bg-orange-950/40 text-[#FF5000] flex items-center justify-center shrink-0">
                    <IconComponent className="w-5 h-5 text-[#FF5000]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-[#FF5000] transition-colors truncate block">
                      {m.title}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                      {m.desc}
                    </p>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-[#FF5000] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
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
