import { z } from 'zod';

export const metodoPagamentoSchema = z.object({
  formaPagamento: z.enum([
    'PIX',
    'Transferência Bancária (TED/DOC)',
    'Depósito em Conta',
    'Boleto',
  ]).default('PIX'),
  tipoChavePix: z.enum(['CPF', 'CNPJ', 'E-mail', 'Telefone', 'Chave Aleatória']).optional(),
  chavePix: z.string().optional(),
  banco: z.string().optional(),
  agencia: z.string().optional(),
  conta: z.string().optional(),
  tipoConta: z.enum(['Conta Corrente', 'Conta Poupança', 'Conta Pagamento']).optional(),
  titularConta: z.string().optional(),
});

export const documentoAnexoRhSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  nome: z.string(),
  categoria: z.string().default('Geral'),
  tamanho: z.string().default('1.0 MB'),
  dataUpload: z.string().default(() => new Date().toISOString()),
  urlConteudo: z.string().optional(),
  dmsDocumentoId: z.string().optional(),
});

export const colaboradorSchema = z.object({
  id: z.string().optional(),
  matricula: z.string().min(1, 'Matrícula é obrigatória'),
  foto: z.string().optional(),
  fotoUrl: z.string().optional(),
  avatarUrl: z.string().optional(),
  fotoBase64: z.string().optional(),
  nomeCompleto: z.string().min(1, 'Nome completo é obrigatório'),
  nomeSocial: z.string().optional(),
  cpf: z.string().min(1, 'CPF é obrigatório'),
  rg: z.string().optional(),
  dataNascimento: z.string().default('1990-01-01'),
  emailCorporativo: z.string().email('E-mail corporativo inválido').or(z.string().default('')),
  emailPessoal: z.string().optional(),
  telefone: z.string().default(''),
  cargo: z.string().min(1, 'Cargo é obrigatório'),
  departamento: z.string().default('Tecnologia'),
  setor: z.string().optional(),
  centroCusto: z.string().optional(),
  gestorImediatoId: z.string().optional(),
  gestorImediatoNome: z.string().optional(),
  dataAdmissao: z.string().default(() => new Date().toISOString().split('T')[0]),
  tipoContrato: z.enum(['CLT', 'PJ', 'Estágio', 'Jovem Aprendiz', 'Freelancer']).default('CLT'),
  regime: z.enum(['Presencial', 'Híbrido', 'Remoto']).default('Híbrido'),
  salarioBase: z.number().nonnegative().default(0),
  jornadaTrabalho: z.string().optional(),
  status: z.enum(['Ativo', 'Inativo', 'Férias', 'Afastado', 'Em Experiência']).default('Ativo'),
  metodoPagamento: metodoPagamentoSchema.default({ formaPagamento: 'PIX' }),
  documentos: z.array(documentoAnexoRhSchema).default([]),
});

export type ColaboradorDTO = z.infer<typeof colaboradorSchema>;
