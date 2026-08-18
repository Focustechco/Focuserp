import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  FileSignature, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ShieldCheck, 
  MoreHorizontal, 
  PenTool, 
  FileText, 
  Download, 
  ExternalLink,
  Ban,
  Share2
} from 'lucide-react';
import { DocumentoAssinatura } from '../types';
import { toast } from 'sonner';

interface DocumentosListaProps {
  documentos: DocumentoAssinatura[];
  onNovoDocumento: () => void;
  onAssinar: (doc: DocumentoAssinatura) => void;
  onVerAuditoria: (doc: DocumentoAssinatura) => void;
  onCancelar: (docId: string) => void;
}

export function DocumentosLista({
  documentos,
  onNovoDocumento,
  onAssinar,
  onVerAuditoria,
  onCancelar
}: DocumentosListaProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [tipoFilter, setTipoFilter] = useState('todos');

  const filteredDocs = documentos.filter(doc => {
    const matchesSearch = 
      (doc?.titulo || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
      (doc?.codigoValidacao || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (doc?.categoria || '').toLowerCase().includes((searchTerm || '').toLowerCase());

    const matchesStatus = statusFilter === 'todos' || (doc?.status || '').toLowerCase() === (statusFilter || '').toLowerCase();
    const matchesTipo = tipoFilter === 'todos' || (doc?.tipoAssinaturaExigida || '').toLowerCase().includes((tipoFilter || '').toLowerCase());

    return matchesSearch && matchesStatus && matchesTipo;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Assinado':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 gap-1"><CheckCircle2 className="w-3 h-3" /> Assinado</Badge>;
      case 'Aguardando Assinatura':
      case 'Pendente':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 gap-1"><Clock className="w-3 h-3" /> Pendente</Badge>;
      case 'Cancelado':
        return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 gap-1"><XCircle className="w-3 h-3" /> Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTipoBadge = (tipo?: string) => {
    const safeTipo = tipo || '';
    if (safeTipo.includes('Gov.br')) {
      return <Badge className="bg-emerald-600 text-white font-normal text-[11px]">Gov.br</Badge>;
    }
    if (safeTipo.includes('ICP-Brasil')) {
      return <Badge className="bg-cyan-600 text-white font-normal text-[11px]">ICP-Brasil A1/A3</Badge>;
    }
    return <Badge variant="secondary" className="font-normal text-[11px]">Eletrônica Simples</Badge>;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Tool Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-xl border shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-[320px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar contrato, código ou categoria..." 
              className="pl-9 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px] bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Status</SelectItem>
                <SelectItem value="assinado">Assinados</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="cancelado">Cancelados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-full sm:w-[150px] bg-background">
                <SelectValue placeholder="Modalidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas Modalidades</SelectItem>
                <SelectItem value="simples">Eletrônica Simples</SelectItem>
                <SelectItem value="gov.br">Gov.br</SelectItem>
                <SelectItem value="icp-brasil">ICP-Brasil</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button className="gap-2 w-full sm:w-auto bg-primary shadow-sm" onClick={onNovoDocumento}>
          <FileSignature className="w-4 h-4" /> Novo Documento
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-xl bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[300px]">Documento & Código</TableHead>
              <TableHead>Assinantes & Progresso</TableHead>
              <TableHead>Modalidade</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-36 text-center text-muted-foreground">
                  Nenhum documento encontrado com os filtros selecionados.
                </TableCell>
              </TableRow>
            ) : (
              filteredDocs.map((doc) => {
                const assinanatesConcluidos = doc.assinantes.filter(a => a.status === 'Assinado').length;
                const totalAssinantes = doc.assinantes.length;

                return (
                  <TableRow key={doc.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm line-clamp-1">{doc.titulo}</div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px] font-bold">{doc.codigoValidacao}</span>
                            <span>•</span>
                            <span>{new Date(doc.dataCriacao).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <span>{assinanatesConcluidos}/{totalAssinantes} Assinados</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {doc.assinantes.map(a => (
                            <span key={a.id} className={`inline-block w-2 h-2 rounded-full ${a.status === 'Assinado' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} title={`${a.nome} (${a.status})`} />
                          ))}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {getTipoBadge(doc.tipoAssinaturaExigida)}
                    </TableCell>

                    <TableCell>
                      <Badge variant="secondary" className="font-normal text-xs">{doc.moduloOrigem || 'Manual'}</Badge>
                    </TableCell>

                    <TableCell>
                      {getStatusBadge(doc.status)}
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[200px]">
                          <DropdownMenuLabel>Ações do Documento</DropdownMenuLabel>
                          
                          {doc.status !== 'Assinado' && doc.status !== 'Cancelado' && (
                            <DropdownMenuItem className="text-primary font-medium" onClick={() => onAssinar(doc)}>
                              <PenTool className="w-4 h-4 mr-2" /> Assinar Agora
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem onClick={() => onVerAuditoria(doc)}>
                            <ShieldCheck className="w-4 h-4 mr-2 text-emerald-600" /> Trilha de Auditoria
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => toast.success("PDF do contrato assinado baixado com sucesso!")}>
                            <Download className="w-4 h-4 mr-2 text-muted-foreground" /> Baixar PDF Carimbado
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => {
                            navigator.clipboard.writeText(`https://focus-financial.vercel.app/validar/${doc.codigoValidacao}`);
                            toast.success("Link público de validação copiado!");
                          }}>
                            <Share2 className="w-4 h-4 mr-2 text-muted-foreground" /> Copiar Link Público
                          </DropdownMenuItem>

                          {doc.status !== 'Cancelado' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-rose-600" onClick={() => onCancelar(doc.id)}>
                                <Ban className="w-4 h-4 mr-2" /> Cancelar Fluxo
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
