import { createFileRoute, Link } from "@tanstack/react-router";
import { useLocalStorageState } from "@/hooks/useDataStore";
import { Contrato } from "@/features/contratos/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Calendar, ShieldAlert, DollarSign, RefreshCw, UserCheck } from "lucide-react";
import { NovoContratoSheet } from "@/features/contratos/components/NovoContratoSheet";
import { differenceInDays } from "date-fns";

export const Route = createFileRoute("/contratos_/$contratoId")({
  component: PerfilContratoPage,
});

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

function PerfilContratoPage() {
  const { contratoId } = Route.useParams();
  const { data: contratos } = useLocalStorageState<Contrato>('focus_contratos');
  const contrato = (contratos || []).find(c => c.id === contratoId);

  if (!contrato) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <h2 className="text-2xl font-bold">Contrato não encontrado</h2>
        <Link to="/contratos">
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Contratos</Button>
        </Link>
      </div>
    );
  }

  const hoje = new Date();
  let diasRestantes = 0;
  if (contrato.dataFinal) {
    diasRestantes = differenceInDays(new Date(contrato.dataFinal), hoje);
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full animate-fade-in">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/contratos">
            <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{contrato.numeroContrato} - {contrato.nome}</h1>
              <Badge variant={contrato.status === 'Vigente' ? 'default' : 'outline'} className={contrato.status === 'Vigente' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                {contrato.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <FileText className="w-4 h-4" /> {contrato.codigo} • {contrato.entidadeVinculo} • {contrato.tipoServico}
            </p>
          </div>
        </div>
        <NovoContratoSheet>
          <Button><RefreshCw className="w-4 h-4 mr-2" /> Gerenciar Contrato</Button>
        </NovoContratoSheet>
      </div>

      {/* EXECUTIVE CARDS */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><DollarSign className="w-4 h-4" /> Valor Total</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(contrato.valorTotal)}</div>
            <div className="text-xs text-muted-foreground font-medium">{contrato.categoria}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4" /> Vigência</div>
            <div className="text-lg font-bold">{new Date(contrato.dataInicial).toLocaleDateString('pt-BR')} a {new Date(contrato.dataFinal).toLocaleDateString('pt-BR')}</div>
            <div className={`text-xs font-medium ${diasRestantes <= 90 && diasRestantes > 0 ? 'text-orange-600' : diasRestantes < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {diasRestantes > 0 ? `Restam ${diasRestantes} dias` : `Vencido há ${Math.abs(diasRestantes)} dias`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Multa & Reajuste</div>
            <div className="text-lg font-bold">Multa {contrato.multaPercentual}%</div>
            <div className="text-xs text-muted-foreground font-medium">Reajuste via {contrato.indiceCorrecao || 'Não Aplicável'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><UserCheck className="w-4 h-4" /> Assinaturas</div>
            <div className="text-lg font-bold">{contrato.assinaturas.filter(a => a.status === 'Assinado').length} de {contrato.assinaturas.length} assinados</div>
            <div className="text-xs text-muted-foreground font-medium">
              {contrato.assinaturas.some(a => a.status === 'Pendente') ? 'Aguardando partes' : 'Totalmente assinado'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div>
               <h4 className="text-sm font-semibold mb-1">Objeto do Contrato</h4>
               <p className="text-sm text-muted-foreground">{contrato.descricao || 'Sem descrição detalhada.'}</p>
             </div>
             <div>
               <h4 className="text-sm font-semibold mb-1">Responsável Interno</h4>
               <p className="text-sm text-muted-foreground">{contrato.responsavelInterno} ({contrato.departamento})</p>
             </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Aditivos ({contrato.aditivos.length})</CardTitle>
          </CardHeader>
          <CardContent>
             {contrato.aditivos.length === 0 ? (
               <div className="text-sm text-muted-foreground text-center py-6">Nenhum aditivo registrado.</div>
             ) : (
               <div className="space-y-4">
                 {contrato.aditivos.map(adi => (
                   <div key={adi.id} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0">
                     <div>
                       <h4 className="text-sm font-medium">Aditivo {adi.numero} - {adi.tipo}</h4>
                       <p className="text-xs text-muted-foreground">{adi.motivo}</p>
                     </div>
                     <div className="text-right">
                       <div className="text-sm font-semibold">{formatCurrency(adi.valorAlterado)}</div>
                       <div className="text-xs text-muted-foreground">{new Date(adi.data).toLocaleDateString('pt-BR')}</div>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
