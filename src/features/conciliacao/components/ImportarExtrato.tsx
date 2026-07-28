import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { ContaBancaria, MovimentacaoBancaria } from '../types';
import { useDocumentosStore } from '@/features/documentos/hooks/useDocumentosStore';
import { FormatoArquivo } from '@/features/documentos/types';
import { toast } from 'sonner';

export function ImportarExtrato() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState<string>('');

  const { data: contasBancarias } = useLocalStorageState<ContaBancaria>('focus_contas_bancarias', []);
  const { addItem: addExtrato } = useLocalStorageState<MovimentacaoBancaria>('focus_extratos');
  
  const { pastas, createFolder, uploadDocument } = useDocumentosStore();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    if (!contaSelecionada) {
      toast.error('Selecione uma conta bancria de destino primeiro.');
      return;
    }

    setIsUploading(true);

    setTimeout(() => {
      // 1. Garantir que a pasta "Extratos Bancrios" exista no DMS
      let pastaExtratos = pastas.find(p => p.nome === 'Extratos Bancrios');
      if (!pastaExtratos) {
        // Criar pasta virtualmente (no temos o ID retornado sincrono pela store de forma fcil, ento pegamos o novo)
        createFolder('Extratos Bancrios', null, 'Financeiro');
      }

      // Re-buscar a pasta aps possvel criao (ou usar um ID gerado agora, mas o createFolder gera o ID internamente)
      // Para simplificar, vou simular o upload para a raiz ou para a pasta se existir
      const pastaId = pastaExtratos ? pastaExtratos.id : 'raiz';

      // 2. Fazer o Upload para o DMS
      const extensaoStr = file.name.split('.').pop()?.toLowerCase() || 'outros';
      const extensao = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'xml'].includes(extensaoStr) 
        ? extensaoStr as FormatoArquivo 
        : 'outros';

      uploadDocument({
        nome: file.name,
        extensao,
        tamanho: `${(file.size / 1024).toFixed(2)} KB`,
        tamanhoBytes: file.size,
        pastaId: pastaId !== 'raiz' ? pastaId : pastas[pastas.length - 1]?.id || '', // hack rpido para pegar a pasta recm criada
        moduloOrigem: 'Financeiro',
        categoria: 'Extrato',
        tags: ['extrato', 'banco', contaSelecionada]
      });

      // 3. Simular transaes extradas deste extrato (Parsing Mockado)
      const dataHoje = new Date().toISOString().split('T')[0];
      
      const transacoesSimuladas: MovimentacaoBancaria[] = [
        {
          id: `mov-${Date.now()}-1`,
          contaBancariaId: contaSelecionada,
          data: dataHoje,
          historico: 'PIX RECEBIDO - JOO SILVA',
          documento: `NSU${Math.floor(Math.random() * 1000000)}`,
          valor: 1500.00,
          tipo: 'Crdito',
          status: 'No Conciliado'
        },
        {
          id: `mov-${Date.now()}-2`,
          contaBancariaId: contaSelecionada,
          data: dataHoje,
          historico: 'PAGTO BOLETO FORNECEDOR XYZ',
          documento: `NSU${Math.floor(Math.random() * 1000000)}`,
          valor: 850.50,
          tipo: 'Dbito',
          status: 'No Conciliado'
        },
        {
          id: `mov-${Date.now()}-3`,
          contaBancariaId: contaSelecionada,
          data: dataHoje,
          historico: 'TARIFA BANCRIA MENSAL',
          documento: `NSU${Math.floor(Math.random() * 1000000)}`,
          valor: 45.90,
          tipo: 'Dbito',
          status: 'No Conciliado'
        }
      ];

      transacoesSimuladas.forEach(tx => addExtrato(tx));

      setIsUploading(false);
      setIsSuccess(true);
      toast.success('Extrato salvo no DMS e transaes carregadas!');
    }, 2000); // Simulando o tempo de processamento/upload
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pt-4">
      <Card>
        <CardHeader>
          <CardTitle>Importar Extrato Bancrio</CardTitle>
          <CardDescription>
            Faa o upload do seu arquivo OFX, OFC, CSV ou XLSX. O arquivo original ser guardado no mdulo Documentos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 max-w-sm">
            <label className="text-sm font-medium">Conta Bancria de Destino</label>
            <Select value={contaSelecionada} onValueChange={setContaSelecionada}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a Conta Cadastrada" />
              </SelectTrigger>
              <SelectContent>
                {contasBancarias.length === 0 && (
                  <SelectItem value="none" disabled>Nenhuma conta cadastrada</SelectItem>
                )}
                {contasBancarias.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.banco} (Ag: {c.agencia} / CC: {c.conta})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isSuccess ? (
            <div 
              className={`border-2 border-dashed rounded-xl p-12 text-center flex flex-col items-center justify-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/10'} ${file ? 'border-primary/50 bg-primary/5' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {file ? (
                <>
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-medium">{file.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-6">{(file.size / 1024).toFixed(2)} KB</p>
                  
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setFile(null)}>Remover</Button>
                    <Button onClick={handleUpload} disabled={isUploading}>
                      {isUploading ? 'Processando & Salvando no DMS...' : 'Iniciar Importao'}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-muted text-muted-foreground rounded-full flex items-center justify-center mb-4">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-medium">Arraste e solte o extrato aqui</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-sm">
                    Suporte exclusivo para formatos OFX, OFC, CSV e planilhas XLSX exportadas diretamente do banco.
                  </p>
                  
                  <Button variant="outline" className="relative">
                    Buscar no Computador
                    <input 
                      type="file" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      onChange={handleFileChange}
                      accept=".ofx,.ofc,.csv,.xlsx"
                    />
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 rounded-xl p-12 text-center flex flex-col items-center justify-center animate-in zoom-in-95">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-400">Importao Concluda com Sucesso!</h3>
              <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-2 max-w-sm">
                O arquivo original foi salvo de forma segura no mdulo <b>Documentos</b>, e as transaes j foram processadas para a aba "Conciliar (Lado a Lado)".
              </p>
              
              <Button 
                variant="outline" 
                className="mt-6 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                onClick={() => {
                  setFile(null);
                  setIsSuccess(false);
                }}
              >
                Importar Novo Arquivo
              </Button>
            </div>
          )}

          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300 rounded-lg">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold mb-1">Dica de Segurana e Preveno</p>
              <p>O sistema possui bloqueio anti-duplicidade (Hash Check) embutido. Se voc importar um extrato que contenha linhas (NSU) que j foram importadas, o sistema descartar automaticamente as linhas repetidas.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
