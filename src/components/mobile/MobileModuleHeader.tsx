import React from "react";
import { Search, Filter, Plus, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MobileModuleHeaderProps {
  title: string;
  subtitle?: string;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  onNewClick?: () => void;
  newButtonLabel?: string;
  onFilterClick?: () => void;
  activeFilterCount?: number;
}

export function MobileModuleHeader({
  title,
  subtitle,
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Buscar registros...",
  onNewClick,
  newButtonLabel = "Novo",
  onFilterClick,
  activeFilterCount = 0,
}: MobileModuleHeaderProps) {
  return (
    <div className="space-y-3 pb-3 border-b border-border/70">
      {/* TÍTULO E AÇÃO PRINCIPAL */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-black text-foreground tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground font-medium mt-0.5">{subtitle}</p>
          )}
        </div>

        {onNewClick && (
          <Button
            size="sm"
            onClick={onNewClick}
            className="gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs h-9 px-3 rounded-xl shadow-xs shrink-0 active:scale-95"
          >
            <Plus className="h-4 w-4 stroke-[2.5px]" />
            <span>{newButtonLabel}</span>
          </Button>
        )}
      </div>

      {/* BARRA DE PESQUISA & FILTRO */}
      {onSearchChange && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9 h-10 text-xs bg-white dark:bg-card border-border/80 rounded-xl focus-visible:ring-orange-500/40"
            />
          </div>

          {onFilterClick && (
            <Button
              variant="outline"
              size="icon"
              onClick={onFilterClick}
              className="h-10 w-10 border-border/80 bg-white dark:bg-card rounded-xl shrink-0 relative"
              aria-label="Filtros"
            >
              <SlidersHorizontal className="h-4 w-4 text-foreground" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-black text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
