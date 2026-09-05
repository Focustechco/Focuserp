import React, { useState } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { 
  Menu, Bell, ArrowLeft, Search, User, ShieldCheck, Sun, Moon, LogOut, Building2, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, 
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/auth/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { useEmpresaConfig } from "@/features/configuracoes/hooks/useEmpresaConfig";
import { useNotificacoesStore } from "@/features/notificacoes/useNotificacoesStore";
import { UserProfileModal } from "@/components/UserProfileModal";
import { EmpresaProfileModal } from "@/components/EmpresaProfileModal";

// Mapeamento de rotas para títulos amigáveis no cabeçalho mobile
const ROUTE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/fluxo-de-caixa": "Fluxo de Caixa",
  "/contas-a-receber": "Contas a Receber",
  "/contas-a-pagar": "Contas a Pagar",
  "/cobrancas": "Cobranças",
  "/conciliacao": "Conciliação",
  "/agenda": "Agenda Financeira",
  "/clientes": "Clientes",
  "/fornecedores": "Fornecedores",
  "/estoque": "Estoque & Patrimônio",
  "/centro-de-custos": "Centro de Custos",
  "/categorias": "Categorias",
  "/projetos": "Projetos",
  "/agenda-de-entregas": "Agenda de Entregas",
  "/desenvolvimento": "Desenvolvimento",
  "/suporte": "Suporte",
  "/produtos": "Produtos",
  "/rh": "Recursos Humanos",
  "/documentos": "Documentos (DMS)",
  "/assinaturas": "Assinaturas Digitais",
  "/relatorios": "Relatórios",
  "/dre": "DRE Gerencial",
  "/indicadores": "Indicadores",
  "/comercial": "Comercial",
  "/crm": "CRM & Pipeline",
  "/customer-success": "Customer Success",
  "/marketing": "Marketing",
  "/usuarios": "Usuários",
  "/permissoes": "Permissões (IAM)",
  "/configuracoes": "Configurações",
  "/integracoes": "Integrações",
  "/fiscal": "Fiscal",
  "/notificacoes": "Notificações",
};

interface MobileHeaderProps {
  onOpenDrawer: () => void;
  onOpenSearch: () => void;
}

