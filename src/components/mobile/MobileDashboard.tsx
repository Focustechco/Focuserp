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
  Plus,
  Zap,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronRight,
  FolderOpen,
  FileCheck2,
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useContasReceberQuery } from "@/features/contas-receber/hooks/useContasReceberQuery";
import { useContasPagarQuery } from "@/features/contas-pagar/hooks/useContasPagarQuery";
import { useClientesQuery } from "@/features/clientes/hooks/useClientesQuery";
import { useLocalStorageState } from "@/hooks/useDataStore";
import { Contrato } from "@/features/contratos/types";
import { Projeto } from "@/features/projetos/types";
import { formatDateBrasilia, getBrasiliaTodayIso } from "@/lib/dateUtils";
import { Card, CardContent } from "@/components/ui/card";
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
      .filter((t) => t.status === "Recebido")
      .reduce((acc, t) => acc + (Number(t.valorRecebido ?? t.valorOriginal ?? 0) || 0), 0);

    const totalPago = (contasPagar || [])
      .filter((p) => p.status === "Pago")
      .reduce((acc, p) => acc + (Number(p.valorPago ?? p.valorOriginal ?? 0) || 0), 0);

    const saldoReal = totalRecebido - totalPago;

    const receberHoje = (contasReceber || [])
      .filter((t) => t.dataVencimento === hojeIso && t.status !== "Recebido")
      .reduce((acc, t) => acc + (Number(t.valorOriginal ?? 0) || 0), 0);

    const pagarHoje = (contasPagar || [])
      .filter((p) => p.dataVencimento === hojeIso && p.status !== "Pago")
      .reduce((acc, p) => acc + (Number(p.valorOriginal ?? 0) || 0), 0);

    const clientesAtivos = (clientes || []).filter((c) => c.status !== "Inativo").length;
    const contratosAtivos = (contratos || []).filter((c) => c.status === "Ativo").length;
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

  return (
    <div className="space-y-6 p-4 pb-24 bg-white dark:bg-background min-h-screen animate-fade-in">
      {/* 1. CABEÇALHO DO DASHBOARD (Print 2 logic) */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wide uppercase">
              Sistema Online • Conectado
            </span>
          </div>
          <Badge variant="outline" className="text-[10px] font-semibold border-orange-500/30 text-orange-600 bg-orange-50/50 dark:bg-orange-950/30">
            Focus ERP
          </Badge>
        </div>

        <h1 className="text-2xl font-black text-foreground tracking-tight">
          {greeting}, <span className="text-orange-500">{primeiroNome}</span>
        </h1>
        <p className="text-xs text-muted-foreground font-medium">
          Painel principal • {dataHojeStr}
        </p>
      </div>

      {/* 2. CARD DE RESUMO OPERACIONAL (Print 2 logic) */}
      <div className="rounded-3xl border border-border/80 bg-white dark:bg-card shadow-sm hover:shadow-md transition-all overflow-hidden relative">
        {/* Linha de destaque no topo */}
        <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Resumo Operacional
              </span>
              <span className="text-[11px] text-muted-foreground">Visão geral da empresa</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-3xl font-black text-foreground tracking-tight">
              {formatBRL(metrics.saldoReal)}
            </div>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">
              Saldo Líquido Operacional
            </p>
          </div>

          {/* Sub-indicadores de Hoje */}
          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-border/60">
            <div className="p-2.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block uppercase">
                A Receber Hoje
              </span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-300 block mt-0.5">
                {formatBRL(metrics.receberHoje)}
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-500/20">
              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 block uppercase">
                A Pagar Hoje
              </span>
              <span className="text-sm font-black text-rose-600 dark:text-rose-300 block mt-0.5">
                {formatBRL(metrics.pagarHoje)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. ATALHOS RÁPIDOS (Print 2 logic) */}
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-500" />
            Atalhos rápidos
          </h2>
          <p className="text-xs text-muted-foreground">
            Acesse as principais ações com poucos toques
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Atalho 1: Cadastrar Pessoa / Cliente */}
          <button
            onClick={() => setNovoClienteOpen(true)}
            className="p-4 rounded-2xl border border-border/80 bg-white dark:bg-card shadow-2xs hover:border-orange-500/50 hover:shadow-md transition-all flex flex-col justify-between text-left group active:scale-[0.97]"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between w-full">
              <span className="font-extrabold text-xs text-foreground group-hover:text-orange-500 transition-colors">
                Cadastrar cliente
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-1 group-hover:text-orange-500 transition-all shrink-0" />
            </div>
          </button>

          {/* Atalho 2: Novo Recebimento */}
          <button
            onClick={() => setNovoRecebimentoOpen(true)}
            className="p-4 rounded-2xl border border-border/80 bg-white dark:bg-card shadow-2xs hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col justify-between text-left group active:scale-[0.97]"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between w-full">
              <span className="font-extrabold text-xs text-foreground group-hover:text-emerald-600 transition-colors">
                Novo recebimento
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-1 group-hover:text-emerald-600 transition-all shrink-0" />
            </div>
          </button>

          {/* Atalho 3: Nova Despesa */}
          <button
            onClick={() => setNovoPagamentoOpen(true)}
            className="p-4 rounded-2xl border border-border/80 bg-white dark:bg-card shadow-2xs hover:border-rose-500/50 hover:shadow-md transition-all flex flex-col justify-between text-left group active:scale-[0.97]"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-3">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between w-full">
              <span className="font-extrabold text-xs text-foreground group-hover:text-rose-600 transition-colors">
                Nova despesa
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-1 group-hover:text-rose-600 transition-all shrink-0" />
            </div>
          </button>

          {/* Atalho 4: Novo Projeto */}
          <button
            onClick={() => setNovoProjetoOpen(true)}
            className="p-4 rounded-2xl border border-border/80 bg-white dark:bg-card shadow-2xs hover:border-amber-500/50 hover:shadow-md transition-all flex flex-col justify-between text-left group active:scale-[0.97]"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between w-full">
              <span className="font-extrabold text-xs text-foreground group-hover:text-amber-600 transition-colors">
                Novo projeto
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-1 group-hover:text-amber-600 transition-all shrink-0" />
            </div>
          </button>
        </div>
      </div>

      {/* 4. SEÇÃO DE MÓDULOS (Print 2 logic) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-foreground tracking-tight">
              Módulos
            </h2>
            <p className="text-xs text-muted-foreground">
              Acompanhe e acesse seus fluxos de trabalho
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card Módulo: Clientes */}
          <Link
            to="/clientes"
            className="p-4 rounded-2xl border border-border/80 bg-white dark:bg-card shadow-2xs hover:border-orange-500/40 hover:shadow-md transition-all flex items-center justify-between group active:scale-[0.98]"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-foreground group-hover:text-orange-500 transition-colors">
                    Clientes
                  </span>
                  <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0 border-blue-500/30 text-blue-600">
                    {metrics.clientesAtivos}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Consultar e gerenciar seus clientes
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground/60 group-hover:text-orange-500 group-hover:translate-x-1 transition-all shrink-0" />
          </Link>

          {/* Card Módulo: Financeiro */}
          <Link
            to="/fluxo-de-caixa"
            className="p-4 rounded-2xl border border-border/80 bg-white dark:bg-card shadow-2xs hover:border-orange-500/40 hover:shadow-md transition-all flex items-center justify-between group active:scale-[0.98]"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-foreground group-hover:text-orange-500 transition-colors">
                    Financeiro
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Contas a pagar, receber e fluxo
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground/60 group-hover:text-orange-500 group-hover:translate-x-1 transition-all shrink-0" />
          </Link>

          {/* Card Módulo: Produtos & Catálogo */}
          <Link
            to="/produtos"
            className="p-4 rounded-2xl border border-border/80 bg-white dark:bg-card shadow-2xs hover:border-orange-500/40 hover:shadow-md transition-all flex items-center justify-between group active:scale-[0.98]"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-foreground group-hover:text-orange-500 transition-colors block">
                  Produtos & Serviços
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Consultar produtos e estoque
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground/60 group-hover:text-orange-500 group-hover:translate-x-1 transition-all shrink-0" />
          </Link>

          {/* Card Módulo: Projetos & Delivery */}
          <Link
            to="/projetos"
            className="p-4 rounded-2xl border border-border/80 bg-white dark:bg-card shadow-2xs hover:border-orange-500/40 hover:shadow-md transition-all flex items-center justify-between group active:scale-[0.98]"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-foreground group-hover:text-orange-500 transition-colors">
                    Projetos & Delivery
                  </span>
                  <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0 border-purple-500/30 text-purple-600">
                    {metrics.projetosAtivos}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Workspaces técnicos e sprints
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground/60 group-hover:text-orange-500 group-hover:translate-x-1 transition-all shrink-0" />
          </Link>

          {/* Card Módulo: Recursos Humanos */}
          <Link
            to="/rh"
            className="p-4 rounded-2xl border border-border/80 bg-white dark:bg-card shadow-2xs hover:border-orange-500/40 hover:shadow-md transition-all flex items-center justify-between group active:scale-[0.98]"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
                <UserCog className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-foreground group-hover:text-orange-500 transition-colors block">
                  Recursos Humanos
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Colaboradores, organograma e DP
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground/60 group-hover:text-orange-500 group-hover:translate-x-1 transition-all shrink-0" />
          </Link>

          {/* Card Módulo: Documentos DMS */}
          <Link
            to="/documentos"
            className="p-4 rounded-2xl border border-border/80 bg-white dark:bg-card shadow-2xs hover:border-orange-500/40 hover:shadow-md transition-all flex items-center justify-between group active:scale-[0.98]"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                <FolderOpen className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-foreground group-hover:text-orange-500 transition-colors block">
                  Documentos (DMS)
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Repositório e visualizador de arquivos
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground/60 group-hover:text-orange-500 group-hover:translate-x-1 transition-all shrink-0" />
          </Link>
        </div>
      </div>

      {/* Sheets Funcionais Oficiais */}
      <NovoRecebimentoSheet open={novoRecebimentoOpen} onOpenChange={setNovoRecebimentoOpen} />
      <NovaContaSheet open={novoPagamentoOpen} onOpenChange={setNovoPagamentoOpen} />
      <NovoClienteSheet open={novoClienteOpen} onOpenChange={setNovoClienteOpen} />
      <NovoContratoSheet open={novoContratoOpen} onOpenChange={setNovoContratoOpen} />
      <NovoProjetoSheet open={novoProjetoOpen} onOpenChange={setNovoProjetoOpen} />
    </div>
  );
}
