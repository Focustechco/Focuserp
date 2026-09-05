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

  // Lista dos Principais Módulos do Focus ERP (Todos com ícone laranja padrão)
  const modulesList = [
    {
      title: "Clientes",
      desc: "Consultar e gerenciar seus clientes",
      url: "/clientes",
      badge: `${metrics.clientesAtivos} ativos`,
      icon: Users,
    },
    {
      title: "Contas a Receber",
      desc: "Recebimentos, faturamento e cobranças",
      url: "/contas-a-receber",
      badge: undefined,
      icon: TrendingUp,
    },
    {
      title: "Contas a Pagar",
      desc: "Controle de despesas e fornecedores",
      url: "/contas-a-pagar",
      badge: undefined,
      icon: TrendingDown,
    },
    {
      title: "Fluxo de Caixa",
      desc: "Entradas, saídas e projeção de saldo",
      url: "/fluxo-de-caixa",
      badge: undefined,
      icon: Wallet,
    },
    {
      title: "Produtos Focus",
      desc: "Catálogo de produtos, softwares e serviços",
      url: "/produtos",
      badge: undefined,
      icon: Boxes,
    },
    {
      title: "Projetos",
      desc: "Entregas, sprints e roadmap",
      url: "/projetos",
      badge: `${metrics.projetosAtivos} em andamento`,
      icon: Briefcase,
    },
    {
      title: "Contratos",
      desc: "Contratos vigentes, termos e MRR",
      url: "/contratos",
      badge: `${metrics.contratosAtivos} ativos`,
      icon: FileCheck2,
    },
    {
      title: "Recursos Humanos (RH)",
      desc: "Colaboradores, cargos e equipe",
      url: "/rh",
      badge: undefined,
      icon: UserCog,
    },
    {
      title: "CRM & Pipeline",
      desc: "Negócios, leads e oportunidades",
      url: "/crm",
      badge: undefined,
      icon: Sparkles,
    },
    {
      title: "Relatórios & DRE",
      desc: "Demonstrativos, balanços e indicadores",
      url: "/relatorios",
      badge: undefined,
      icon: BarChart3,
    },
    {
      title: "Central de Documentos",
      desc: "Gestão eletrônica de arquivos e contratos (DMS)",
      url: "/documentos",
      badge: undefined,
      icon: FolderOpen,
    },
    {
      title: "Estoque & Patrimônio",
      desc: "Controle de ativos, produtos e inventário",
      url: "/estoque",
      badge: undefined,
      icon: Package,
    },
  ];

  return (
    <div className="space-y-5 p-4 pb-24 bg-slate-50/60 dark:bg-zinc-950 min-h-screen animate-fade-in">
      {/* 1. STATUS DO SISTEMA */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 tracking-wider uppercase">
            Sistema Online • Conectado
          </span>
        </div>
      </div>

      {/* 2. SAUDAÇÃO COM ADRIANO EM LARANJA */}
      <div className="space-y-0.5">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {greeting}, <span className="text-[#FF6A00]">{primeiroNome}</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
          Painel principal • {dataHojeStr}
        </p>
      </div>

      {/* 3. CARD DE RESUMO OPERACIONAL */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs overflow-hidden">
        {/* Detalhe fino laranja no topo */}
        <div className="h-1 w-full bg-[#FF6A00]" />

        <div className="p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider block">
                Resumo Operacional
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">Visão geral da empresa</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[#FFF4EA] dark:bg-orange-950/40 text-[#FF6A00] flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4 text-[#FF6A00]" />
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatBRL(metrics.saldoReal)}
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-0.5">
              Saldo Líquido Operacional
            </p>
          </div>

          {/* Sub-indicadores de Hoje */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800">
              <span className="text-[10px] font-bold text-slate-600 dark:text-zinc-300 block uppercase">
                A Receber Hoje
              </span>
              <span className="text-sm font-black text-slate-900 dark:text-white block mt-0.5">
                {formatBRL(metrics.receberHoje)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800">
              <span className="text-[10px] font-bold text-slate-600 dark:text-zinc-300 block uppercase">
                A Pagar Hoje
              </span>
              <span className="text-sm font-black text-slate-900 dark:text-white block mt-0.5">
                {formatBRL(metrics.pagarHoje)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. ATALHOS RÁPIDOS */}
      <div className="space-y-2.5 pt-1">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-[#FF6A00]" />
            Atalhos rápidos
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Acesse as principais ações com poucos toques
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Atalho 1: Cadastrar Cliente */}
          <button
            onClick={() => setNovoClienteOpen(true)}
            className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:border-[#FF6A00]/50 transition-all flex flex-col justify-between text-left group active:scale-[0.98] cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-[#FFF4EA] dark:bg-orange-950/40 text-[#FF6A00] flex items-center justify-center mb-3 shrink-0">
              <Users className="w-4.5 h-4.5 text-[#FF6A00]" />
            </div>
            <div className="flex items-center justify-between w-full">
              <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-[#FF6A00] transition-colors leading-tight">
                Cadastrar cliente
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-[#FF6A00] transition-all shrink-0 ml-1" />
            </div>
          </button>

          {/* Atalho 2: Novo Recebimento */}
          <button
            onClick={() => setNovoRecebimentoOpen(true)}
            className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:border-[#FF6A00]/50 transition-all flex flex-col justify-between text-left group active:scale-[0.98] cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-[#FFF4EA] dark:bg-orange-950/40 text-[#FF6A00] flex items-center justify-center mb-3 shrink-0">
              <TrendingUp className="w-4.5 h-4.5 text-[#FF6A00]" />
            </div>
            <div className="flex items-center justify-between w-full">
              <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-[#FF6A00] transition-colors leading-tight">
                Novo recebimento
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-[#FF6A00] transition-all shrink-0 ml-1" />
            </div>
          </button>

          {/* Atalho 3: Nova Despesa */}
          <button
            onClick={() => setNovoPagamentoOpen(true)}
            className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:border-[#FF6A00]/50 transition-all flex flex-col justify-between text-left group active:scale-[0.98] cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-[#FFF4EA] dark:bg-orange-950/40 text-[#FF6A00] flex items-center justify-center mb-3 shrink-0">
              <TrendingDown className="w-4.5 h-4.5 text-[#FF6A00]" />
            </div>
            <div className="flex items-center justify-between w-full">
              <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-[#FF6A00] transition-colors leading-tight">
                Nova despesa
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-[#FF6A00] transition-all shrink-0 ml-1" />
            </div>
          </button>

          {/* Atalho 4: Novo Projeto */}
          <button
            onClick={() => setNovoProjetoOpen(true)}
            className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:border-[#FF6A00]/50 transition-all flex flex-col justify-between text-left group active:scale-[0.98] cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-[#FFF4EA] dark:bg-orange-950/40 text-[#FF6A00] flex items-center justify-center mb-3 shrink-0">
              <Briefcase className="w-4.5 h-4.5 text-[#FF6A00]" />
            </div>
            <div className="flex items-center justify-between w-full">
              <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-[#FF6A00] transition-colors leading-tight">
                Novo projeto
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-[#FF6A00] transition-all shrink-0 ml-1" />
            </div>
          </button>
        </div>
      </div>

      {/* 5. SEÇÃO DE MÓDULOS (Cards com Ícones em Laranja Focus) */}
      <div className="space-y-2.5 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4 text-[#FF6A00]" />
              Módulos
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Acompanhe e acesse seus fluxos de trabalho
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {modulesList.map((m) => {
            const IconComponent = m.icon;
            return (
              <Link
                key={m.url}
                to={m.url as any}
                className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:border-[#FF6A00]/40 transition-all flex items-center justify-between group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF4EA] dark:bg-orange-950/40 text-[#FF6A00] flex items-center justify-center shrink-0">
                    <IconComponent className="w-5 h-5 text-[#FF6A00]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-[#FF6A00] transition-colors truncate">
                        {m.title}
                      </span>
                      {m.badge && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-md shrink-0">
                          {m.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                      {m.desc}
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 group-hover:text-[#FF6A00] transition-all shrink-0 ml-2" />
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
