import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Search, Star, Play, ShieldCheck, Sparkles } from 'lucide-react';
import { useRelatoriosStore } from '../hooks/useRelatoriosStore';
import { ReportDefinition, GeneratedReportData } from '../types';
import { ReportDocumentPreviewModal } from './ReportDocumentPreviewModal';

export function ReportCatalogView() {
  const { catalog, favorites, toggleFavorite, generateReportData } = useRelatoriosStore();

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('todos');

  // Preview State
  const [selectedForPreview, setSelectedForPreview] = useState<GeneratedReportData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

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

  const filteredCatalog = catalog.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = 
      activeCategory === 'todos' ? true :
      activeCategory === 'favoritos' ? favorites.includes(item.id) :
      item.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const handleQuickGenerate = (def: ReportDefinition) => {
    const data = generateReportData(def.id, {
      dataInicio: '2026-01-01',
      dataFim: new Date().toISOString().split('T')[0],
      empresa: 'Focus Tecnologia Ltda',
      colunasSelecionadas: def.columns.map(c => c.key),
      incluirGraficos: true,
      incluirResumoExecutivo: true
    });

    setSelectedForPreview(data);
    setShowPreview(true);
  };

  return (
    <div className="space-y-6 animate-fade-in pt-2">
      {/* Busca & Controles */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Pesquisar por nome, módulo, tag ou recomendação..." 
            className="pl-8"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 bg-muted p-1 rounded-md overflow-x-auto">
          {categories.map(c => (
            <Button
              key={c.id}
              variant={activeCategory === c.id ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveCategory(c.id)}
              className={`text-xs h-8 whitespace-nowrap transition-all ${
                activeCategory === c.id && c.id === 'favoritos' ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 font-semibold' : ''
              }`}
            >
              {c.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid de Cards de Relatórios ou Estado Vazio */}
      {filteredCatalog.length === 0 ? (
        <div className="p-12 text-center border border-dashed rounded-xl bg-card space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <Star className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-foreground">
            {activeCategory === 'favoritos' ? 'Nenhum relatório favoritado ainda' : 'Nenhum relatório encontrado'}
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {activeCategory === 'favoritos' 
              ? 'Clique na estrela ⭐ no canto superior de qualquer modelo de relatório para fixá-lo como favorito e ter acesso rápido.'
              : 'Tente buscar com outros termos ou selecione outra categoria.'}
          </p>
          {activeCategory === 'favoritos' && (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs mt-2"
              onClick={() => setActiveCategory('todos')}
            >
              Ver Catálogo Completo
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCatalog.map((item) => {
            const isFav = favorites.includes(item.id);

            return (
              <Card 
                key={item.id} 
                className={`hover:border-primary/50 transition-all flex flex-col justify-between group ${
                  isFav ? 'border-amber-400/40 shadow-sm' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-[10px] font-semibold">
                      {item.category}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`h-8 w-8 rounded-full transition-all ${
                        isFav 
                          ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 hover:text-amber-600' 
                          : 'text-muted-foreground hover:text-amber-500 hover:bg-muted'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item.id);
                      }}
                      title={isFav ? "Remover dos favoritos" : "Marcar como favorito"}
                    >
                      <Star className={`w-4 h-4 transition-transform active:scale-125 ${isFav ? 'fill-amber-400 text-amber-500' : ''}`} />
                    </Button>
                  </div>
                  <CardTitle className="text-base group-hover:text-primary transition-colors leading-tight">
                    {item.title}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {item.description}
                  </p>
                </CardHeader>

                <CardContent className="pb-3 text-xs space-y-3">
                  <div className="bg-muted/40 p-2 rounded text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground">Recomendado para: </span>
                    {item.recommendedFor}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {item.tags.map(t => (
                      <Badge key={t} variant="secondary" className="text-[9px] font-normal">
                        #{t}
                      </Badge>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="border-t pt-3 flex justify-between items-center bg-muted/10">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Layout Focus
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleQuickGenerate(item)}
                    className="gap-1.5 h-8 text-xs bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Play className="w-3.5 h-3.5" /> Gerar Relatório
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Pré-Visualização Corporativa */}
      <ReportDocumentPreviewModal 
        data={selectedForPreview}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </div>
  );
}

