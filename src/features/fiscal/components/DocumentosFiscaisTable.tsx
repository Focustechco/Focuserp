import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, FileText, Upload, Plus, Edit2, Trash2, Download, ExternalLink } from 'lucide-react';
import { DocumentoFiscal } from '../types';
import { useFiscalStore } from '../hooks/useFiscalStore';
import { toast } from 'sonner';

interface DocumentosFiscaisTableProps {
  onImportClick: () => void;
  onNewClick: () => void;
  onEditClick: (doc: DocumentoFiscal) => void;
}

export function DocumentosFiscaisTable({ onImportClick, onNewClick, onEditClick }: DocumentosFiscaisTableProps) {
  const { documentos, deleteDocumento } = useFiscalStore();
  const [searchTerm, setSearchTerm] = useState('');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Recebido': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">Recebido</Badge>;
      case 'Emitido': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">Emitido</Badge>;
      case 'Conferido': return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800">Conferido</Badge>;
      case 'Cancelado': return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800">Cancelado</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredDocs = documentos.filter(doc => {
    const term = searchTerm.toLowerCase();
    return (
      (doc.numero || '').toLowerCase().includes(term) ||
      (doc.tipo || '').toLowerCase().includes(term) ||
      (doc.entidade?.nome || '').toLowerCase().includes(term) ||
      (doc.entidade?.cnpjCpf || '').toLowerCase().includes(term) ||
      (doc.vinculos?.projetoNome && doc.vinculos.projetoNome.toLowerCase().includes(term))
    );
  });

  const handleDelete = (doc: DocumentoFiscal) => {
    if (confirm(`Deseja remover a nota fiscal nº ${doc.numero}?`)) {
      deleteDocumento(doc.id);
      toast.success(`Nota fiscal nº ${doc.numero} removida.`);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in pt-2">
      {/* Controles de Busca e Ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nº da nota, cliente, CNPJ ou tipo..."
              className="pl-8 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <Button variant="secondary" size="sm" className="gap-2 text-xs" onClick={onImportClick}>
            <Upload className="h-4 w-4" /> Importar XML / PDF
          </Button>
          <Button size="sm" className="gap-2 text-xs bg-orange-600 hover:bg-orange-700 text-white font-bold" onClick={onNewClick}>
            <Plus className="h-4 w-4" /> Emitir / Novo Documento
          </Button>
        </div>
      </div>

      {/* Tabela de Documentos Fiscais */}
      <div className="border rounded-lg overflow-hidden bg-background shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Número / Série</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Entidade (Cliente/Fornecedor)</TableHead>
              <TableHead>Emissão</TableHead>
              <TableHead>Vínculo</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-[120px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocs.map((doc: DocumentoFiscal) => (
              <TableRow key={doc.id} className="hover:bg-muted/30 transition-colors">
                <TableCell>
                  <div className="font-medium text-xs flex items-center gap-2">
                    <FileText className="h-4 w-4 text-orange-600 shrink-0" />
                    <span>Nº {doc.numero}</span>
                    {doc.serie && <span className="text-muted-foreground text-[10px]">/ Série {doc.serie}</span>}
                  </div>
                </TableCell>

                <TableCell>
                  <Badge variant="secondary" className="font-mono text-[10px]">{doc.tipo}</Badge>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs truncate max-w-[200px]">{doc.entidade?.nome || 'Entidade'}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{doc.entidade?.cnpjCpf || ''}</span>
                  </div>
                </TableCell>

                <TableCell>
                  <span className="text-xs text-muted-foreground">{doc.dataEmissao ? new Date(doc.dataEmissao).toLocaleDateString('pt-BR') : 'Data N/A'}</span>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col text-xs">
                    {doc.vinculos?.projetoNome && <span className="text-blue-600 dark:text-blue-400 font-medium text-[11px]">Proj: {doc.vinculos.projetoNome}</span>}
                    {doc.vinculos?.centroCusto && <span className="text-[10px] text-muted-foreground">CC: {doc.vinculos.centroCusto}</span>}
                    {!doc.vinculos?.projetoNome && !doc.vinculos?.centroCusto && <span className="text-muted-foreground italic text-[10px]">Sem vínculo</span>}
                  </div>
                </TableCell>

                <TableCell className="text-right font-bold text-xs text-emerald-600">
                  {formatCurrency(doc.valorTotal)}
                </TableCell>

                <TableCell className="text-center">
                  {getStatusBadge(doc.status)}
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onEditClick(doc)} 
                      className="h-7 w-7 text-muted-foreground hover:text-orange-600"
                      title="Editar Nota Fiscal"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(doc)} 
                      className="h-7 w-7 text-muted-foreground hover:text-rose-600"
                      title="Excluir Nota Fiscal"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {filteredDocs.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                  Nenhum documento fiscal encontrado. Clique em "Emitir / Novo Documento" para cadastrar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <p>Exibindo {filteredDocs.length} de {documentos.length} documentos fiscais salvos no sistema.</p>
      </div>
    </div>
  );
}
