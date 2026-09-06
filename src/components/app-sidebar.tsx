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
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  Tags,
  CalendarDays,
  Truck,
  Package,
  Boxes,
  Briefcase,
  FileText,
  Plug,
  UserCog,
  Shield,
  Settings,
  Bell,
  Landmark,
  PieChart,
  BarChart3,
  LineChart,
  FolderOpen,
  ShoppingBag,
  Target,
  Heart,
  Megaphone,
  Code2,
  Headphones,
  KeyRound,
  LogOut,
  ChevronUp,
  Receipt,
} from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import focusLogoHorizontal from "@/assets/focus-logo-horizontal.png";
import focusLogoHorizontalDark from "@/assets/focus-logo-horizontal-dark.png";
import focusSymbolTransparent from "@/assets/focus-symbol-transparent.png";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UserProfileModal } from "./UserProfileModal";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/AuthContext";
import { Badge } from "./ui/badge";

const groups = [
  {
    label: "Módulo Principal",
    items: [
      { title: "Dashboard Executivo", url: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "Comercial & Vendas",
    items: [
      { title: "Clientes", url: "/clientes", icon: Users },
      { title: "CRM Focus", url: "/crm", icon: Target },
      { title: "Contratos & Recorrência", url: "/contratos", icon: FileText },
      { title: "Comercial OS", url: "/comercial", icon: ShoppingBag },
      { title: "Marketing & Growth", url: "/marketing", icon: Megaphone },
    ],
  },
  {
    label: "Financeiro & Tesouraria",
    items: [
      { title: "Contas a Receber", url: "/contas-a-receber", icon: TrendingUp },
      { title: "Contas a Pagar", url: "/contas-a-pagar", icon: TrendingDown },
      { title: "Fluxo de Caixa", url: "/fluxo-de-caixa", icon: Wallet },
      { title: "Cobranças", url: "/cobrancas", icon: Bell },
      { title: "Conciliação Bancária", url: "/conciliacao", icon: Landmark },
      { title: "Agenda Financeira", url: "/agenda", icon: CalendarDays },
      { title: "DRE Gerencial", url: "/dre", icon: PieChart },
      { title: "Fiscal & NFe/NFSe", url: "/fiscal", icon: Receipt },
    ],
  },
  {
    label: "Operação & Projetos",
    items: [
      { title: "Projetos & Sprints", url: "/projetos", icon: Briefcase },
      { title: "Produtos Focus", url: "/produtos", icon: Boxes },
      { title: "Desenvolvimento", url: "/desenvolvimento", icon: Code2 },
      { title: "Agenda de Entregas", url: "/agenda-de-entregas", icon: CalendarDays },
      { title: "Estoque & Patrimônio", url: "/estoque", icon: Package },
      { title: "Fornecedores", url: "/fornecedores", icon: Truck },
      { title: "Suporte ( central)", url: "/suporte", icon: Headphones },
    ],
  },
  {
    label: "Pessoas & Documentos",
    items: [
      { title: "Recursos Humanos (RH)", url: "/rh", icon: Users },
      { title: "Central de Documentos", url: "/documentos", icon: FolderOpen },
      { title: "Assinaturas Digitais", url: "/assinaturas", icon: FileText },
      { title: "Customer Success", url: "/customer-success", icon: Heart },
    ],
  },
  {
    label: "Administração & Estratégia",
    items: [
      { title: "Central de Relatórios", url: "/relatorios", icon: BarChart3 },
      { title: "Indicadores & KPIs", url: "/indicadores", icon: LineChart },
      { title: "Centro de Custos", url: "/centro-de-custos", icon: Building2 },
      { title: "Categorias", url: "/categorias", icon: Tags },
      { title: "Usuários", url: "/usuarios", icon: UserCog },
      { title: "Permissões", url: "/permissoes", icon: Shield },
      { title: "Integrações (API Hub)", url: "/integracoes", icon: Plug },
      { title: "Configurações", url: "/configuracoes", icon: Settings },
    ],
  },
];

function SidebarLogoHeader() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarHeader className="border-b border-sidebar-border bg-transparent h-[84px] flex items-center justify-center px-4 py-3 transition-all duration-250 ease-in-out group-data-[collapsible=icon]:h-[3.75rem] group-data-[collapsible=icon]:min-h-[3.75rem] group-data-[collapsible=icon]:pt-[env(safe-area-inset-top,0px)] group-data-[collapsible=icon]:py-1.5 group-data-[collapsible=icon]:px-0">
      <Link 
        to="/" 
        onClick={() => { if (isMobile) setOpenMobile(false); }}
        className="flex items-center justify-center w-full h-full"
      >
        {/* Logo Horizontal Completa - Sidebar Expandida */}
        <div
          className={cn(
            "flex items-center justify-center w-full h-full transition-all duration-250 ease-in-out group-data-[collapsible=icon]:hidden",
            isCollapsed ? "opacity-0 scale-95 hidden" : "opacity-100 scale-100 flex"
          )}
        >
          {/* Light Mode Logo */}
          <img
            src={focusLogoHorizontal}
            alt="Focus ERP — powered by focus tech®"
            className="w-[160px] max-w-[165px] h-auto object-contain transition-all duration-200 dark:hidden"
          />
          {/* Dark Mode Logo */}
          <img
            src={focusLogoHorizontalDark}
            alt="Focus ERP — powered by focus tech®"
            className="w-[160px] max-w-[165px] h-auto object-contain transition-all duration-200 hidden dark:block"
          />
        </div>

        {/* Símbolo Focus - Sidebar Recolhida */}
        <div
          className={cn(
            "items-center justify-center transition-all duration-250 ease-in-out shrink-0 hidden group-data-[collapsible=icon]:flex",
            isCollapsed ? "opacity-100 scale-100 flex" : "opacity-0 scale-95 hidden"
          )}
        >
          <img
            src={focusSymbolTransparent}
            alt="Focus ERP"
            className="w-6.5 h-6.5 max-w-[26px] max-h-[26px] object-contain shrink-0"
          />
        </div>
      </Link>
    </SidebarHeader>
  );
}

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) => pathname === url;

  const { isMobile, setOpenMobile } = useSidebar();
  const { currentUser, isSuperAdmin, usuarios, switchUser, canAccessRoute, logout } = useAuth();
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const getInitials = (name: string) => {
    return (name || 'AL').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Filtrar itens do menu de acordo com as permissões funcionais do usuário logado
  const filteredGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessRoute(item.url)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarLogoHeader />
        <SidebarContent>
          {filteredGroups.map((group) => (
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
                        <Link 
                          to={item.url}
                          onClick={() => { if (isMobile) setOpenMobile(false); }}
                        >
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

        {/* PERFIL DO USUÁRIO INTEGRADO COM CONTROLE DE SESSÃO */}
        <SidebarFooter className="border-t border-sidebar-border p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between p-2 rounded-lg hover:bg-muted/60 dark:hover:bg-sidebar-accent transition-colors text-left group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar className="h-8 w-8 border border-primary/20 shrink-0 overflow-hidden">
                    <AvatarImage src={currentUser?.foto} className="object-cover" />
                    <AvatarFallback className="text-xs font-bold bg-orange-500/10 text-orange-600">
                      {getInitials(currentUser?.nome || 'Admin')}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-xs font-bold text-foreground">{currentUser?.nome}</span>
                      {isSuperAdmin && (
                        <Badge variant="outline" className="text-[9px] py-0 px-1 text-primary border-primary/30">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <span className="truncate text-[10px] text-muted-foreground">{currentUser?.cargo || currentUser?.email}</span>
                  </div>
                </div>
                <ChevronUp className="w-3.5 h-3.5 text-muted-foreground group-data-[collapsible=icon]:hidden" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" side="top" className="w-64 mb-2">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none">{currentUser?.nome}</p>
                  <p className="text-xs leading-none text-muted-foreground">{currentUser?.email}</p>
                  <Badge variant="secondary" className="w-fit text-[10px] mt-1">
                    {currentUser?.perfil || 'Usuário'}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => setProfileModalOpen(true)}>
                <UserCog className="w-4 h-4 mr-2" /> Editar Meu Perfil
              </DropdownMenuItem>

              {/* Menu de Alternância de Usuário para Super Administrador */}
              {isSuperAdmin && usuarios && usuarios.length > 1 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">
                    Alternar Sessão de Usuário
                  </DropdownMenuLabel>
                  {usuarios.map((u) => (
                    <DropdownMenuItem
                      key={u.id}
                      onClick={() => switchUser(u.id)}
                      className={cn(
                        "text-xs flex items-center justify-between",
                        u.id === currentUser?.id && "font-bold text-primary bg-primary/5"
                      )}
                    >
                      <span className="truncate">{u.nome} ({u.perfil})</span>
                      {u.id === currentUser?.id && <span className="text-[10px]">● Ativo</span>}
                    </DropdownMenuItem>
                  ))}
                </>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={logout} className="text-rose-600 dark:text-rose-400">
                <LogOut className="w-4 h-4 mr-2" /> Desconectar / Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <UserProfileModal 
        open={profileModalOpen} 
        onOpenChange={setProfileModalOpen} 
      />
    </>
  );
}
