export type CategoriaAgenda = 
  | 'Recebimento' 
  | 'Recorrência'
  | 'Pagamento' 
  | 'Imposto' 
  | 'Contrato' 
  | 'Projeto' 
  | 'Obrigação Fiscal' 
  | 'Renovação';

export type StatusAgenda = 
  | 'Previsto' 
  | 'Pago' 
  | 'Recebido' 
  | 'Em Aberto' 
  | 'Vencido' 
  | 'Cancelado' 
  | 'Reagendado' 
  | 'Concluído';

export type PrioridadeAgenda = 'Alta' | 'Média' | 'Baixa';

export type ModuloOrigemAgenda = 
  | 'Contas a Receber' 
  | 'Contas a Pagar' 
  | 'Contratos' 
  | 'Projetos' 
  | 'Fiscal' 
  | 'Clientes' 
  | 'Recorrência';

export interface EventoFinanceiro {
  id: string;
  titulo: string;
  categoria: CategoriaAgenda;
  data: string; // ISO Date String (YYYY-MM-DD)
  hora?: string; // HH:mm format (para timeline)
  valor?: number; 
  
  // Relacionamentos MDM
  entidadeVinculo?: string; // Nome direto para simplificar a view
  clienteId?: string;
  fornecedorId?: string;
  projetoId?: string;
  contratoId?: string;
  centroCustoId?: string;
  
  status: StatusAgenda;
  prioridade: PrioridadeAgenda;
  observacoes?: string;

  // Metadados do Módulo de Origem (Para o comportamento Read-Only e Redirecionamento)
  moduloOrigem: ModuloOrigemAgenda;
  linkOrigem: string; // Ex: /clientes ou /contas-a-receber
}
