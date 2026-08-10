import React, { useState, useEffect } from "react";
import { 
  Search, Bell, Command, Moon, Sun, ArrowRight, LayoutDashboard, Wallet, 
  Users, FileText, Briefcase, BarChart3, FolderOpen, Plug, Plus, ChevronDown, 
  TrendingUp, TrendingDown, Receipt, Target 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, 
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/useTheme";
import { useNavigate } from "@tanstack/react-router";
import { useLocalStorageState } from "@/hooks/useDataStore";
import { Cliente } from "@/features/clientes/types";
import { Contrato } from "@/features/contratos/types";
import { NotificationBellDropdown } from "@/features/notificacoes/components/NotificationBellDropdown";

// Importao dos Formulrios Oficiais dos Mdulos
import { NovoRecebimentoSheet } from "@/features/contas-receber/components/NovoRecebimentoSheet";
import { NovaContaSheet } from "@/features/contas-pagar/components/NovaContaSheet";
import { NovoClienteSheet } from "@/features/clientes/components/NovoClienteSheet";
import { NovoContratoSheet } from "@/features/contratos/components/NovoContratoSheet";

interface QuickLink {
  title: string;
  category: string;
  url: string;
  icon: any;
}

export function TopBar() {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [openSearchModal, setOpenSearchModal] = useState(false);
  const [query, setQuery] = useState("");

  const { data: clientes } = useLocalStorageState<Cliente>("focus_clientes");
  const { data: contratos } = useLocalStorageState<Contrato>("focus_contratos");

  // Escutar atalho de teclado Ctrl+K ou Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpenSearchModal(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const systemPages: QuickLink[] = [
    { title: "Dashboard Executivo", category: "Mdulo", url: "/", icon: LayoutDashboard },
    { title: "Fluxo de Caixa", category: "Mdulo", url: "/fluxo-de-caixa", icon: Wallet },
    { title: "Contas a Receber", category: "Mdulo", url: "/contas-a-receber", icon: Wallet },
    { title: "Contas a Pagar", category: "Mdulo", url: "/contas-a-pagar", icon: Wallet },
    { title: "Clientes", category: "Mdulo", url: "/clientes", icon: Users },
    { title: "Contratos", category: "Mdulo", url: "/contratos", icon: FileText },
    { title: "Projetos", category: "Mdulo", url: "/projetos", icon: Briefcase },
    { title: "Central de Relatrios", category: "Mdulo", url: "/relatorios", icon: BarChart3 },
    { title: "Central de Documentos (DMS)", category: "Mdulo", url: "/documentos", icon: FolderOpen },
    { title: "Hub de Integraes", category: "Mdulo", url: "/integracoes", icon: Plug },
  ];

  // Resultados dinâmicos da pesquisa seguros
  const safeQuery = (query || "").toLowerCase();
  const filteredPages = systemPages.filter(p => (p.title || "").toLowerCase().includes(safeQuery));
  const filteredClientes = (clientes || []).filter(c => 
    (c?.razaoSocial || "").toLowerCase().includes(safeQuery) || 
    (c?.nomeFantasia || "").toLowerCase().includes(safeQuery) ||
    (c?.codigo || "").toLowerCase().includes(safeQuery) ||
    (c?.documento || "").includes(safeQuery)
  );
  const filteredContratos = (contratos || []).filter(c => 
    (c?.numeroContrato || c?.codigo || c?.nome || "").toLowerCase().includes(safeQuery) || 
    (c?.nome || "").toLowerCase().includes(safeQuery)
  );

  const handleNavigate = (url: string) => {
    navigate({ to: url });
    setOpenSearchModal(false);
    setQuery("");
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-5" />
        
        {/* BUSCADOR GLOBAL INTERATIVO */}
        <div 
          onClick={() => setOpenSearchModal(true)}
          className="relative hidden md:block cursor-pointer group"
        >
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors" />
          <Input
            readOnly
            placeholder="Buscar em toda a plataforma (Ctrl+K)..."
            className="h-9 w-[320px] pl-8 pr-16 lg:w-[420px] cursor-pointer bg-muted/40 hover:bg-muted/80 transition-colors text-xs"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:flex shadow-xs">
            <Command className="h-3 w-3" />K
          </kbd>
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          <NotificationBellDropdown />

          {/* BOTO NOVA TRANSAO */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="inline-flex items-center gap-1.5 h-8 px-2 sm:px-3 text-xs font-semibold border-orange-500/30 text-orange-600 dark:text-orange-400 bg-orange-50/50 hover:bg-orange-100/80 dark:bg-orange-950/30 dark:hover:bg-orange-900/50 transition-all rounded-lg shadow-xs"
              >
                <Plus className="h-3.5 w-3.5 text-orange-500" />
                <span className="hidden sm:inline">Nova Transao</span>
                <ChevronDown className="hidden sm:inline h-3 w-3 opacity-60 ml-0.5" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-72 p-1.5 space-y-1">
              <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1">
                Criar Nova Transao / Lanamento
              </DropdownMenuLabel>
              
              <NovoRecebimentoSheet>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer gap-2.5 py-2 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-foreground">Novo Recebimento (Entrada)</div>
                    <div className="text-[10px] text-muted-foreground">Lana no Contas a Receber e Fluxo de Caixa</div>
                  </div>
                </DropdownMenuItem>
              </NovoRecebimentoSheet>

              <NovaContaSheet>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer gap-2.5 py-2 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-foreground">Novo Pagamento (Sada)</div>
                    <div className="text-[10px] text-muted-foreground">Lana no Contas a Pagar e Fluxo de Caixa</div>
                  </div>
                </DropdownMenuItem>
              </NovaContaSheet>

              <DropdownMenuSeparator />

              <NovoClienteSheet>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer gap-2.5 py-2 rounded-md">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-foreground">Novo Cliente</div>
                    <div className="text-[10px] text-muted-foreground">Cadastra cliente no diretrio da empresa</div>
                  </div>
                </DropdownMenuItem>
              </NovoClienteSheet>

              <NovoContratoSheet>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer gap-2.5 py-2 rounded-md">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-foreground">Novo Contrato</div>
                    <div className="text-[10px] text-muted-foreground">Registra novo contrato de vendas/servios</div>
                  </div>
                </DropdownMenuItem>
              </NovoContratoSheet>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => navigate({ to: "/fiscal" })} className="cursor-pointer gap-2.5 py-2 rounded-md">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-foreground">Emisso de Nota Fiscal (NFe/NFSe)</div>
                  <div className="text-[10px] text-muted-foreground">Emitir documento fiscal eletrnico</div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => navigate({ to: "/crm" })} className="cursor-pointer gap-2.5 py-2 rounded-md">
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-foreground">Nova Oportunidade (CRM)</div>
                  <div className="text-[10px] text-muted-foreground">Adicionar negcio no pipeline do ClickUp</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* MODAL DE BUSCA GLOBAL (COMMAND PALETTE) */}
      <Dialog open={openSearchModal} onOpenChange={setOpenSearchModal}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden gap-0 border shadow-2xl">
          <DialogHeader className="p-3 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground ml-1" />
              <Input
                autoFocus
                placeholder="Digite o que deseja buscar (ex: Clientes, Contratos, Relatrios)..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="border-none shadow-none focus-visible:ring-0 text-sm bg-transparent h-9"
              />
            </div>
          </DialogHeader>

          <div className="p-3 max-h-[380px] overflow-y-auto space-y-4 text-xs">
            {/* Seo Mdulos da Plataforma */}
            {filteredPages.length > 0 && (
              <div>
                <p className="font-semibold text-muted-foreground mb-2 text-[10px] uppercase tracking-wider">Mdulos da Plataforma</p>
                <div className="space-y-1">
                  {filteredPages.map(page => {
                    const IconComponent = page.icon;
                    return (
                      <div
                        key={page.url}
                        onClick={() => handleNavigate(page.url)}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 font-medium">
                          <IconComponent className="w-4 h-4 text-primary" />
                          <span>{page.title}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Seo Clientes Cadastrados */}
            {filteredClientes.length > 0 && (
              <div>
                <p className="font-semibold text-muted-foreground mb-2 text-[10px] uppercase tracking-wider">Clientes Cadastrados</p>
                <div className="space-y-1">
                  {filteredClientes.map(cliente => (
                    <div
                      key={cliente.id}
                      onClick={() => handleNavigate('/clientes')}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-foreground">{cliente.razaoSocial || cliente.nomeFantasia}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{cliente.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Seo Contratos */}
            {filteredContratos.length > 0 && (
              <div>
                <p className="font-semibold text-muted-foreground mb-2 text-[10px] uppercase tracking-wider">Contratos</p>
                <div className="space-y-1">
                  {filteredContratos.map(contrato => (
                    <div
                      key={contrato.id}
                      onClick={() => handleNavigate('/contratos')}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-500" />
                        <span className="font-medium text-foreground">{contrato.numeroContrato || contrato.codigo || 'Contrato'} - {contrato.clienteNome || contrato.nome || 'Cliente'}</span>
                      </div>
                      <span className="font-semibold text-emerald-600">R$ {(contrato.valorTotal || 0).toLocaleString('pt-BR')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredPages.length === 0 && filteredClientes.length === 0 && filteredContratos.length === 0 && (
              <div className="p-6 text-center text-muted-foreground">
                Nenhum resultado encontrado para "{query}".
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
