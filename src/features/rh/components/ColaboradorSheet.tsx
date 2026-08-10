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
import { User, Briefcase, FileText, HeartPulse, Palmtree, GraduationCap, Target, Laptop, UserPlus, LogOut, History, Save } from 'lucide-react';

import { AbaPessoais } from './abas/AbaPessoais';
import { AbaProfissionais } from './abas/AbaProfissionais';
import { AbaDocumentosRh } from './abas/AbaDocumentosRh';
import { AbaBeneficios } from './abas/AbaBeneficios';
import { AbaFerias } from './abas/AbaFerias';
import { AbaTreinamentos } from './abas/AbaTreinamentos';
import { AbaAvaliacoes } from './abas/AbaAvaliacoes';
import { AbaEquipamentos } from './abas/AbaEquipamentos';

import { useColaboradoresQuery } from '../hooks/useColaboradoresQuery';
import { Colaborador, FormaPagamentoRH, DocumentoAnexoRh, FormatoArquivo } from '../types';
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

  // Mtodo de Pagamento
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamentoRH>('PIX');
  const [tipoChavePix, setTipoChavePix] = useState('CPF');
  const [chavePix, setChavePix] = useState('');
  const [banco, setBanco] = useState('Ita Unibanco');
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
  const [jornadaTrabalho, setJornadaTrabalho] = useState('Seg a Sex 09:00 s 18:00');
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
      setBanco(colaboradorParaEditar.metodoPagamento?.banco || 'Ita Unibanco');
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
      setDocumentos([]);
    }
  }, [colaboradorParaEditar, open]);

  // SALVAMENTO GARANTIDO COM INTEGRAO DMS E SUPORTE A FOTO
  const handleSave = () => {
    if (!nomeCompleto.trim()) {
      toast.error("Por favor, preencha o Nome Completo do colaborador.");
      return;
    }
    if (!cargo.trim()) {
      toast.error("Por favor, informe o Cargo do colaborador na aba Profissionais.");
      return;
    }

    const colabNome = nomeCompleto.trim();
    const emailFinal = emailCorporativo.trim() || `${colabNome.toLowerCase().replace(/\s+/g, '.')}@focustecnologia.com.br`;

    // Integrao com Pasta DMS /RH/{NomeColaborador}
    const caminhoDmsEsperado = `/RH/${colabNome}`;
    let pastaRhColab = pastas.find(p => p.caminhoCompleto === caminhoDmsEsperado || p.nome === colabNome);

    if (!pastaRhColab) {
      const pastaPaiRh = pastas.find(p => p.id === 'p-rh' || p.caminhoCompleto === '/RH');
      const parentId = pastaPaiRh ? pastaPaiRh.id : null;
      createFolder(colabNome, parentId, 'RH');
      pastaRhColab = pastas.find(p => p.nome === colabNome) || { id: 'p-rh', caminhoCompleto: caminhoDmsEsperado } as any;
    }

    const pastaIdFinal = pastaRhColab?.id || 'p-rh';

    // Salvar os documentos anexados na pasta do DMS
    documentos.forEach(doc => {
      const ext = doc.nome.split('.').pop()?.toLowerCase() as FormatoArquivo || 'pdf';
      uploadDocument({
        nome: doc.nome,
        extensao: ext,
        tamanho: doc.tamanho || '1.5 MB',
        tamanhoBytes: 1500000,
        pastaId: pastaIdFinal,
        moduloOrigem: 'RH',
        categoria: doc.categoria || 'Documentos de RH',
        tags: ['RH', colabNome, doc.categoria],
        urlConteudo: doc.urlConteudo
      });
    });

    // Montar objeto final do colaborador
    const novoColab: Colaborador = {
      id: colaboradorParaEditar ? colaboradorParaEditar.id : `colab-${Date.now()}`,
      matricula: colaboradorParaEditar ? colaboradorParaEditar.matricula : `COL-${Math.floor(100 + Math.random() * 900)}`,
      foto: foto.trim(),
      nomeCompleto: colabNome,
      nomeSocial: nomeSocial.trim(),
      cpf: cpf.trim() || '000.000.000-00',
      rg: rg.trim(),
      dataNascimento: dataNascimento || new Date().toISOString().split('T')[0],
      emailCorporativo: emailFinal,
      telefone: telefone.trim() || '(11) 99999-9999',
      cargo: cargo.trim(),
      departamento: departamento.trim() || 'Tecnologia',
      setor: departamento || 'Tecnologia',
      centroCusto: centroCusto || `CC-${departamento}`,
      gestorImediatoNome: gestorImediatoNome || 'Adriano Leal',
      dataAdmissao: dataAdmissao || new Date().toISOString().split('T')[0],
      tipoContrato: tipoContrato || 'CLT',
      regime: regime || 'Presencial',
      salarioBase: salarioBase ? parseFloat(salarioBase) : 7500,
      jornadaTrabalho: jornadaTrabalho || 'Seg a Sex 09:00 s 18:00',
      status: status || 'Ativo',
      metodoPagamento: {
        formaPagamento,
        tipoChavePix: formaPagamento === 'PIX' ? (tipoChavePix as any) : undefined,
        chavePix: formaPagamento === 'PIX' ? (chavePix.trim() || cpf.trim()) : undefined,
        banco: banco.trim() || 'Ita Unibanco',
        agencia: agencia.trim(),
        conta: conta.trim(),
        tipoConta: tipoConta as any,
        titularConta: titularConta.trim() || colabNome
      },
      documentos
    };

    saveColaborador(novoColab as any);
    toast.success(`Colaborador "${colabNome}" salvo com sucesso!`);

    // Disparar Notificao Real
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
              Gesto do colaborador, foto de perfil, mtodo de pagamento e arquivos no DMS.
            </SheetDescription>
          </SheetHeader>
        </div>

        <Tabs defaultValue="pessoais" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-4 shrink-0 overflow-x-auto scrollbar-hide border-b bg-card">
            <TabsList className="w-full justify-start rounded-none h-auto p-0 bg-transparent gap-4">
              <TabsTrigger value="pessoais" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2.5 pt-0 gap-2"><User className="w-4 h-4" /> Pessoais & Pagamento</TabsTrigger>
              <TabsTrigger value="profissionais" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2.5 pt-0 gap-2"><Briefcase className="w-4 h-4" /> Profissionais</TabsTrigger>
              <TabsTrigger value="documentos" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2.5 pt-0 gap-2"><FileText className="w-4 h-4" /> Documentos ({documentos.length})</TabsTrigger>
              <TabsTrigger value="beneficios" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2.5 pt-0 gap-2"><HeartPulse className="w-4 h-4" /> Benefcios</TabsTrigger>
              <TabsTrigger value="ferias" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2.5 pt-0 gap-2"><Palmtree className="w-4 h-4" /> Frias</TabsTrigger>
              <TabsTrigger value="treinamentos" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2.5 pt-0 gap-2"><GraduationCap className="w-4 h-4" /> Treinamentos</TabsTrigger>
              <TabsTrigger value="avaliacoes" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2.5 pt-0 gap-2"><Target className="w-4 h-4" /> Avaliaes</TabsTrigger>
              <TabsTrigger value="equipamentos" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2.5 pt-0 gap-2"><Laptop className="w-4 h-4" /> Equipamentos</TabsTrigger>
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

            <TabsContent value="beneficios" className="mt-0 h-full"><AbaBeneficios /></TabsContent>
            <TabsContent value="ferias" className="mt-0 h-full"><AbaFerias /></TabsContent>
            <TabsContent value="treinamentos" className="mt-0 h-full"><AbaTreinamentos /></TabsContent>
            <TabsContent value="avaliacoes" className="mt-0 h-full"><AbaAvaliacoes /></TabsContent>
            <TabsContent value="equipamentos" className="mt-0 h-full"><AbaEquipamentos /></TabsContent>
          </ScrollArea>
        </Tabs>

        <SheetFooter className="px-6 py-4 border-t bg-muted/10 shrink-0">
          <div className="flex w-full justify-between items-center">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button className="gap-2 bg-orange-600 hover:bg-orange-700 text-white" onClick={handleSave}>
              <Save className="w-4 h-4" /> Salvar Perfil do Colaborador
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
