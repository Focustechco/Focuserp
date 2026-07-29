import { z } from 'zod';

export const fornecedorSchema = z.object({
  id: z.union([z.string().uuid(), z.literal('')]).optional(),
  tenantId: z.union([z.string().uuid(), z.literal('')]).optional(),
  codigo: z.string().optional(),
  razaoSocial: z.string().min(1, 'Razão social é obrigatória'),
  nomeFantasia: z.string().min(1, 'Nome fantasia é obrigatório'),
  cnpj: z.string().min(1, 'CNPJ é obrigatório'),
  email: z.union([z.string().email('E-mail inválido'), z.literal('')]).optional().default(''),
  telefone: z.string().optional().default(''),
  categoria: z.string().default('Geral'),
  status: z.enum(['Ativo', 'Inativo']).default('Ativo'),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional().default('São Paulo'),
  estado: z.string().optional().default('SP'),
  pais: z.string().optional().default('Brasil'),
  observacoes: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type FornecedorDTO = z.infer<typeof fornecedorSchema>;
