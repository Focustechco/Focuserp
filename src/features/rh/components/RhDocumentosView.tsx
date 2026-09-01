import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, Download, Eye, Plus, Search, Filter, 
  FolderOpen, ShieldCheck, User, Upload, ExternalLink 
} from 'lucide-react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { useColaboradoresQuery } from '../hooks/useColaboradoresQuery';
import { useDocumentosStore } from '@/features/documentos/hooks/useDocumentosStore';
import { DmsPreviewModal } from '@/features/documentos/components/DmsPreviewModal';
import { toast } from 'sonner';

export interface DocumentoRhItem {
  id: string;
  nome: string;
  colaboradorId: string;
  colaboradorNome: string;
  categoria: 'Contrato de Trabalho (CLT/PJ)' | 'Termo de Confidencialidade (NDA)' | 'Holerite / Comprovante Salarial' | 'Atestado Médico' | 'Termo de Equipamentos (Patrimônio)' | 'Comprovante de Residência / Pessoal';
  extensao: string;
  tamanho: string;
  dataUpload: string;
  urlConteudo?: string;
}

const INITIAL_DOCS_RH: DocumentoRhItem[] = [];

export function RhDocumentosView() {
  const { colaboradores } = useColaboradoresQuery();
  const { uploadDocument, pastas } = useDocumentosStore();
  const { data: documentosRh = INITIAL_DOCS_RH, addItem } = useLocalStorageState<DocumentoRhItem>('focus_rh_documentos', INITIAL_DOCS_RH);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('Todas');
  const [openModal, setOpenModal] = useState(false);
  const [selectedDocPreview, setSelectedDocPreview] = useState<any | null>(null);

  // Form State
  const [colaboradorId, setColaboradorId] = useState(colaboradores[0]?.id || '');
  const [nomeDoc, setNomeDoc] = useState('');
  const [categoria, setCategoria] = useState<DocumentoRhItem['categoria']>('Contrato de Trabalho (CLT/PJ)');
  const [arquivo, setArquivo] = useState<{ nome: string; url: string; tamanho: string } | null>(null);

  const filteredDocs = useMemo(() => {
    return documentosRh.filter(d => {
      const matchSearch = 
        d.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.colaboradorNome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = categoriaFilter === 'Todas' || d.categoria === categoriaFilter;
      return matchSearch && matchCat;
    });
  }, [documentosRh, searchTerm, categoriaFilter]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setArquivo({
          nome: file.name,
          url: reader.result as string,
          tamanho: `${Math.round(file.size / 1024)} KB`
        });
        if (!nomeDoc) setNomeDoc(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const colab = colaboradores.find(c => c.id === colaboradorId) || colaboradores[0];
    if (!nomeDoc.trim() || !colab) {
      toast.error('Preencha o nome do documento e selecione o colaborador.');
      return;
    }

    const docName = arquivo?.nome || `${nomeDoc.trim()}.pdf`;
    const docId = `doc-rh-${Date.now()}`;

    const novo: DocumentoRhItem = {
      id: docId,
      nome: docName,
      colaboradorId: colab.id,
      colaboradorNome: colab.nomeCompleto || colab.nomeSocial || 'Colaborador',
      categoria,
      extensao: 'pdf',
      tamanho: arquivo?.tamanho || '350 KB',
      dataUpload: new Date().toISOString().split('T')[0],
      urlConteudo: arquivo?.url
    };

    // Sincronizar também com o Módulo DMS
    const pastaRh = pastas.find(p => p.nome.toLowerCase().includes('rh') || p.moduloVinculado === 'RH') || pastas[0];
    if (pastaRh) {
      uploadDocument({
        nome: docName,
        extensao: 'pdf' as any,
        tamanho: novo.tamanho,
        tamanhoBytes: 350000,
        pastaId: pastaRh.id,
        caminhoPasta: `/RH/Colaboradores/${novo.colaboradorNome}`,
        moduloOrigem: 'RH',
        categoria: novo.categoria,
        tags: ['RH', 'Colaborador', novo.colaboradorNome, novo.categoria],
        urlConteudo: arquivo?.url
      });
    }

    addItem(novo);
    toast.success('Documento de RH indexado e sincronizado com o DMS!');
    setOpenModal(false);
    setArquivo(null);
    setNomeDoc('');
  };

  const handleOpenPreview = (item: DocumentoRhItem) => {
    setSelectedDocPreview({
      id: item.id,
      codigo: `DOC-RH-${item.id.slice(-4)}`,
      nome: item.nome,
      extensao: item.extensao,
      tamanho: item.tamanho,
      moduloOrigem: 'RH',
      categoria: item.categoria,
      caminhoPasta: `/RH/Colaboradores/${item.colaboradorNome}`,
      tags: ['RH', item.colaboradorNome],
      dataCriacao: item.dataUpload,
      dataModificacao: item.dataUpload,
      criadoPor: 'Departamento de RH',
      urlConteudo: item.urlConteudo,
      versao: 1
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pt-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
            <FolderOpen className="w-5 h-5 text-orange-500" /> Central de Documentos & Contratos de RH
          </h3>
          <p className="text-xs text-muted-foreground">
            Repositório oficial de contratos de trabalho, NDAs, comprovantes de holerite, atestados e termos de equipamentos.
          </p>
        </div>

        <Button 
          onClick={() => setOpenModal(true)} 
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 font-bold text-xs h-8 shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Anexar Documento
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-muted/20 p-3 rounded-2xl border">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Buscar por documento ou colaborador..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 h-8 text-xs rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
            <SelectTrigger className="h-8 text-xs rounded-xl w-60">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas as Categorias</SelectItem>
              <SelectItem value="Contrato de Trabalho (CLT/PJ)">Contrato de Trabalho (CLT/PJ)</SelectItem>
              <SelectItem value="Termo de Confidencialidade (NDA)">Termo de Confidencialidade (NDA)</SelectItem>
              <SelectItem value="Holerite / Comprovante Salarial">Holerite / Comprovante Salarial</SelectItem>
              <SelectItem value="Atestado Médico">Atestado Médico</SelectItem>
              <SelectItem value="Termo de Equipamentos (Patrimônio)">Termo de Equipamentos (Patrimônio)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela de Documentos */}
      <div className="border rounded-2xl overflow-hidden bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b text-muted-foreground uppercase font-semibold text-[10px]">
              <tr>
                <th className="p-3.5">Documento</th>
                <th className="p-3.5">Colaborador</th>
                <th className="p-3.5">Categoria</th>
                <th className="p-3.5">Data Upload</th>
                <th className="p-3.5">Tamanho</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDocs.map(d => (
                <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3.5 font-semibold text-foreground flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-orange-500 shrink-0" />
                    <div>
                      <p className="font-bold">{d.nome}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">DMS Sync • Oficial</p>
                    </div>
                  </td>
                  <td className="p-3.5 font-medium">{d.colaboradorNome}</td>
                  <td className="p-3.5">
                    <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-400 bg-orange-50 dark:bg-orange-950/30">
                      {d.categoria}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-muted-foreground">{new Date(d.dataUpload + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                  <td className="p-3.5 text-muted-foreground font-mono">{d.tamanho}</td>
                  <td className="p-3.5 text-right">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleOpenPreview(d)}
                      className="h-7 px-2.5 text-xs gap-1 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 font-medium"
                    >
                      <Eye className="w-3.5 h-3.5" /> Visualizar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Anexar Documento */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <FolderOpen className="w-5 h-5 text-orange-500" /> Anexar Documento ao Prontuário de RH
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold">Colaborador *</Label>
              <Select value={colaboradorId} onValueChange={setColaboradorId}>
                <SelectTrigger className="rounded-xl h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colaboradores.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nomeCompleto || c.nomeSocial} ({c.cargo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold">Categoria do Documento</Label>
              <Select value={categoria} onValueChange={(v: any) => setCategoria(v)}>
                <SelectTrigger className="rounded-xl h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Contrato de Trabalho (CLT/PJ)">Contrato de Trabalho (CLT/PJ)</SelectItem>
                  <SelectItem value="Termo de Confidencialidade (NDA)">Termo de Confidencialidade (NDA)</SelectItem>
                  <SelectItem value="Holerite / Comprovante Salarial">Holerite / Comprovante Salarial</SelectItem>
                  <SelectItem value="Atestado Médico">Atestado Médico</SelectItem>
                  <SelectItem value="Termo de Equipamentos (Patrimônio)">Termo de Equipamentos (Patrimônio)</SelectItem>
                  <SelectItem value="Comprovante de Residência / Pessoal">Comprovante de Residência / Pessoal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold">Nome do Documento / Identificação *</Label>
              <Input 
                value={nomeDoc}
                onChange={e => setNomeDoc(e.target.value)}
                placeholder="Ex: Contrato_Trabalho_Assinado.pdf"
                className="rounded-xl h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold">Arquivo (PDF / Imagem / Documento)</Label>
              <div className="border border-dashed rounded-xl p-4 text-center cursor-pointer hover:bg-muted/40 transition-colors">
                <input 
                  type="file" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  id="rh-file-upload" 
                  accept=".pdf,.png,.jpg,.jpeg,.docx"
                />
                <label htmlFor="rh-file-upload" className="cursor-pointer flex flex-col items-center gap-1">
                  <Upload className="w-5 h-5 text-orange-500" />
                  <span className="text-xs font-semibold text-foreground">
                    {arquivo ? arquivo.nome : 'Clique para selecionar arquivo do computador'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">PDF, Imagens ou DOCX até 50MB</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setOpenModal(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl">
              Salvar e Sincronizar DMS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Preview DMS */}
      {selectedDocPreview && (
        <DmsPreviewModal 
          documento={selectedDocPreview} 
          open={!!selectedDocPreview} 
          onOpenChange={(open) => !open && setSelectedDocPreview(null)}
        />
      )}
    </div>
  );
}
