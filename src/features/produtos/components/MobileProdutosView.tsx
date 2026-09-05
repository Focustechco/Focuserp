import React, { useState, useMemo } from "react";
import { ProdutoFocus, CategoriaProduto, StatusProduto } from "../types";
import { 
  Search, ScanBarcode, Filter, Plus, Boxes, ArrowRight, ExternalLink, 
  Layers, CheckCircle2, Clock, ShieldCheck, Sparkles, SlidersHorizontal, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { NovoProdutoModal } from "./NovoProdutoModal";
import { EditarProdutoModal } from "./EditarProdutoModal";
import { toast } from "sonner";

interface MobileProdutosViewProps {
  produtos: ProdutoFocus[];
  onSelectProduto: (p: ProdutoFocus) => void;
  onAddProduto: (p: Partial<ProdutoFocus>) => void;
  onUpdateProduto: (id: string, changes: Partial<ProdutoFocus>) => void;
  onDeleteProduto: (id: string) => void;
}

const CATEGORIAS_PILLS = [
  "Todos",
  "ERP & Gestão",
  "CRM & Vendas",
  "Business Intelligence",
  "Fintech & Pay",
  "Inovação & IA",
  "Logística",
  "Educação / EAD",
];

export function MobileProdutosView({
  produtos,
  onSelectProduto,
  onAddProduto,
  onUpdateProduto,
  onDeleteProduto,
}: MobileProdutosViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("Todos");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [novoModalOpen, setNovoModalOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<ProdutoFocus | null>(null);

  const filteredProdutos = useMemo(() => {
    return produtos.filter((p) => {
      const matchSearch =
        (p.nome || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.codigo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.descricaoCurta || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.categoria || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory =
        selectedCategory === "Todos" || p.categoria === selectedCategory;

      const matchStatus =
        selectedStatusFilter === "Todos" || p.status === selectedStatusFilter;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [produtos, searchTerm, selectedCategory, selectedStatusFilter]);

  const handleBarcodeScan = () => {
    toast.info("Scanner de Código de Barras / QR Code ativado via câmera");
  };

  const getStatusBadge = (status: StatusProduto) => {
    switch (status) {
      case "Ativo":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
            ● Ativo
          </Badge>
        );
      case "Em Desenvolvimento":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px] font-bold">
            ● Em Dev
          </Badge>
        );
      case "Em Implantação":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold">
            ● Implantação
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-3.5 p-3.5 pb-24 bg-slate-50/60 dark:bg-zinc-950 min-h-screen">
      {/* BARRA DE BUSCA + SCANNER + NOVO PRODUTO */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por produto, código ou categoria..."
            className="pl-9 h-10 text-xs bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 rounded-xl focus-visible:ring-[#FF6A00]"
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleBarcodeScan}
          className="h-10 w-10 border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl shrink-0 active:scale-95 cursor-pointer text-[#FF6A00]"
          title="Scanner de Código de Barras / QR Code"
        >
          <ScanBarcode className="h-4.5 w-4.5 text-[#FF6A00]" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setFilterSheetOpen(true)}
          className="h-10 w-10 border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl shrink-0 active:scale-95 relative cursor-pointer"
          title="Filtros"
        >
          <SlidersHorizontal className="h-4.5 w-4.5 text-slate-700 dark:text-zinc-300" />
          {selectedStatusFilter !== "Todos" && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#FF6A00]" />
          )}
        </Button>

        <Button
          size="sm"
          onClick={() => setNovoModalOpen(true)}
          className="gap-1 bg-[#FF6A00] hover:bg-orange-600 text-white font-bold text-xs h-10 px-3 rounded-xl shadow-xs shrink-0 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Novo</span>
        </Button>
      </div>

      {/* 3. CARROSSEL DE CATEGORIAS HORIZONTAL (Print 1 logic) */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1 -mx-4 px-4">
        {CATEGORIAS_PILLS.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 active:scale-95 ${
                isSelected
                  ? "bg-orange-500 text-white shadow-xs"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 4. LISTA DE CARDS DE PRODUTOS (Print 1 logic) */}
      {filteredProdutos.length === 0 ? (
        <div className="p-10 text-center rounded-3xl border border-dashed border-border bg-muted/10 my-4 space-y-3">
          <Boxes className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <h3 className="font-extrabold text-sm text-foreground">Nenhum produto encontrado</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Não encontramos nenhum item com os filtros ou termo de busca informado.
          </p>
          <Button
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("Todos");
              setSelectedStatusFilter("Todos");
            }}
            variant="outline"
            className="text-xs"
          >
            Limpar Filtros
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProdutos.map((prod) => {
            const hasPreco = (prod.precoBase || 0) > 0;

            return (
              <div
                key={prod.id}
                onClick={() => onSelectProduto(prod)}
                className="p-4 rounded-2xl border border-border/80 bg-white dark:bg-card shadow-2xs hover:border-orange-500/40 hover:shadow-md transition-all space-y-3 cursor-pointer active:scale-[0.99] relative overflow-hidden"
              >
                {/* Linha sutil no topo */}
                <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-amber-500 to-primary absolute top-0 left-0" />

                <div className="flex items-start justify-between gap-3 pt-1">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-black text-base shrink-0 border border-orange-500/20">
                      <Boxes className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-foreground border border-border/80">
                          {prod.codigo}
                        </span>
                        <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-full border border-orange-500/20">
                          {prod.categoria}
                        </span>
                      </div>
                      <h3 className="font-black text-sm text-foreground tracking-tight mt-1">
                        {prod.nome}
                      </h3>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {getStatusBadge(prod.status)}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {prod.descricaoCurta || "Software corporativo da Focus Tecnologia."}
                </p>

                {/* Métricas e Detalhes do Produto */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                      Versão Atual
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      v{prod.versaoAtual || "1.0.0"}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                      Preço / Licença
                    </span>
                    <span className="font-black text-foreground text-sm">
                      {hasPreco ? `R$ ${(prod.precoBase || 0).toLocaleString("pt-BR")}` : "Sob Consulta"}
                    </span>
                  </div>
                </div>

                {/* Rodapé do Card com Ações Rápidas */}
                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <span className="text-[11px] text-muted-foreground">
                    Responsável: <strong className="text-foreground">{prod.responsavelPrincipal || "Tech Lead"}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProduto(prod);
                      }}
                      className="text-xs font-bold text-muted-foreground hover:text-foreground h-8 px-2.5 rounded-lg"
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/40 h-8 px-2.5 rounded-lg gap-1"
                    >
                      <span>Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. BOTTOM SHEET DE FILTROS AVANÇADOS */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[80vh] p-5 bg-white dark:bg-card border-t">
          <SheetHeader className="pb-3 border-b">
            <SheetTitle className="text-lg font-black text-foreground">
              Filtrar Produtos
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Filtre por categoria e status operacional
            </SheetDescription>
          </SheetHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">Status do Produto</label>
              <div className="grid grid-cols-2 gap-2">
                {["Todos", "Ativo", "Em Desenvolvimento", "Em Implantação"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedStatusFilter(st)}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                      selectedStatusFilter === st
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-muted/40 border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <SheetFooter className="pt-2 flex flex-row items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCategory("Todos");
                setSelectedStatusFilter("Todos");
                setFilterSheetOpen(false);
              }}
              className="flex-1 text-xs"
            >
              Limpar
            </Button>
            <Button
              onClick={() => setFilterSheetOpen(false)}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs"
            >
              Aplicar Filtros
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Modais de Criação e Edição */}
      <NovoProdutoModal
        open={novoModalOpen}
        onOpenChange={setNovoModalOpen}
        onSave={onAddProduto}
      />

      {editingProduto && (
        <EditarProdutoModal
          produto={editingProduto}
          open={!!editingProduto}
          onOpenChange={(op) => !op && setEditingProduto(null)}
          onSave={onUpdateProduto}
          onDelete={onDeleteProduto}
        />
      )}
    </div>
  );
}
