import React from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { 
  Home, Zap, Plus, Bell, Grid, Layers
} from "lucide-react";
import { useNotificacoesStore } from "@/features/notificacoes/useNotificacoesStore";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  onOpenQuickCreate: () => void;
  onOpenShortcuts: () => void;
  onOpenDrawer: () => void;
}

export function MobileBottomNav({
  onOpenQuickCreate,
  onOpenShortcuts,
  onOpenDrawer,
}: MobileBottomNavProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { naoLidasCount } = useNotificacoesStore();

  const isHome = pathname === "/";
  const isNotifications = pathname === "/notificacoes";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-card/95 backdrop-blur-lg border-t border-border/80 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom,0px)]">
      <div className="grid grid-cols-5 h-16 max-w-md mx-auto items-center px-2">
        {/* 1. INÍCIO */}
        <button
          onClick={() => navigate({ to: "/" })}
          className={cn(
            "flex flex-col items-center justify-center gap-1 h-full transition-colors active:scale-95",
            isHome ? "text-orange-500 font-bold" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Home className={cn("h-5 w-5", isHome && "stroke-[2.5px]")} />
          <span className="text-[10px] tracking-tight">Início</span>
        </button>

        {/* 2. ATALHOS / AÇÕES RÁPIDAS */}
        <button
          onClick={onOpenShortcuts}
          className="flex flex-col items-center justify-center gap-1 h-full text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        >
          <Zap className="h-5 w-5" />
          <span className="text-[10px] tracking-tight">Atalhos</span>
        </button>

        {/* 3. BOTÃO CENTRAL DESTACADO: CRIAR (+) */}
        <div className="flex items-center justify-center h-full -mt-4">
          <button
            onClick={onOpenQuickCreate}
            className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-90 transition-all border-4 border-white dark:border-card focus:outline-none"
            aria-label="Criar Novo Registro"
          >
            <Plus className="h-6 w-6 stroke-[3px]" />
          </button>
        </div>

        {/* 4. AVISOS / NOTIFICAÇÕES */}
        <button
          onClick={() => navigate({ to: "/notificacoes" })}
          className={cn(
            "flex flex-col items-center justify-center gap-1 h-full transition-colors relative active:scale-95",
            isNotifications ? "text-orange-500 font-bold" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div className="relative">
            <Bell className={cn("h-5 w-5", isNotifications && "stroke-[2.5px]")} />
            {naoLidasCount > 0 && (
              <span className="absolute -top-1 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-black text-white shadow-xs">
                {naoLidasCount > 9 ? "9+" : naoLidasCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Avisos</span>
        </button>

        {/* 5. MENU DE MÓDULOS */}
        <button
          onClick={onOpenDrawer}
          className="flex flex-col items-center justify-center gap-1 h-full text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        >
          <Grid className="h-5 w-5" />
          <span className="text-[10px] tracking-tight">Módulos</span>
        </button>
      </div>
    </nav>
  );
}
