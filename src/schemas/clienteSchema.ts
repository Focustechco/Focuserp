import { z } from 'zod';

export const enderecoSchema = z.object({
  cep: z.string().default(''),
  logradouro: z.string().default(''),
  numero: z.string().default(''),
  complemento: z.string().optional(),
  bairro: z.string().default(''),
  cidade: z.string().default('São Paulo'),
  estado: z.string().default('SP'),
  pais: z.string().default('Brasil'),
});

export const contatoSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1, 'Nome do contato é obrigatório'),
  cargo: z.string().default('Responsável'),
  departamento: z.string().default('Geral'),
  telefone: z.string().optional(),
  celular: z.string().default(''),
  whatsapp: z.boolean().default(true),
  email: z.union([z.string().email('E-mail do contato é inválido'), z.literal('')]).optional().default(''),
  principal: z.boolean().default(false),
});

export const clienteSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().optional(),
  codigo: z.string().min(1, 'Código é obrigatório'),
  tipo: z.enum(['Pessoa Física', 'Pessoa Jurídica']).default('Pessoa Jurídica'),
  razaoSocial: z.string().min(1, 'Razão social é obrigatória'),
  nomeFantasia: z.string().min(1, 'Nome fantasia é obrigatório'),
  documento: z.string().min(1, 'Documento (CPF/CNPJ) é obrigatório'),
  inscricaoEstadual: z.string().optional(),
  inscricaoMunicipal: z.string().optional(),
  dataFundacaoNascimento: z.string().optional(),
  status: z.enum(['Ativo', 'Inativo']).default('Ativo'),
  segmento: z.string().default('Geral'),
  porteEmpresa: z.string().optional(),
  site: z.string().optional(),
  observacoes: z.string().optional(),
  endereco: enderecoSchema,
  contatos: z.array(contatoSchema).default([]),
  dataCadastro: z.string().optional(),
  ultimaAtualizacao: z.string().optional(),
});

export type ClienteDTO = z.infer<typeof clienteSchema>;
export type ContatoDTO = z.infer<typeof contatoSchema>;
export type EnderecoDTO = z.infer<typeof enderecoSchema>;
