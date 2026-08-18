import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  PenLine, 
  FileCheck, 
  Clock, 
  ShieldCheck, 
  FilePlus, 
  Landmark, 
  Award, 
  ArrowUpRight, 
  AlertCircle,
  FileSignature
} from "lucide-react";
import { DocumentoAssinatura } from '../types';

interface AssinaturasDashboardProps {
  documentos: DocumentoAssinatura[];
  onNovoDocumento: () => void;
  onVerDocumentos: () => void;
}

export function AssinaturasDashboard({ documentos, onNovoDocumento, onVerDocumentos }: AssinaturasDashboardProps) {
  const total = documentos.length;
  const assinados = documentos.filter(d => d.status === 'Assinado').length;
  const aguardando = documentos.filter(d => d.status === 'Aguardando Assinatura' || d.status === 'Pendente').length;
  const govBrCount = documentos.filter(d => (d?.tipoAssinaturaExigida || '').includes('Gov.br')).length;
  const icpBrasilCount = documentos.filter(d => (d?.tipoAssinaturaExigida || '').includes('ICP-Brasil')).length;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Banner Hero - Minimalist & Clean */}
      <div className="rounded-2xl border bg-card p-6 md:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" /> Focus Sign • Validade Jurídica MP nº 2.200-2/2001
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Assinaturas Eletrônicas & Certificação Digital
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">
              Assine e solicite assinaturas com suporte nativo a <strong className="text-foreground font-medium">Assinatura Simples</strong>, <strong className="text-foreground font-medium">Gov.br (Prata/Ouro)</strong> e <strong className="text-foreground font-medium">Certificados ICP-Brasil (A1/A3)</strong>.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium gap-2 shadow-xs" onClick={onNovoDocumento}>
              <FilePlus className="w-4 h-4" /> Enviar Documento
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-all border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Documentos</CardTitle>
            <PenLine className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">Registros no cofre digital</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aguardando Assinatura</CardTitle>
            <Clock className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{aguardando}</div>
            <p className="text-xs text-muted-foreground mt-1">Pendentes de terceiros ou você</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Concluídos & Assinados</CardTitle>
            <FileCheck className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{assinados}</div>
            <p className="text-xs text-muted-foreground mt-1">Com carimbo de tempo e hash</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all border-l-4 border-l-cyan-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gov.br & ICP-Brasil</CardTitle>
            <Award className="w-4 h-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{govBrCount + icpBrasilCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Assinaturas qualificadas/avançadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Modalidades & Destaques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Documentos Recentes</CardTitle>
              <CardDescription>Acompanhe o status em tempo real do fluxo de assinaturas</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-1 text-primary" onClick={onVerDocumentos}>
              Ver Todos <ArrowUpRight className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documentos.slice(0, 4).map((doc) => (
                <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border bg-card/60 hover:bg-accent/40 transition-colors gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <FileSignature className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm line-clamp-1">{doc.titulo}</h4>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <span>{doc.categoria}</span>
                        <span>•</span>
                        <span className="font-mono">{doc.codigoValidacao}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <Badge variant="outline" className="text-xs font-normal">
                      {doc.tipoAssinaturaExigida}
                    </Badge>
                    <Badge className={
                      doc.status === 'Assinado' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                      doc.status === 'Aguardando Assinatura' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                      'bg-slate-500/10 text-slate-600'
                    }>
                      {doc.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Modalidades Suportadas */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Landmark className="w-5 h-5 text-primary" /> Níveis de Assinatura
            </CardTitle>
            <CardDescription>Conformidade total com a Lei nº 14.063/2020</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg border bg-muted/40 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-foreground">
                <span>1. Eletrônica Simples</span>
                <Badge variant="outline" className="text-[10px]">Padrão</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Desenho na tela, token por e-mail/SMS, IP, geolocalização e carimbo temporal.</p>
            </div>

            <div className="p-3 rounded-lg border bg-emerald-500/5 border-emerald-500/20 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <span>2. Gov.br (Avançada)</span>
                <Badge className="bg-emerald-500 text-white text-[10px]">Oficial</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Autenticação oficial via conta Gov.br (Prata ou Ouro) com certificado governamental.</p>
            </div>

            <div className="p-3 rounded-lg border bg-cyan-500/5 border-cyan-500/20 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-cyan-700 dark:text-cyan-400">
                <span>3. ICP-Brasil (Qualificada)</span>
                <Badge className="bg-cyan-600 text-white text-[10px]">A1 / A3</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Certificados digitais pessoa física ou jurídica emitidos por ACs autorizadas ITI.</p>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
