import React from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { 
  Home, Wallet, Plus, CalendarDays, LineChart
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
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
}: MobileBottomNavProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  const handleCreate = onOpenQuickAction || onOpenQuickCreate;

  const isHome = pathname === "/";
  const isFluxo = pathname === "/fluxo-de-caixa";
  const isAgenda = pathname === "/agenda" || pathname.startsWith("/agenda-de-entregas");
  const isIndicadores = pathname === "/indicadores";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-zinc-800 shadow-[0_-2px_12px_rgba(0,0,0,0.04)] pb-[env(safe-area-inset-bottom,0px)]">
      <div className="grid grid-cols-5 h-15 max-w-md mx-auto items-center px-1">
        {/* 1. INÍCIO */}
        <button
          onClick={() => navigate({ to: "/" })}
          className={cn(
            "flex flex-col items-center justify-center gap-1 h-full transition-colors active:scale-95 cursor-pointer px-0.5",
            isHome ? "text-[#FF5000] font-bold" : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          <Home className={cn("h-5 w-5", isHome && "stroke-[2.5px]")} />
          <span className="text-[10px] tracking-tight">Início</span>
        </button>

        {/* 2. FLUXO DE CAIXA */}
        <button
          onClick={() => navigate({ to: "/fluxo-de-caixa" })}
          className={cn(
            "flex flex-col items-center justify-center gap-1 h-full transition-colors active:scale-95 cursor-pointer px-0.5",
            isFluxo ? "text-[#FF5000] font-bold" : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          <Wallet className={cn("h-5 w-5", isFluxo && "stroke-[2.5px]")} />
          <span className="text-[10px] tracking-tight truncate max-w-full">Fluxo de Caixa</span>
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

        {/* 4. AGENDA */}
        <button
          onClick={() => navigate({ to: "/agenda" })}
          className={cn(
            "flex flex-col items-center justify-center gap-1 h-full transition-colors active:scale-95 cursor-pointer px-0.5",
            isAgenda ? "text-[#FF5000] font-bold" : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          <CalendarDays className={cn("h-5 w-5", isAgenda && "stroke-[2.5px]")} />
          <span className="text-[10px] tracking-tight">Agenda</span>
        </button>

        {/* 5. INDICADORES */}
        <button
          onClick={() => navigate({ to: "/indicadores" })}
          className={cn(
            "flex flex-col items-center justify-center gap-1 h-full transition-colors active:scale-95 cursor-pointer px-0.5",
            isIndicadores ? "text-[#FF5000] font-bold" : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          <LineChart className={cn("h-5 w-5", isIndicadores && "stroke-[2.5px]")} />
          <span className="text-[10px] tracking-tight">Indicadores</span>
        </button>
      </div>
    </nav>
  );
}
