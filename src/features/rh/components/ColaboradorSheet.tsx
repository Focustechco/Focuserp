import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Briefcase, FileText, HeartPulse, GraduationCap, Laptop, Save } from 'lucide-react';

import { AbaPessoais } from './abas/AbaPessoais';
import { AbaProfissionais } from './abas/AbaProfissionais';
import { AbaDocumentosRh } from './abas/AbaDocumentosRh';
import { AbaBeneficios } from './abas/AbaBeneficios';
import { AbaTreinamentos } from './abas/AbaTreinamentos';
import { AbaEquipamentos } from './abas/AbaEquipamentos';

import { useColaboradoresQuery } from '../hooks/useColaboradoresQuery';
import { Colaborador, FormaPagamentoRH, DocumentoAnexoRh } from '../types';
import { useDocumentosStore } from '@/features/documentos/hooks/useDocumentosStore';
import { useNotificacoesStore } from '@/features/notificacoes/useNotificacoesStore';
import { toast } from 'sonner';

interface ColaboradorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colaboradorParaEditar?: Colaborador | null;
}

export function ColaboradorSheet({ open, onOpenChange, colaboradorParaEditar }: ColaboradorSheetProps) {
  // Foto & Aba Pessoais
  const [foto, setFoto] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [nomeSocial, setNomeSocial] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [emailCorporativo, setEmailCorporativo] = useState('');

  // Método de Pagamento
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamentoRH>('PIX');
  const [tipoChavePix, setTipoChavePix] = useState('CPF');
  const [chavePix, setChavePix] = useState('');
  const [banco, setBanco] = useState('Itaú Unibanco');
  const [agencia, setAgencia] = useState('');
  const [conta, setConta] = useState('');
  const [tipoConta, setTipoConta] = useState('Conta Corrente');
  const [titularConta, setTitularConta] = useState('');

  // Aba Profissionais
  const [dataAdmissao, setDataAdmissao] = useState('');
  const [tipoContrato, setTipoContrato] = useState<'CLT' | 'PJ' | 'Estágio' | 'Jovem Aprendiz' | 'Freelancer'>('CLT');
  const [cargo, setCargo] = useState('');
  const [departamento, setDepartamento] = useState('Tecnologia');
  const [centroCusto, setCentroCusto] = useState('');
  const [gestorImediatoNome, setGestorImediatoNome] = useState('Adriano Leal');
  const [regime, setRegime] = useState<'Presencial' | 'Híbrido' | 'Remoto'>('Presencial');
  const [salarioBase, setSalarioBase] = useState('7500');
  const [jornadaTrabalho, setJornadaTrabalho] = useState('Seg a Sex 09:00 às 18:00');
  const [status, setStatus] = useState<'Ativo' | 'Inativo' | 'Férias' | 'Afastado' | 'Em Experiência'>('Ativo');

  // Aba Documentos
  const [documentos, setDocumentos] = useState<DocumentoAnexoRh[]>([]);

  const { saveColaborador } = useColaboradoresQuery();
  const { pastas, createFolder, uploadDocument } = useDocumentosStore();
  const { notificar } = useNotificacoesStore();

  useEffect(() => {
    if (colaboradorParaEditar) {
      setFoto(colaboradorParaEditar.foto || '');
      setNomeCompleto(colaboradorParaEditar.nomeCompleto || '');
      setNomeSocial(colaboradorParaEditar.nomeSocial || '');
      setCpf(colaboradorParaEditar.cpf || '');
      setRg(colaboradorParaEditar.rg || '');
      setDataNascimento(colaboradorParaEditar.dataNascimento || '');
      setTelefone(colaboradorParaEditar.telefone || '');
      setEmailCorporativo(colaboradorParaEditar.emailCorporativo || '');

      setFormaPagamento(colaboradorParaEditar.metodoPagamento?.formaPagamento || 'PIX');
      setTipoChavePix(colaboradorParaEditar.metodoPagamento?.tipoChavePix || 'CPF');
      setChavePix(colaboradorParaEditar.metodoPagamento?.chavePix || '');
      setBanco(colaboradorParaEditar.metodoPagamento?.banco || 'Itaú Unibanco');
      setAgencia(colaboradorParaEditar.metodoPagamento?.agencia || '');
      setConta(colaboradorParaEditar.metodoPagamento?.conta || '');
      setTipoConta(colaboradorParaEditar.metodoPagamento?.tipoConta || 'Conta Corrente');
      setTitularConta(colaboradorParaEditar.metodoPagamento?.titularConta || colaboradorParaEditar.nomeCompleto || '');

      setDataAdmissao(colaboradorParaEditar.dataAdmissao || '');
      setTipoContrato((colaboradorParaEditar.tipoContrato || 'CLT') as any);
      setCargo(colaboradorParaEditar.cargo || '');
      setDepartamento(colaboradorParaEditar.departamento || 'Tecnologia');
      setGestorImediatoNome(colaboradorParaEditar.gestorImediatoNome || 'Adriano Leal');
      setRegime((colaboradorParaEditar.regime || 'Presencial') as any);
      setSalarioBase(colaboradorParaEditar.salarioBase ? String(colaboradorParaEditar.salarioBase) : '7500');
      setStatus((colaboradorParaEditar.status || 'Ativo') as any);

      setDocumentos(colaboradorParaEditar.documentos || []);
    } else {
      setFoto('');
      setNomeCompleto('');
      setNomeSocial('');
      setCpf('');
      setRg('');
      setDataNascimento('');
      setTelefone('');
      setEmailCorporativo('');
      setChavePix('');
      setTitularConta('');
      setAgencia('');
      setConta('');
      setCargo('');
      setDataAdmissao(new Date().toISOString().split('T')[0]);
      setStatus('Ativo');
      setDocumentos([]);
    }
  }, [colaboradorParaEditar, open]);

  const handleSave = () => {
    const colabNome = nomeCompleto.trim() || 'Novo Colaborador';
    
    // Auto-criação da pasta no DMS
    const pastaRhExiste = pastas.find(p => p.caminhoCompleto === '/RH' || p.nome === 'RH');
    let rhFolderId = pastaRhExiste ? pastaRhExiste.id : undefined;

    if (!pastaRhExiste) {
      rhFolderId = createFolder('RH', undefined, 'RH & Gestão de Pessoas', 'rh');
    }

    const subPastaNome = colabNome;
    const subPastaExiste = pastas.find(p => p.caminhoCompleto === `/RH/${subPastaNome}` || (p.nome === subPastaNome && p.parentId === rhFolderId));
    
    let colabFolderId = subPastaExiste ? subPastaExiste.id : undefined;
    if (!subPastaExiste) {
      colabFolderId = createFolder(subPastaNome, rhFolderId, `Pasta de documentos do colaborador ${colabNome}`, 'rh');
    }

    // Auto-criação de arquivos no DMS para cada documento adicionado
    documentos.forEach((doc) => {
      const docJaExiste = false;
      if (!docJaExiste) {
        uploadDocument({
          nome: doc.nome,
          formato: (doc.formato || 'PDF') as any,
          tamanhoBytes: doc.tamanhoBytes || 1024 * 350,
          pastaId: colabFolderId,
          categoria: 'Documentos Pessoais',
          moduloVinculado: 'rh',
          tags: ['RH', 'Colaborador', colabNome, doc.tipo],
          urlDownload: doc.urlDownload || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=800&auto=format&fit=crop&q=60',
          versaoAtual: 1,
          confidencial: true
        });
      }
    });

    const novoColab: Partial<Colaborador> = {
      id: colaboradorParaEditar ? colaboradorParaEditar.id : crypto.randomUUID(),
      nomeCompleto: colabNome,
      nomeSocial: nomeSocial.trim() || undefined,
      cpf: cpf.trim() || '000.000.000-00',
      rg: rg.trim() || undefined,
      dataNascimento: dataNascimento || undefined,
      telefone: telefone.trim() || undefined,
      emailCorporativo: emailCorporativo.trim() || `${colabNome.toLowerCase().replace(/\s+/g, '.')}@focustecnologia.com.br`,
      foto: foto.trim() || undefined,
      matricula: colaboradorParaEditar?.matricula || `FC-${Math.floor(1000 + Math.random() * 9000)}`,
      cargo: cargo.trim() || 'Desenvolvedor Full Stack',
      departamento: departamento || 'Tecnologia',
      gestorImediatoNome: gestorImediatoNome || 'Adriano Leal',
      tipoContrato: tipoContrato || 'CLT',
      regime: regime || 'Presencial',
      dataAdmissao: dataAdmissao || new Date().toISOString().split('T')[0],
      salarioBase: parseFloat(salarioBase) || 7500,
      jornadaTrabalho: jornadaTrabalho || 'Seg a Sex 09:00 às 18:00',
      status: status || 'Ativo',
      metodoPagamento: {
        formaPagamento,
        tipoChavePix: formaPagamento === 'PIX' ? (tipoChavePix as any) : undefined,
        chavePix: formaPagamento === 'PIX' ? (chavePix.trim() || cpf.trim()) : undefined,
        banco: banco.trim() || 'Itaú Unibanco',
        agencia: agencia.trim(),
        conta: conta.trim(),
        tipoConta: tipoConta as any,
        titularConta: titularConta.trim() || colabNome
      },
      documentos
    };

    saveColaborador(novoColab as any);
    toast.success(`Colaborador "${colabNome}" salvo com sucesso!`);

    // Disparar Notificação Real
    notificar({
      titulo: `Novo Colaborador no RH: ${novoColab.nomeCompleto}`,
      descricao: `Perfil de ${novoColab.cargo} registrado em ${novoColab.departamento}. Pasta DMS criada em /RH/${novoColab.nomeCompleto}.`,
      origem: 'RH',
      tipo: 'Sucesso',
      prioridade: 'Alta',
      targetUrl: '/rh',
      responsavel: gestorImediatoNome || 'Você'
    });

    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[920px] w-[95vw] p-0 flex flex-col h-full border-l shadow-2xl bg-background">
        
        <div className="px-6 py-4 border-b shrink-0 flex items-center justify-between bg-muted/20">
          <SheetHeader className="text-left">
            <SheetTitle className="text-xl flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              {colaboradorParaEditar ? `Editar Perfil de ${colaboradorParaEditar.nomeCompleto}` : 'Novo Colaborador RH'}
            </SheetTitle>
            <SheetDescription>
              Gestão do colaborador, foto de perfil, método de pagamento e arquivos no DMS.
            </SheetDescription>
          </SheetHeader>
        </div>

        <Tabs defaultValue="pessoais" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-4 shrink-0 overflow-x-auto scrollbar-hide border-b bg-card">
            <TabsList className="w-full justify-start rounded-none h-auto p-0 bg-transparent gap-4">
              <TabsTrigger value="pessoais" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2.5 pt-0 gap-2 font-medium"><User className="w-4 h-4" /> Pessoais & Pagamento</TabsTrigger>
              <TabsTrigger value="profissionais" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2.5 pt-0 gap-2 font-medium"><Briefcase className="w-4 h-4" /> Profissionais</TabsTrigger>
              <TabsTrigger value="documentos" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2.5 pt-0 gap-2 font-medium"><FileText className="w-4 h-4" /> Documentos ({documentos.length})</TabsTrigger>
              <TabsTrigger value="equipamentos" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2.5 pt-0 gap-2 font-medium"><Laptop className="w-4 h-4" /> Equipamentos</TabsTrigger>
              <TabsTrigger value="beneficios" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2.5 pt-0 gap-2 font-medium"><HeartPulse className="w-4 h-4" /> Benefícios</TabsTrigger>
              <TabsTrigger value="treinamentos" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2.5 pt-0 gap-2 font-medium"><GraduationCap className="w-4 h-4" /> Treinamentos</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 px-6 h-full">
            <TabsContent value="pessoais" className="mt-0 h-full">
              <AbaPessoais
                foto={foto} setFoto={setFoto}
                nomeCompleto={nomeCompleto} setNomeCompleto={setNomeCompleto}
                nomeSocial={nomeSocial} setNomeSocial={setNomeSocial}
                cpf={cpf} setCpf={setCpf}
                rg={rg} setRg={setRg}
                dataNascimento={dataNascimento} setDataNascimento={setDataNascimento}
                telefone={telefone} setTelefone={setTelefone}
                emailCorporativo={emailCorporativo} setEmailCorporativo={setEmailCorporativo}
                formaPagamento={formaPagamento} setFormaPagamento={setFormaPagamento}
                tipoChavePix={tipoChavePix} setTipoChavePix={setTipoChavePix}
                chavePix={chavePix} setChavePix={setChavePix}
                banco={banco} setBanco={setBanco}
                agencia={agencia} setAgencia={setAgencia}
                conta={conta} setConta={setConta}
                tipoConta={tipoConta} setTipoConta={setTipoConta}
                titularConta={titularConta} setTitularConta={setTitularConta}
              />
            </TabsContent>

            <TabsContent value="profissionais" className="mt-0 h-full">
              <AbaProfissionais
                dataAdmissao={dataAdmissao} setDataAdmissao={setDataAdmissao}
                tipoContrato={tipoContrato} setTipoContrato={(v: any) => setTipoContrato(v)}
                cargo={cargo} setCargo={setCargo}
                departamento={departamento} setDepartamento={setDepartamento}
                centroCusto={centroCusto} setCentroCusto={setCentroCusto}
                gestorImediatoNome={gestorImediatoNome} setGestorImediatoNome={setGestorImediatoNome}
                regime={regime} setRegime={(v: any) => setRegime(v)}
                salarioBase={salarioBase} setSalarioBase={setSalarioBase}
                jornadaTrabalho={jornadaTrabalho} setJornadaTrabalho={setJornadaTrabalho}
                status={status} setStatus={(v: any) => setStatus(v)}
              />
            </TabsContent>

            <TabsContent value="documentos" className="mt-0 h-full">
              <AbaDocumentosRh
                documentos={documentos}
                setDocumentos={setDocumentos}
                nomeColaborador={nomeCompleto}
              />
            </TabsContent>

            <TabsContent value="equipamentos" className="mt-0 h-full"><AbaEquipamentos /></TabsContent>
            <TabsContent value="beneficios" className="mt-0 h-full"><AbaBeneficios /></TabsContent>
            <TabsContent value="treinamentos" className="mt-0 h-full"><AbaTreinamentos /></TabsContent>
          </ScrollArea>
        </Tabs>

        <SheetFooter className="px-6 py-4 border-t bg-muted/10 shrink-0">
          <div className="flex w-full justify-between items-center">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button className="gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold" onClick={handleSave}>
              <Save className="w-4 h-4" /> Salvar Perfil do Colaborador
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
