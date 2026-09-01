import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Star, Play, Filter, ShieldCheck } from 'lucide-react';
import { useRelatoriosStore } from '../hooks/useRelatoriosStore';
import { ReportCategory, ReportDefinition, GeneratedReportData } from '../types';
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

    const matchesCategory = activeCategory === 'todos' || item.category === activeCategory;

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
              className="text-xs h-8"
            >
              {c.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid de Cards de Relatórios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCatalog.map((item) => {
          const isFav = favorites.includes(item.id);

          return (
            <Card key={item.id} className="hover:border-primary/50 transition-all flex flex-col justify-between group">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="text-[10px] font-semibold">
                    {item.category}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-muted-foreground hover:text-amber-400"
                    onClick={() => toggleFavorite(item.id)}
                  >
                    <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
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

      {/* Modal de Pré-Visualização Corporativa */}
      <ReportDocumentPreviewModal 
        data={selectedForPreview}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </div>
  );
}
