import React, { useState } from "react";
import focusLogo from "@/assets/focus-logo.png";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  TrendingDown,
  Bell,
  Users,
  Truck,
  FileText,
  Briefcase,
  Building2,
  Tags,
  BarChart3,
  PieChart,
  LineChart,
  Landmark,
  CalendarDays,
  FolderOpen,
  Receipt,
  PenLine,
  UserCog,
  Shield,
  Settings,
  Plug,
  ShoppingBag,
  Target,
  Megaphone,
  Edit3,
  Heart,
  Package,
  Boxes,
  Code2,
  Headphones,
  ScrollText,
  Sparkles,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useLocalStorageState } from "@/hooks/useDataStore";

export interface ActiveUserProfile {
  id: string;
  nome: string;
  cargo: string;
  email: string;
  avatarUrl?: string;
}

export const DEFAULT_ACTIVE_USER: ActiveUserProfile = {
  id: 'active_user_1',
  nome: "Administrador",
  cargo: "Usuário Principal",
  email: "admin@focustecnologia.com.br",
  avatarUrl: ""
};

const groups = [
  {
    label: "Visão Geral",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { title: "Fluxo de Caixa", url: "/fluxo-de-caixa", icon: Wallet },
      { title: "Contas a Receber", url: "/contas-a-receber", icon: TrendingUp },
      { title: "Contas a Pagar", url: "/contas-a-pagar", icon: TrendingDown },
      { title: "Cobranças", url: "/cobrancas", icon: Bell },
      { title: "Conciliação", url: "/conciliacao", icon: Landmark },
      { title: "Agenda Financeira", url: "/agenda", icon: CalendarDays },
    ],
  },
  {
    label: "Cadastros",
    items: [
      { title: "Clientes", url: "/clientes", icon: Users },
      { title: "Fornecedores", url: "/fornecedores", icon: Truck },
      { title: "Estoque & Patrimônio", url: "/estoque", icon: Package },
      { title: "Centro de Custos", url: "/centro-de-custos", icon: Building2 },
      { title: "Categorias", url: "/categorias", icon: Tags },
    ],
  },
  {
    label: "Tecnologia",
    items: [
      { title: "Projetos", url: "/projetos", icon: Briefcase },
      { title: "Desenvolvimento", url: "/desenvolvimento", icon: Code2 },
      { title: "Suporte", url: "/suporte", icon: Headphones },
      { title: "Produtos Focus", url: "/produtos", icon: Boxes },
    ],
  },
  {
    label: "Pessoas e Cultura",
    items: [
      { title: "RH (Gestão)", url: "/rh", icon: Users },
    ],
  },
  {
    label: "Vendas e Operações",
    items: [
      { title: "Comercial Ops", url: "/comercial", icon: ShoppingBag },
      { title: "CRM Pipeline", url: "/crm", icon: Target },
      { title: "Customer Success (CS)", url: "/customer-success", icon: Heart },
      { title: "Marketing Ops", url: "/marketing", icon: Megaphone },
    ],
  },
  {
    label: "Análises",
    items: [
      { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
      { title: "DRE", url: "/dre", icon: PieChart },
      { title: "Indicadores", url: "/indicadores", icon: LineChart },
      { title: "IA Financeira", url: "/ia-financeira", icon: Sparkles },
    ],
  },
  {
    label: "Documentação",
    items: [
      { title: "Contratos", url: "/contratos", icon: FileText },
      { title: "Fiscal", url: "/fiscal", icon: Receipt },
      { title: "Documentos", url: "/documentos", icon: FolderOpen },
      { title: "Assinaturas", url: "/assinaturas", icon: PenLine },
    ],
  },
  {
    label: "Administração",
    items: [
      { title: "Usuários", url: "/usuarios", icon: UserCog },
      { title: "Permissões", url: "/permissoes", icon: Shield },
      { title: "Integrações", url: "/integracoes", icon: Plug },
      { title: "Configurações", url: "/configuracoes", icon: Settings },
      { title: "Logs", url: "/logs", icon: ScrollText },
    ],
  },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) => pathname === url;

  const { data: activeUsers } = useLocalStorageState<ActiveUserProfile>('focus_active_user', [DEFAULT_ACTIVE_USER]);
  const activeUser = activeUsers[0] || DEFAULT_ACTIVE_USER;

  const getInitials = (name: string) => {
    return (name || 'AL').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border bg-white dark:bg-sidebar px-5 py-4 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3">
          <Link to="/" className="flex items-center w-full">
            <img
              src={focusLogo}
              alt="Focus ERP — powered by focus tech"
              className="h-12 w-auto max-w-[210px] object-contain object-left transition-all duration-200 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:object-cover group-data-[collapsible=icon]:object-left"
            />
          </Link>
        </SidebarHeader>
        <SidebarContent>
          {groups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.url)}
                        tooltip={item.title}
                        className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground data-[active=true]:font-medium"
                      >
                        <Link to={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        {/* PERFIL DO USUÁRIO INTEGRADO */}
        <SidebarFooter className="border-t border-sidebar-border p-2">
          <div 
            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/60 dark:hover:bg-sidebar-accent transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar className="h-8 w-8 border border-primary/20 shrink-0 overflow-hidden">
                <AvatarImage src={activeUser.avatarUrl} className="object-cover" />
                <AvatarFallback className="text-xs font-bold bg-orange-500/10 text-orange-600">
                  {getInitials(activeUser.nome)}
                </AvatarFallback>
              </Avatar>

              <div className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-xs font-bold text-foreground">{activeUser.nome}</span>
                <span className="truncate text-[10px] text-muted-foreground">{activeUser.cargo || activeUser.email}</span>
              </div>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
