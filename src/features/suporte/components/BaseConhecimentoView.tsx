import React, { useState } from 'react';
import { ArtigoConhecimento } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, ThumbsUp, Eye, Tag, Plus } from 'lucide-react';

interface BaseConhecimentoViewProps {
  artigos: ArtigoConhecimento[];
  onAddArtigo?: (artigo: ArtigoConhecimento) => void;
}

export function BaseConhecimentoView({ artigos }: BaseConhecimentoViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedArtigo, setSelectedArtigo] = useState<ArtigoConhecimento | null>(null);

  const categories = ['all', 'ERP', 'CRM', 'BI', 'Pay', 'Log', 'EAD', 'IA & Lab', 'Integrações', 'FAQ'];

  const filteredArtigos = artigos.filter((art) => {
    const matchesSearch =
      (art.titulo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (art.resumo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (art.conteudo || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || art.categoria === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER DA BASE DE CONHECIMENTO */}
      <Card className="bg-gradient-to-r from-primary/10 via-blue-500/5 to-purple-500/10 border-border/80 p-6">
        <CardContent className="p-0 space-y-4">
          <div>
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" /> Central de Ajuda & Base de Conhecimento
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Manuais, procedimentos padrão de atendimento, FAQs e tutoriais dos softwares da Focus Tecnologia
            </p>
          </div>

          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar artigos de ajuda por palavra-chave, erro ou funcionalidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-card text-xs"
            />
          </div>

          {/* Categorias Pills */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={selectedCategory === cat ? 'default' : 'outline'}
                className="h-7 text-xs font-semibold"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'all' ? 'Todas as Categorias' : cat}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* DETALHE DO ARTIGO SELECIONADO OU GRID DE ARTIGOS */}
      {selectedArtigo ? (
        <Card className="p-6 space-y-4 border-border/80">
          <Button variant="ghost" size="sm" onClick={() => setSelectedArtigo(null)} className="text-xs font-semibold">
            ← Voltar à lista de artigos
          </Button>
          <div className="space-y-2 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold">
                {selectedArtigo.categoria}
              </Badge>
              <span className="text-xs text-muted-foreground">Atualizado em: {selectedArtigo.updatedAt}</span>
            </div>
            <h1 className="text-xl font-extrabold text-foreground">{selectedArtigo.titulo}</h1>
          </div>
          <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed space-y-3">
            <p className="font-semibold text-muted-foreground">{selectedArtigo.resumo}</p>
            <div className="p-4 rounded-xl bg-muted/30 border border-border/60 text-foreground">
              {selectedArtigo.conteudo}
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-border text-xs text-muted-foreground">
            <span>Autor: <strong className="text-foreground">{selectedArtigo.autor}</strong></span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {selectedArtigo.visualizacoes} visualizações</span>
              <span className="flex items-center gap-1 text-emerald-600 font-semibold"><ThumbsUp className="h-4 w-4" /> {selectedArtigo.utilidadeVotos} aprovações</span>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredArtigos.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-xs text-muted-foreground border border-dashed rounded-xl">
              Nenhum artigo encontrado para a pesquisa.
            </div>
          ) : (
            filteredArtigos.map((art) => (
              <Card
                key={art.id}
                onClick={() => setSelectedArtigo(art)}
                className="group hover:border-primary transition-all cursor-pointer border-border/80 flex flex-col justify-between"
              >
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] font-bold">
                      {art.categoria}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {art.visualizacoes}
                    </span>
                  </div>
                  <CardTitle className="text-sm font-extrabold text-foreground group-hover:text-primary transition-colors mt-2">
                    {art.titulo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <p className="text-xs text-muted-foreground line-clamp-2">{art.resumo}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {art.tags.map((t) => (
                      <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-muted font-mono text-muted-foreground">
                        #{t}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
