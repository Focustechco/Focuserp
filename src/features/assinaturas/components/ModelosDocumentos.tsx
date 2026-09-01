import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Plus, Copy, Search, CheckCircle2 } from 'lucide-react';
import { ModeloDocumento } from '../types';
import { toast } from 'sonner';

interface ModelosDocumentosProps {
  modelos: ModeloDocumento[];
  onUsarModelo: (modelo: ModeloDocumento) => void;
}

export function ModelosDocumentos({ modelos, onUsarModelo }: ModelosDocumentosProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredModelos = modelos.filter(m => 
    (m?.titulo || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
    (m?.categoria || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-xl border shadow-xs">
        <div className="relative w-full sm:w-[320px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar modelo de contrato..." 
            className="pl-9 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button className="gap-2 w-full sm:w-auto" onClick={() => toast.info("Criador visual de minutas em desenvolvimento!")}>
          <Plus className="w-4 h-4" /> Novo Modelo de Contrato
        </Button>
      </div>

      {filteredModelos.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground bg-muted/10 rounded-2xl border border-dashed my-4">
          <FileText className="w-12 h-12 text-primary opacity-40 mx-auto mb-3" />
          <h4 className="font-bold text-sm text-foreground">Nenhum modelo de contrato cadastrado.</h4>
          <p className="text-xs mt-1">Crie modelos de contratos e minutas para reutilizar rapidamente em novos disparos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredModelos.map((mod) => (
            <Card key={mod.id} className="hover:shadow-md transition-all flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-[10px]">{mod.categoria}</Badge>
                  <span className="text-[10px] text-muted-foreground">{mod.usadoVezes} assinaturas</span>
                </div>
                <CardTitle className="text-base mt-2">{mod.titulo}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">{mod.descricao}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Campos Dinâmicos</span>
                  <div className="flex flex-wrap gap-1">
                    {mod.camposVariaveis.map((campo) => (
                      <Badge key={campo} variant="outline" className="text-[10px] font-mono">{`{{${campo}}}`}</Badge>
                    ))}
                  </div>
                </div>
                <Button className="w-full gap-2 bg-primary/10 hover:bg-primary/20 text-primary border-none shadow-none text-xs font-semibold" onClick={() => onUsarModelo(mod)}>
                  <Copy className="w-3.5 h-3.5" /> Usar este Modelo
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
