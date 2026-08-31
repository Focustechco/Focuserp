import React from "react";
import focusSymbolTransparent from "@/assets/focus-symbol-transparent.png";
import { cn } from "@/lib/utils";

interface FocusLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showSubtitle?: boolean;
  collapsed?: boolean;
}

export function FocusLogo({
  className,
  size = "md",
  showSubtitle = true,
  collapsed = false,
}: FocusLogoProps) {
  if (collapsed) {
    return (
      <div className={cn("flex items-center justify-center shrink-0", className)}>
        <img
          src={focusSymbolTransparent}
          alt="Focus Symbol"
          className="w-7 h-7 max-w-[28px] max-h-[28px] object-contain shrink-0"
        />
      </div>
    );
  }

  const sizeStyles = {
    sm: {
      icon: "w-6 h-6",
      title: "text-base tracking-tight",
      subtitle: "text-[9px] tracking-wider",
    },
    md: {
      icon: "w-8 h-8",
      title: "text-[1.35rem] tracking-tight",
      subtitle: "text-[10px] tracking-wider",
    },
    lg: {
      icon: "w-9 h-9",
      title: "text-2xl tracking-tight",
      subtitle: "text-xs tracking-wider",
    },
    xl: {
      icon: "w-11 h-11",
      title: "text-3xl tracking-tight",
      subtitle: "text-sm tracking-wider",
    },
  }[size];

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 select-none transition-all duration-200",
        className
      )}
    >
      {/* Símbolo Focus em Alta Definição */}
      <img
        src={focusSymbolTransparent}
        alt="Focus Logo"
        className={cn(sizeStyles.icon, "object-contain shrink-0 drop-shadow-xs")}
      />

      {/* Tipografia Vetorial Nítida em Alta Resolução */}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={cn(
              "font-extrabold text-foreground tracking-tight leading-none",
              sizeStyles.title
            )}
          >
            Focus
          </span>
          <span
            className={cn(
              "font-black text-[#f97316] tracking-tight leading-none",
              sizeStyles.title
            )}
          >
            ERP
          </span>
        </div>

        {showSubtitle && (
          <span
            className={cn(
              "text-muted-foreground font-medium uppercase opacity-75 mt-1 leading-none",
              sizeStyles.subtitle
            )}
          >
            powered by focus tech®
          </span>
        )}
      </div>
    </div>
  );
}
