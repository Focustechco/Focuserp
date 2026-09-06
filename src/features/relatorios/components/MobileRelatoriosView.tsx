import React, { useState, useMemo } from 'react';
import { useRelatoriosStore } from '../hooks/useRelatoriosStore';
import { ReportDefinition, GeneratedReportData } from '../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileSpreadsheet, Search, Filter, Star, Play, Wand2,
  Clock, Calendar, ShieldCheck, Download, Eye, FileText,
  Sparkles, Layers, LayoutGrid, CheckCircle2, ChevronRight
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { ReportDocumentPreviewModal } from './ReportDocumentPreviewModal';
import { ReportDashboard } from './ReportDashboard';
import { ReportGeneratorWizard } from './ReportGeneratorWizard';
import { ReportHistoryView } from './ReportHistoryView';
import { ReportSchedulesView } from './ReportSchedulesView';
import { toast } from 'sonner';

export function MobileRelatoriosView() {
  const { catalog, favorites, toggleFavorite, generateReportData, history, schedules } = useRelatoriosStore();

  const [activeMainTab, setActiveMainTab] = useState<'catalogo' | 'dashboard' | 'wizard' | 'historico' | 'agendamentos'>('catalogo');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Modais
  const [selectedForPreview, setSelectedForPreview] = useState<GeneratedReportData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Categorias disponíveis
  const categories: Array<{ id: string; label: string }> = [
    { id: 'todos', label: 'Todos' },
    { id: 'favoritos', label: `⭐ Favoritos (${favorites.length})` },
    { id: 'Financeiro', label: 'Financeiro' },
    { id: 'Clientes', label: 'Clientes' },
    { id: 'Projetos', label: 'Projetos' },
    { id: 'RH', label: 'RH' },
    { id: 'Marketing', label: 'Marketing' },
    { id: 'Fiscal', label: 'Fiscal' },
  ];

  // Métricas de topo
  const stats = useMemo(() => {
    const totalDisponiveis = catalog.length;
    const totalFavoritos = favorites.length;
    const totalExecutados = history.length;
    const totalAgendados = schedules.filter(s => s.status === 'Ativo').length;
    return { totalDisponiveis, totalFavoritos, totalExecutados, totalAgendados };
  }, [catalog, favorites, history, schedules]);

  // Lista filtrada do catálogo
  const filteredCatalog = useMemo(() => {
    return catalog
      .filter((item) => {
        const matchesSearch =
          item.title.toLowerCase().includes(search.toLowerCase()) ||
          item.description.toLowerCase().includes(search.toLowerCase()) ||
          item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

        const matchesCategory =
          activeCategory === 'todos'
            ? true
            : activeCategory === 'favoritos'
            ? favorites.includes(item.id)
            : item.category === activeCategory;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        const aIsFav = favorites.includes(a.id);
        const bIsFav = favorites.includes(b.id);
        if (aIsFav && !bIsFav) return -1;
        if (!aIsFav && bIsFav) return 1;
        return 0;
      });
  }, [catalog, search, activeCategory, favorites]);

  const handleGenerateDirect = (report: ReportDefinition, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    toast.loading(`Gerando relatório "${report.title}"...`, { id: 'rep-gen-toast' });
    try {
      const defaultFilters = {
        dataInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        dataFim: new Date().toISOString().split('T')[0],
        formato: 'PDF' as const,
        incluirGraficos: true,
        periodo: 'mes_atual' as const
      };
      const generated = generateReportData(report.id, defaultFilters);
      setSelectedForPreview(generated);
      setShowPreview(true);
      toast.success('Relatório pronto para visualização!', { id: 'rep-gen-toast' });
    } catch (err: any) {
      toast.error(`Erro ao gerar relatório: ${err?.message || 'Falha ao processar'}`, { id: 'rep-gen-toast' });
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Financeiro':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200';
      case 'Clientes':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200';
      case 'Projetos':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200';
      case 'RH':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200';
      case 'Fiscal':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200';
      default:
        return 'bg-muted text-muted-foreground border-border/70';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* 1. TOP STICKY BAR */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b px-3.5 py-2.5 space-y-2">
        {/* Barra de Busca + Filtro Sheet + Botão Wizard */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar relatório, modelo, categoria..."
              className="h-9 pl-9 pr-3 text-xs rounded-xl bg-muted/40 border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtro Sheet */}
          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={`h-9 w-9 rounded-xl shrink-0 ${
                  activeCategory !== 'todos' ? 'border-primary text-primary bg-primary/5' : 'border-muted-foreground/20'
                }`}
              >
                <Filter className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto p-4">
              <SheetHeader className="text-left pb-3 border-b">
                <SheetTitle className="text-base font-bold">Categorias de Relatórios</SheetTitle>
                <SheetDescription className="text-xs">
                  Selecione a área para filtrar os modelos disponíveis
                </SheetDescription>
              </SheetHeader>

              <div className="grid grid-cols-2 gap-2 py-4 text-xs">
                {categories.map((c) => (
                  <Button
                    key={c.id}
                    type="button"
                    variant={activeCategory === c.id ? 'default' : 'outline'}
                    size="sm"
                    className={`justify-start text-xs h-9 rounded-xl ${activeCategory === c.id ? 'bg-primary text-white font-bold' : ''}`}
                    onClick={() => {
                      setActiveCategory(c.id);
                      setFilterSheetOpen(false);
                    }}
                  >
                    {c.label}
                  </Button>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          {/* Botão Wizard Direto */}
          <Button
            onClick={() => setActiveMainTab('wizard')}
            size="sm"
            className="h-9 px-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl gap-1 shadow-xs shrink-0"
          >
            <Wand2 className="w-3.5 h-3.5" /> Wizard
          </Button>
        </div>

        {/* Category Pills (Submódulos / Abas Principais) */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
          {[
            { id: 'catalogo', label: `Catálogo (${catalog.length})`, icon: FileSpreadsheet },
            { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
            { id: 'wizard', label: 'Gerador Wizard', icon: Wand2 },
            { id: 'historico', label: `Histórico (${history.length})`, icon: Clock },
            { id: 'agendamentos', label: `Agendamentos (${schedules.length})`, icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeMainTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMainTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-primary text-white border-primary font-semibold shadow-xs'
                    : 'bg-background text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. CONTEÚDO CONFORME ABA SELECIONADA */}
      <div className="p-3.5 space-y-4">
        {/* ABA: CATÁLOGO */}
        {activeMainTab === 'catalogo' && (
          <div className="space-y-3">
            {/* Sub-pills de Categoria */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap border transition-all ${
                    activeCategory === c.id
                      ? 'bg-muted text-foreground border-foreground/30 font-bold'
                      : 'bg-background/60 text-muted-foreground border-border/70 hover:text-foreground'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Lista de Cards de Relatório */}
            {filteredCatalog.length === 0 ? (
              <div className="text-center py-12 px-4 bg-card rounded-2xl border border-dashed border-border/70 my-4 shadow-2xs">
                <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="font-semibold text-sm text-foreground">Nenhum relatório encontrado</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[260px] mx-auto">
                  Tente alterar a busca ou a categoria selecionada.
                </p>
              </div>
            ) : (
              filteredCatalog.map((report) => {
                const isFav = favorites.includes(report.id);

                return (
                  <div
                    key={report.id}
                    onClick={() => handleGenerateDirect(report)}
                    className="relative overflow-hidden bg-card border border-border/80 rounded-2xl p-3.5 transition-all active:scale-[0.99] shadow-xs hover:border-primary/40 cursor-pointer flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex-1 min-w-0">
                        {/* Header do Card com Categoria e Formatos */}
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold px-2 py-0.5 ${getCategoryBadgeClass(report.category)}`}
                          >
                            {report.category}
                          </Badge>

                          {report.format.map((fmt) => (
                            <Badge key={fmt} variant="secondary" className="text-[9px] font-mono px-1.5 py-0.2">
                              {fmt}
                            </Badge>
                          ))}
                        </div>

                        {/* Título do Relatório */}
                        <h4 className="font-bold text-sm text-foreground truncate mt-1">
                          {report.title}
                        </h4>

                        {/* Descrição */}
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-tight">
                          {report.description}
                        </p>
                      </div>

                      {/* Botão de Favorito e Gerar */}
                      <div className="flex flex-col items-end gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleFavorite(report.id)}
                          className="p-1 rounded-full text-muted-foreground hover:text-amber-500 transition-colors"
                          title={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                        >
                          <Star className={`w-4 h-4 ${isFav ? 'fill-amber-500 text-amber-500' : ''}`} />
                        </button>

                        <Button
                          size="sm"
                          onClick={(e) => handleGenerateDirect(report, e)}
                          className="h-8 px-2.5 bg-primary text-white hover:bg-primary/90 font-bold text-xs rounded-xl gap-1 shadow-xs"
                        >
                          <Play className="w-3 h-3 fill-white" /> Gerar
                        </Button>
                      </div>
                    </div>

                    {/* Rodapé: Tags e Certificação */}
                    <div className="mt-1 pt-2 border-t border-dashed flex items-center justify-between text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1 truncate max-w-[200px]">
                        {report.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded text-[9px]">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                        <ShieldCheck className="w-3 h-3" /> Homologado
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ABA: DASHBOARD EXECUTIVO */}
        {activeMainTab === 'dashboard' && (
          <ReportDashboard />
        )}

        {/* ABA: GERADOR WIZARD */}
        {activeMainTab === 'wizard' && (
          <ReportGeneratorWizard />
        )}

        {/* ABA: HISTÓRICO & AUDITORIA */}
        {activeMainTab === 'historico' && (
          <ReportHistoryView />
        )}

        {/* ABA: AGENDAMENTOS */}
        {activeMainTab === 'agendamentos' && (
          <ReportSchedulesView />
        )}
      </div>

      {/* Modal de Pré-visualização do Relatório Homologado */}
      <ReportDocumentPreviewModal
        data={selectedForPreview}
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false);
          setSelectedForPreview(null);
        }}
      />
    </div>
  );
}