export function MobileHeader({ onOpenDrawer, onOpenSearch }: MobileHeaderProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { empresa } = useEmpresaConfig();
  const { naoLidasCount } = useNotificacoesStore();

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [empresaModalOpen, setEmpresaModalOpen] = useState(false);

  const isHome = pathname === "/";
  const currentTitle = ROUTE_TITLES[pathname] || "Focus ERP";

  const getInitials = (nameStr?: string) => {
    return (nameStr || "AD")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white dark:bg-card border-b border-border/80 shadow-xs pt-[env(safe-area-inset-top,0px)]">
        {/* Linha de Destaque Laranja Focus no Topo */}
        <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />

        <div className="flex h-14 items-center justify-between px-3 sm:px-4">
          {/* LADO ESQUERDO */}
          <div className="flex items-center gap-2 min-w-0">
            {isHome ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenDrawer}
                className="h-10 w-10 text-foreground hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded-xl shrink-0"
                aria-label="Abrir Menu de Módulos"
              >
                <Menu className="h-5 w-5 text-foreground" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate({ to: "/" })}
                className="h-10 w-10 text-foreground hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded-xl shrink-0"
                aria-label="Voltar ao Início"
              >
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </Button>
            )}

            {/* IDENTIFICAÇÃO / TÍTULO DA ROTA */}
            <div className="flex items-center gap-2 min-w-0">
              {isHome ? (
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center font-black text-base tracking-tight text-foreground">
                    <span>Focus</span>
                    <span className="text-orange-500 ml-1">ERP</span>
                  </div>
                  <span className="flex h-2 w-2 rounded-full bg-orange-500" />
                </div>
              ) : (
                <h1 className="text-base font-extrabold text-foreground truncate max-w-[190px] sm:max-w-xs">
                  {currentTitle}
                </h1>
              )}
            </div>
          </div>

          {/* LADO DIREITO (AÇÕES: BUSCA, NOTIFICAÇÕES, PERFIL) */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Botão de Busca Rápida */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenSearch}
              className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-xl"
              aria-label="Buscar"
            >
              <Search className="h-4.5 w-4.5" />
            </Button>

            {/* Botão de Notificações com Badge */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ to: "/notificacoes" })}
              className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-xl relative"
              aria-label="Notificações"
            >
              <Bell className="h-4.5 w-4.5" />
              {naoLidasCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-black text-white shadow-xs">
                  {naoLidasCount > 9 ? "9+" : naoLidasCount}
                </span>
              )}
            </Button>

            {/* Avatar / Perfil do Usuário */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="ml-1 h-8 w-8 rounded-full ring-2 ring-orange-500/30 hover:ring-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all overflow-hidden flex items-center justify-center bg-orange-500/10"
                  aria-label="Menu do Usuário"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUser?.foto || currentUser?.avatarUrl} className="object-cover" />
                    <AvatarFallback className="text-[11px] font-black bg-orange-500/10 text-orange-600 dark:text-orange-400">
                      {getInitials(currentUser?.nome)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-64 p-1.5 shadow-xl border rounded-2xl animate-in fade-in-50 zoom-in-95 bg-white dark:bg-card">
                <div className="p-3 bg-muted/40 rounded-xl mb-1 flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-border shrink-0">
                    <AvatarImage src={currentUser?.foto || currentUser?.avatarUrl} className="object-cover" />
                    <AvatarFallback className="text-xs font-bold bg-orange-500/10 text-orange-600">
                      {getInitials(currentUser?.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-xs text-foreground truncate block">
                      {currentUser?.nome || "Adriano Leal"}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate block">
                      {currentUser?.email || "contato@focustecnologia.com.br"}
                    </span>
                    <Badge variant="outline" className="mt-1 text-[9px] py-0 px-1.5 border-orange-500/30 text-orange-600 font-semibold">
                      {currentUser?.perfil || "Administrador"}
                    </Badge>
                  </div>
                </div>

                <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-1">
                  Minha Conta
                </DropdownMenuLabel>

                <DropdownMenuItem 
                  onClick={() => setProfileModalOpen(true)}
                  className="cursor-pointer gap-2.5 py-2 text-xs rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950/30"
                >
                  <User className="w-4 h-4 text-orange-500" />
                  <span>Perfil & Segurança</span>
                </DropdownMenuItem>

                <DropdownMenuItem 
                  onClick={() => setEmpresaModalOpen(true)}
                  className="cursor-pointer gap-2.5 py-2 text-xs rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950/30"
                >
                  <Building2 className="w-4 h-4 text-orange-500" />
                  <span>Dados da Empresa</span>
                </DropdownMenuItem>

                <DropdownMenuItem 
                  onClick={() => navigate({ to: "/configuracoes" })}
                  className="cursor-pointer gap-2.5 py-2 text-xs rounded-xl"
                >
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <span>Configurações</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1" />

                <DropdownMenuItem 
                  onClick={toggleTheme} 
                  className="cursor-pointer gap-2.5 py-2 text-xs rounded-xl"
                >
                  {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-700" />}
                  <span>{isDark ? "Modo Claro" : "Modo Escuro"}</span>
                </DropdownMenuItem>

                <DropdownMenuItem 
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.localStorage.removeItem("focus_auth_session_v2");
                      window.location.reload();
                    }
                  }}
                  className="cursor-pointer gap-2.5 py-2 text-xs text-rose-600 dark:text-rose-400 focus:text-rose-600 rounded-xl"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair da Plataforma</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Modais de Perfil */}
      <UserProfileModal open={profileModalOpen} onOpenChange={setProfileModalOpen} />
      <EmpresaProfileModal open={empresaModalOpen} onOpenChange={setEmpresaModalOpen} />
    </>
  );
}
