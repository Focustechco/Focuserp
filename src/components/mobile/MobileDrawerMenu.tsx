import React from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { 
  LayoutDashboard, Wallet, TrendingUp, TrendingDown, Bell, Landmark, CalendarDays,
  Users, Truck, Package, Building2, Tags, Briefcase, Code2, Headphones, Boxes,
  Heart, UserCog, Megaphone, FolderOpen, FileCheck2, BarChart3, LineChart, PieChart,
  Shield, Plug, Settings, X, ChevronRight, LogOut, Receipt
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useEmpresaConfig } from "@/features/configuracoes/hooks/useEmpresaConfig";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MobileDrawerMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MODULE_SECTIONS = [
  {
    title: "Principal",
    items: [
      { name: "Dashboard Executivo", path: "/", icon: LayoutDashboard, color: "text-orange-500", bg: "bg-orange-500/10" },
    ],
  },
  {
    title: "Financeiro & Tesouraria",
    items: [
      { name: "Fluxo de Caixa", path: "/fluxo-de-caixa", icon: Wallet, color: "text-emerald-500", bg: "bg-emerald-500/10" },
      { name: "Contas a Receber", path: "/contas-a-receber", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-500/10" },
      { name: "Contas a Pagar", path: "/contas-a-pagar", icon: TrendingDown, color: "text-rose-500", bg: "bg-rose-500/10" },
      { name: "Cobranças", path: "/cobrancas", icon: Bell, color: "text-amber-500", bg: "bg-amber-500/10" },
      { name: "Conciliação Bancária", path: "/conciliacao", icon: Landmark, color: "text-blue-500", bg: "bg-blue-500/10" },
      { name: "Agenda Financeira", path: "/agenda", icon: CalendarDays, color: "text-indigo-500", bg: "bg-indigo-500/10" },
      { name: "DRE Gerencial", path: "/dre", icon: LineChart, color: "text-cyan-500", bg: "bg-cyan-500/10" },
      { name: "Fiscal & NFe/NFSe", path: "/fiscal", icon: Receipt, color: "text-purple-500", bg: "bg-purple-500/10" },
    ],
  },
  {
    title: "Comercial & Vendas",
    items: [
      { name: "Clientes", path: "/clientes", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
      { name: "CRM & Oportunidades", path: "/crm", icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-500/10" },
      { name: "Contratos & Recorrência", path: "/contratos", icon: FileCheck2, color: "text-amber-500", bg: "bg-amber-500/10" },
      { name: "Propostas Comerciais", path: "/comercial", icon: Megaphone, color: "text-purple-500", bg: "bg-purple-500/10" },
      { name: "Marketing & Growth", path: "/marketing", icon: Megaphone, color: "text-pink-500", bg: "bg-pink-500/10" },
    ],
  },
  {
    title: "Operação & Tecnologia",
    items: [
      { name: "Projetos & Sprints", path: "/projetos", icon: Briefcase, color: "text-amber-500", bg: "bg-amber-500/10" },
      { name: "Desenvolvimento Técnico", path: "/desenvolvimento", icon: Code2, color: "text-cyan-500", bg: "bg-cyan-500/10" },
      { name: "Agenda de Entregas", path: "/agenda-de-entregas", icon: CalendarDays, color: "text-indigo-500", bg: "bg-indigo-500/10" },
      { name: "Produtos & Catálogo", path: "/produtos", icon: Boxes, color: "text-blue-500", bg: "bg-blue-500/10" },
      { name: "Estoque & Patrimônio", path: "/estoque", icon: Package, color: "text-emerald-500", bg: "bg-emerald-500/10" },
      { name: "Fornecedores", path: "/fornecedores", icon: Truck, color: "text-slate-500", bg: "bg-slate-500/10" },
      { name: "Suporte & Help Desk", path: "/suporte", icon: Headphones, color: "text-rose-500", bg: "bg-rose-500/10" },
    ],
  },
  {
    title: "Pessoas & Documentos",
    items: [
      { name: "Recursos Humanos (RH)", path: "/rh", icon: UserCog, color: "text-orange-500", bg: "bg-orange-500/10" },
      { name: "Central de Documentos (DMS)", path: "/documentos", icon: FolderOpen, color: "text-indigo-500", bg: "bg-indigo-500/10" },
      { name: "Assinaturas Digitais", path: "/assinaturas", icon: FileCheck2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
      { name: "Customer Success", path: "/customer-success", icon: Heart, color: "text-rose-500", bg: "bg-rose-500/10" },
    ],
  },
  {
    title: "Estratégico & Gestão",
    items: [
      { name: "Central de Relatórios", path: "/relatorios", icon: BarChart3, color: "text-purple-500", bg: "bg-purple-500/10" },
      { name: "Indicadores & KPIs", path: "/indicadores", icon: PieChart, color: "text-blue-500", bg: "bg-blue-500/10" },
      { name: "Centro de Custos", path: "/centro-de-custos", icon: Building2, color: "text-slate-500", bg: "bg-slate-500/10" },
      { name: "Categorias", path: "/categorias", icon: Tags, color: "text-amber-500", bg: "bg-amber-500/10" },
    ],
  },
  {
    title: "Administrativo",
    items: [
      { name: "Usuários & Contas", path: "/usuarios", icon: Users, color: "text-slate-500", bg: "bg-slate-500/10" },
      { name: "Matriz de Permissões", path: "/permissoes", icon: Shield, color: "text-emerald-500", bg: "bg-emerald-500/10" },
      { name: "Hub de Integrações", path: "/integracoes", icon: Plug, color: "text-cyan-500", bg: "bg-cyan-500/10" },
      { name: "Configurações da Empresa", path: "/configuracoes", icon: Settings, color: "text-orange-500", bg: "bg-orange-500/10" },
    ],
  },
];

export function MobileDrawerMenu({ open, onOpenChange }: MobileDrawerMenuProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { currentUser, canAccessRoute } = useAuth();
  const { empresa } = useEmpresaConfig();

  const handleNavigate = (path: string) => {
    onOpenChange(false);
    navigate({ to: path as any });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[85vw] max-w-sm p-0 flex flex-col h-full bg-white dark:bg-card border-r shadow-2xl">
        {/* Topo do Menu com Identidade Focus */}
        <div className="p-4 border-b bg-gradient-to-b from-orange-50/70 to-white dark:from-orange-950/20 dark:to-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-orange-500/30 bg-white dark:bg-muted shrink-0">
              <AvatarImage src={empresa?.logoUrl} className="object-contain p-0.5" />
              <AvatarFallback className="text-xs font-black text-orange-600 bg-orange-500/10">
                {(empresa?.nomeFantasia || "FC").substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-foreground truncate">
                  {empresa?.nomeFantasia || "Focus Tecnologia"}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground block truncate">
                Módulos do Sistema
              </span>
            </div>
          </div>
        </div>

        {/* Lista de Módulos Categorizada com Scroll Suave */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {MODULE_SECTIONS.map((section) => {
            const accessibleItems = section.items.filter((item) => canAccessRoute(item.path));
            if (accessibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1.5">
                <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground px-2">
                  {section.title}
                </h3>
                <div className="space-y-0.5">
                  {accessibleItems.map((item) => {
                    const isActive = pathname === item.path;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.path}
                        onClick={() => handleNavigate(item.path)}
                        className={cn(
                          "flex items-center justify-between w-full px-2.5 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.98]",
                          isActive
                            ? "bg-orange-500 text-white font-bold shadow-sm shadow-orange-500/20"
                            : "text-foreground hover:bg-muted/60"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "flex items-center justify-center w-7 h-7 rounded-lg shrink-0",
                            isActive ? "bg-white/20 text-white" : `${item.bg} ${item.color}`
                          )}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="truncate">{item.name}</span>
                        </div>
                        <ChevronRight className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-muted-foreground/50")} />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé com Informação do Usuário */}
        <div className="p-3 border-t bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={currentUser?.foto} />
              <AvatarFallback className="text-[10px] font-bold bg-orange-500/10 text-orange-600">
                {(currentUser?.nome || "AD").substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{currentUser?.nome || "Usuário"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{currentUser?.perfil || "Acesso Ativo"}</p>
            </div>
          </div>

          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.localStorage.removeItem("focus_auth_session_v2");
                window.location.reload();
              }
            }}
            className="p-2 text-muted-foreground hover:text-rose-600 transition-colors"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
