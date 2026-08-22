import { z } from 'zod';

export const enderecoSchema = z.object({
  cep: z.string().default(''),
  logradouro: z.string().default(''),
  numero: z.string().default(''),
  complemento: z.string().optional().default(''),
  bairro: z.string().default(''),
  cidade: z.string().default('São Paulo'),
  estado: z.string().default('SP'),
  pais: z.string().default('Brasil'),
});

export const contatoSchema = z.object({
  id: z.string().optional(),
  nome: z.string().default('Contato Principal'),
  cargo: z.string().default('Responsável'),
  departamento: z.string().default('Geral'),
  telefone: z.string().optional().default(''),
  celular: z.string().default(''),
  whatsapp: z.boolean().default(true),
  email: z.string().optional().default(''),
  principal: z.boolean().default(true),
});

export const clienteSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().optional(),
  codigo: z.string().min(1, 'Código é obrigatório'),
  tipo: z.enum(['Pessoa Física', 'Pessoa Jurídica']).default('Pessoa Jurídica'),
  razaoSocial: z.string().min(1, 'Razão social é obrigatória'),
  nomeFantasia: z.string().min(1, 'Nome fantasia é obrigatório'),
  documento: z.string().min(1, 'Documento (CPF/CNPJ) é obrigatório'),
  inscricaoEstadual: z.string().optional().default(''),
  inscricaoMunicipal: z.string().optional().default(''),
  dataFundacaoNascimento: z.string().optional().default(''),
  status: z.enum(['Ativo', 'Inativo']).default('Ativo'),
  segmento: z.string().default('Geral'),
  porteEmpresa: z.string().optional().default(''),
  site: z.string().optional().default(''),
  observacoes: z.string().optional().default(''),
  endereco: enderecoSchema,
  contatos: z.array(contatoSchema).default([]),
  dataCadastro: z.string().optional(),
  ultimaAtualizacao: z.string().optional(),
});

export type ClienteDTO = z.infer<typeof clienteSchema>;
export type ContatoDTO = z.infer<typeof contatoSchema>;
export type EnderecoDTO = z.infer<typeof enderecoSchema>;
