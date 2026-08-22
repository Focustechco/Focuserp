import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ArrowRight, ArrowLeft, Wand2, FileText, Filter, Settings, Eye } from 'lucide-react';
import { useRelatoriosStore } from '../hooks/useRelatoriosStore';
import { ReportDefinition, ReportFilterConfig, GeneratedReportData } from '../types';
import { ReportDocumentPreviewModal } from './ReportDocumentPreviewModal';

export function ReportGeneratorWizard() {
  const { catalog, generateReportData } = useRelatoriosStore();

  const [step, setStep] = useState<number>(1);
  const [selectedReportId, setSelectedReportId] = useState<string>(catalog[0].id);

  // Filter state
  const [dataInicio, setDataInicio] = useState('2026-01-01');
  const [dataFim, setDataFim] = useState(new Date().toISOString().split('T')[0]);
  const [empresa, setEmpresa] = useState('Focus Tecnologia Ltda');
  const [status, setStatus] = useState('Todos');
  const [incluirGraficos, setIncluirGraficos] = useState(true);
  const [incluirResumoExecutivo, setIncluirResumoExecutivo] = useState(true);
  const [observacoesPersonalizadas, setObservacoesPersonalizadas] = useState('');

  // Preview Modal
  const [previewData, setPreviewData] = useState<GeneratedReportData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const selectedDef: ReportDefinition = catalog.find(r => r.id === selectedReportId) || catalog[0];

  const handleGeneratePreview = () => {
    const filterConfig: ReportFilterConfig = {
      dataInicio,
      dataFim,
      empresa,
      status,
      colunasSelecionadas: selectedDef.columns.map(c => c.key),
      incluirGraficos,
      incluirResumoExecutivo,
      observacoesPersonalizadas
    };

    const data = generateReportData(selectedDef.id, filterConfig);
    setPreviewData(data);
    setShowPreview(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in max-w-5xl mx-auto pt-2">
      {/* Steps Progress Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 shrink-0">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">Assistente de Geração de Relatórios</h2>
            <p className="text-xs text-muted-foreground">Configure e personalize os parâmetros do seu documento corporativo.</p>
          </div>
        </div>

        {/* Step Indicator Badges (Horizontal scroll no mobile) */}
        <div className="flex items-center gap-2 text-xs overflow-x-auto scrollbar-hide w-full sm:w-auto py-1">
          <Badge variant={step === 1 ? 'default' : 'outline'} className={`shrink-0 ${step === 1 ? 'bg-orange-600' : ''}`}>1. Relatório</Badge>
          <span className="text-muted-foreground">→</span>
          <Badge variant={step === 2 ? 'default' : 'outline'} className={`shrink-0 ${step === 2 ? 'bg-orange-600' : ''}`}>2. Filtros</Badge>
          <span className="text-muted-foreground">→</span>
          <Badge variant={step === 3 ? 'default' : 'outline'} className={`shrink-0 ${step === 3 ? 'bg-orange-600' : ''}`}>3. Emissão</Badge>
        </div>
      </div>

      {/* STEP 1: Seleção do Relatório */}
      {step === 1 && (
        <Card className="border shadow-sm">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-600" />
              Etapa 1 de 3: Selecionar Tipo de Relatório
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {catalog.map(item => (
                <div 
                  key={item.id}
                  onClick={() => setSelectedReportId(item.id)}
                  className={`p-3.5 sm:p-4 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${selectedReportId === item.id ? 'border-orange-500 bg-orange-50/20 dark:bg-orange-950/20 ring-2 ring-orange-500/20' : 'hover:border-muted-foreground/40 bg-card'}`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary" className="text-[10px]">{item.category}</Badge>
                      {selectedReportId === item.id && <CheckCircle2 className="w-4 h-4 text-orange-600" />}
                    </div>
                    <h4 className="font-semibold text-xs sm:text-sm leading-tight mb-1">{item.title}</h4>
                    <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t p-3 sm:p-4">
            <Button onClick={() => setStep(2)} className="gap-2 text-xs sm:text-sm bg-orange-600 hover:bg-orange-700 text-white">
              Avançar para Filtros <ArrowRight className="w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 2: Filtros */}
      {step === 2 && (
        <Card className="border shadow-sm">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Filter className="w-4 h-4 text-orange-600" />
              Etapa 2 de 3: Filtros de Dados ({selectedDef.title})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Data Inicial</Label>
                <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="text-xs h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Data Final</Label>
                <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="text-xs h-9" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Empresa / Filial</Label>
                <Select value={empresa} onValueChange={setEmpresa}>
                  <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Focus Tecnologia Ltda">Focus Tecnologia Ltda (Matriz)</SelectItem>
                    <SelectItem value="Focus Finance Filial SP">Focus Finance Filial SP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Status dos Registros</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todos os Status</SelectItem>
                    <SelectItem value="Ativos">Apenas Ativos / Concluídos</SelectItem>
                    <SelectItem value="Pendentes">Pendentes / Em Aberto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-3 sm:p-4">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-1.5 text-xs sm:text-sm">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
            <Button onClick={() => setStep(3)} className="gap-1.5 text-xs sm:text-sm bg-orange-600 hover:bg-orange-700 text-white">
              Avançar para Personalização <ArrowRight className="w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 3: Personalização e Emissão */}
      {step === 3 && (
        <Card className="border shadow-sm">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Settings className="w-4 h-4 text-orange-600" />
              Etapa 3 de 3: Layout & Emissão do Documento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="space-y-3 border p-3.5 sm:p-4 rounded-lg bg-muted/20">
              <h4 className="font-semibold text-xs sm:text-sm">Opções de Exibição Corporativa</h4>
              <div className="flex items-center space-x-2">
                <Checkbox id="inc-res" checked={incluirResumoExecutivo} onCheckedChange={(v: any) => setIncluirResumoExecutivo(v)} />
                <Label htmlFor="inc-res" className="text-xs cursor-pointer">Incluir Cards de Resumo Executivo no Cabeçalho</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="inc-graf" checked={incluirGraficos} onCheckedChange={(v: any) => setIncluirGraficos(v)} />
                <Label htmlFor="inc-graf" className="text-xs cursor-pointer">Incluir Gráficos Analíticos no Relatório</Label>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Observações Adicionais no Rodapé (Opcional)</Label>
              <Textarea 
                placeholder="Ex: Documento para prestação de contas à diretoria executiva." 
                value={observacoesPersonalizadas}
                onChange={e => setObservacoesPersonalizadas(e.target.value)}
                className="text-xs"
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-3 sm:p-4">
            <Button variant="outline" onClick={() => setStep(2)} className="gap-1.5 text-xs sm:text-sm">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
            <Button onClick={handleGeneratePreview} className="gap-2 text-xs sm:text-sm bg-orange-600 hover:bg-orange-700 text-white font-semibold">
              <Eye className="w-4 h-4" /> Gerar & Visualizar Relatório
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* MODAL DE PREVIEW HOMOLOGADO */}
      <ReportDocumentPreviewModal 
        data={previewData}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </div>
  );
}
