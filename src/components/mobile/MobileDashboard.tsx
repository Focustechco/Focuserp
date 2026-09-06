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
  PieChart,
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
  EyeOff,
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

import { TituloReceber } from "@/features/contas-receber/types";
import { ContaPagar } from "@/features/contas-pagar/types";

const formatBRL = (v?: number | null) => {
  const num = typeof v === "number" && !isNaN(v) ? v : 0;
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
};

export function MobileDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { setOpenMobile } = useSidebar();

  // Queries e Estados de Dados Reais
  const { data: localTitulos = [] } = useLocalStorageState<TituloReceber>("focus_contas_receber");
  const { titulos: queryTitulos = [] } = useContasReceberQuery();

  const { data: localContas = [] } = useLocalStorageState<ContaPagar>("focus_contas_pagar");
  const { contas: queryContas = [] } = useContasPagarQuery();

  const { data: clientes = [] } = useClientesQuery();
  const { data: contratos = [] } = useLocalStorageState<Contrato>("focus_contratos");
  const { data: projetos = [] } = useLocalStorageState<Projeto>("focus_projetos");

  // Fusão Consistente de Dados Reais
  const contasReceber = useMemo(() => {
    const map = new Map<string, any>();
    localTitulos.forEach((t) => {
      if (t && t.id && ((t.cliente || t.clienteNome) || t.descricao || (t.numero && !t.numero.startsWith('REC-0000')) || Number(t.valorOriginal || t.valor || 0) > 0)) {
        map.set(t.id, t);
      }
    });
    queryTitulos.forEach((t) => {
      if (t && t.id && ((t.cliente || t.clienteNome) || t.descricao || (t.numero && !t.numero.startsWith('REC-0000')) || Number(t.valorOriginal || t.valor || 0) > 0)) {
        if (!map.has(t.id)) map.set(t.id, t);
      }
    });
    return Array.from(map.values());
  }, [localTitulos, queryTitulos]);

  const contasPagar = useMemo(() => {
    const map = new Map<string, any>();
    localContas.forEach((c) => {
      if (c && c.id && ((c.fornecedor || c.fornecedorNome || c.beneficiario) || c.descricao || Number(c.valorOriginal || c.valor || 0) > 0)) {
        map.set(c.id, c);
      }
    });
    queryContas.forEach((c) => {
      if (c && c.id && ((c.fornecedor || c.fornecedorNome || c.beneficiario) || c.descricao || Number(c.valorOriginal || c.valor || 0) > 0)) {
        if (!map.has(c.id)) map.set(c.id, c);
      }
    });
    return Array.from(map.values());
  }, [localContas, queryContas]);

  // Modais de Criação Rápida
  const [novoRecebimentoOpen, setNovoRecebimentoOpen] = useState(false);
  const [novoPagamentoOpen, setNovoPagamentoOpen] = useState(false);
  const [novoClienteOpen, setNovoClienteOpen] = useState(false);
  const [novoContratoOpen, setNovoContratoOpen] = useState(false);
  const [novoProjetoOpen, setNovoProjetoOpen] = useState(false);

  // Ocultar / Exibir valores financeiros (Modo Privacidade Mobile)
  const [hideValues, setHideValues] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("focus_mobile_hide_values") === "true";
      } catch {
        return false;
      }
    }
    return false;
  });

  const toggleHideValues = () => {
    setHideValues((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("focus_mobile_hide_values", String(next));
        } catch {}
      }
      return next;
    });
  };

  const renderValor = (v?: number | null) => {
    if (hideValues) return "••••••";
    const val = typeof v === "number" && !isNaN(v) ? v : 0;
    return formatBRL(val);
  };

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

    let totalRecebido = 0;
    let totalAReceberPendente = 0;
    let totalReceberHoje = 0;
    let countReceberHoje = 0;
    let countAReceberGeral = 0;

    contasReceber.forEach((t) => {
      const valor = Number(t.valorOriginal ?? t.valor ?? t.saldo ?? 0) || 0;
      const valorRecebido = Number(t.valorRecebido ?? 0) || 0;
      const st = String(t.status || "").trim().toLowerCase();
      const isPago = st === "recebido" || st === "liquidado" || st === "pago";
      const dataVenc = t.dataVencimento || t.vencimento || t.data_vencimento || "";

      if (isPago) {
        totalRecebido += (valorRecebido || valor);
      } else {
        totalAReceberPendente += valor;
        countAReceberGeral++;
        if (dataVenc === hojeIso) {
          totalReceberHoje += valor;
          countReceberHoje++;
        }
      }
    });

    let totalPago = 0;
    let totalAPagarPendente = 0;
    let totalPagarHoje = 0;
    let countPagarHoje = 0;
    let countAPagarGeral = 0;

    contasPagar.forEach((p) => {
      const valor = Number(p.valorOriginal ?? p.valor ?? p.saldo ?? 0) || 0;
      const valorPago = Number(p.valorPago ?? 0) || 0;
      const st = String(p.status || "").trim().toLowerCase();
      const isPago = st === "pago" || st === "liquidado" || st === "paga";
      const dataVenc = p.dataVencimento || p.vencimento || p.data_vencimento || "";

      if (isPago) {
        totalPago += (valorPago || valor);
      } else {
        totalAPagarPendente += valor;
        countAPagarGeral++;
        if (dataVenc === hojeIso) {
          totalPagarHoje += valor;
          countPagarHoje++;
        }
      }
    });

    const saldoReal = totalRecebido - totalPago;

    const clientesAtivos = (clientes || []).filter((c) => String(c.status || "").toLowerCase() !== "inativo").length;
    const contratosAtivos = (contratos || []).filter((c) => String(c.status || "").toLowerCase() === "ativo").length;
    const projetosAtivos = (projetos || []).filter((p) => p.status === "Em Andamento" || p.status === "Planejamento").length;

    const aReceberExibicao = totalReceberHoje > 0 ? totalReceberHoje : totalAReceberPendente;
    const aPagarExibicao = totalPagarHoje > 0 ? totalPagarHoje : totalAPagarPendente;
    const countReceberExibicao = totalReceberHoje > 0 ? countReceberHoje : countAReceberGeral;
    const countPagarExibicao = totalPagarHoje > 0 ? countPagarHoje : countAPagarGeral;

    return {
      saldoReal,
      totalRecebido,
      totalPago,
      receberHoje: aReceberExibicao,
      pagarHoje: aPagarExibicao,
      totalAReceberPendente,
      totalAPagarPendente,
      titulosReceberHojeCount: countReceberExibicao,
      titulosPagarHojeCount: countPagarExibicao,
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
      icon: TrendingUp,
    },
    {
      title: "Contas a Pagar",
      desc: "Controle de despesas e fornecedores",
      url: "/contas-a-pagar",
      icon: TrendingDown,
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
        {/* Cabeçalho do Resumo Operacional em uma única linha com Botão de Ocultar/Exibir Valores */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF4EB] dark:bg-orange-950/40 flex items-center justify-center shrink-0">
              <PieChart className="w-5 h-5 text-[#FF5000]" />
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

          {/* Botão de Olho Minimalista e Clean */}
          <button
            onClick={toggleHideValues}
            className="h-8 w-8 rounded-xl text-slate-400 hover:text-[#FF5000] hover:bg-orange-500/10 active:bg-orange-500/20 dark:text-zinc-500 dark:hover:text-orange-400 transition-colors flex items-center justify-center cursor-pointer shrink-0"
            aria-label={hideValues ? "Exibir valores" : "Ocultar valores"}
            title={hideValues ? "Exibir valores" : "Ocultar valores"}
          >
            {hideValues ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
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
                {renderValor(metrics.saldoReal)}
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
                {renderValor(metrics.totalRecebido)}
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
                {renderValor(metrics.totalPago)}
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
                {renderValor(metrics.saldoReal)}
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
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#FFE8D6] dark:bg-orange-950/60 text-[#FF5000] flex items-center justify-center shrink-0">
                  <TrendingUp className="w-3.5 h-3.5 text-[#FF5000]" />
                </div>
                <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-wider whitespace-nowrap truncate">
                  A Receber
                </span>
              </div>

              <div className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-400 mt-2.5 tracking-tight">
                {renderValor(metrics.receberHoje)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                {metrics.titulosReceberHojeCount} títulos
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
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#FFE8D6] dark:bg-orange-950/60 text-[#FF5000] flex items-center justify-center shrink-0">
                  <TrendingDown className="w-3.5 h-3.5 text-[#FF5000]" />
                </div>
                <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-wider whitespace-nowrap truncate">
                  A Pagar
                </span>
              </div>

              <div className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 mt-2.5 tracking-tight">
                {renderValor(metrics.pagarHoje)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                {metrics.titulosPagarHojeCount} títulos
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

      {/* 2. ACESSOS RÁPIDOS (Cards Quadrados proporcionais com scroll horizontal) */}
      <div className="space-y-2.5 pt-1">
        <div>
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-[#FF5000] fill-[#FF5000]/20" />
            Acessos Rápidos
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
