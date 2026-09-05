import React from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { 
  Home, Zap, Plus, Bell, LayoutGrid
} from "lucide-react";
import { useNotificacoesStore } from "@/features/notificacoes/useNotificacoesStore";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  onOpenQuickCreate?: () => void;
  onOpenQuickAction?: () => void;
  onOpenShortcuts?: () => void;
  onOpenDrawer?: () => void;
  onOpenMenu?: () => void;
}

export function MobileBottomNav({
  onOpenQuickCreate,
  onOpenQuickAction,
  onOpenShortcuts,
  onOpenDrawer,
  onOpenMenu,
}: MobileBottomNavProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { naoLidasCount } = useNotificacoesStore();

  const handleCreate = onOpenQuickAction || onOpenQuickCreate;
  const handleDrawer = onOpenMenu || onOpenDrawer;

  const isHome = pathname === "/";
  const isNotifications = pathname === "/notificacoes";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-zinc-800 shadow-[0_-2px_12px_rgba(0,0,0,0.04)] pb-[env(safe-area-inset-bottom,0px)]">
      <div className="grid grid-cols-5 h-15 max-w-md mx-auto items-center px-1">
        {/* 1. INÍCIO */}
        <button
          onClick={() => navigate({ to: "/" })}
          className={cn(
            "flex flex-col items-center justify-center gap-1 h-full transition-colors active:scale-95 cursor-pointer",
            isHome ? "text-[#FF5000] font-bold" : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          <Home className={cn("h-5 w-5", isHome && "stroke-[2.5px]")} />
          <span className="text-[10px] tracking-tight">Início</span>
        </button>

        {/* 2. ATALHOS / AÇÕES */}
        <button
          onClick={onOpenShortcuts || handleCreate}
          className="flex flex-col items-center justify-center gap-1 h-full text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors active:scale-95 cursor-pointer"
        >
          <Zap className="h-5 w-5" />
          <span className="text-[10px] tracking-tight">Atalhos</span>
        </button>

        {/* 3. BOTÃO CENTRAL DESTACADO: CRIAR (+) */}
        <div className="flex items-center justify-center h-full -mt-4">
          <button
            onClick={handleCreate}
            className="flex items-center justify-center h-13 w-13 rounded-full bg-gradient-to-tr from-[#FF3D00] to-[#FF6A00] text-white shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-90 transition-all border-4 border-white dark:border-zinc-900 focus:outline-none cursor-pointer"
            aria-label="Criar Novo Registro"
          >
            <Plus className="h-6 w-6 stroke-[3px]" />
          </button>
        </div>

        {/* 4. AVISOS / NOTIFICAÇÕES */}
        <button
          onClick={() => navigate({ to: "/notificacoes" })}
          className={cn(
            "flex flex-col items-center justify-center gap-1 h-full transition-colors relative active:scale-95 cursor-pointer",
            isNotifications ? "text-[#FF5000] font-bold" : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          <div className="relative">
            <Bell className={cn("h-5 w-5", isNotifications && "stroke-[2.5px]")} />
            {naoLidasCount > 0 && (
              <span className="absolute -top-1 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#FF5000] px-1 text-[9px] font-bold text-white shadow-xs">
                {naoLidasCount > 9 ? "9+" : naoLidasCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Avisos</span>
        </button>

        {/* 5. MENU DE MÓDULOS */}
        <button
          onClick={handleDrawer}
          className="flex flex-col items-center justify-center gap-1 h-full text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors active:scale-95 cursor-pointer"
        >
          <LayoutGrid className="h-4.5 w-4.5" />
          <span className="text-[10px] tracking-tight">Módulos</span>
        </button>
      </div>
    </nav>
  );
}
