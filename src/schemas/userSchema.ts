import { z } from 'zod';

export const userSchema = z.object({
  id: z.union([z.string().uuid(), z.literal('')]).optional(),
  tenantId: z.union([z.string().uuid(), z.literal('')]).optional(),
  keycloakSub: z.string().optional(),
  authUserId: z.string().optional(),
  nome: z.string().min(1, 'Nome é obrigatório'),
  nomeExibicao: z.string().optional(),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().optional(),
  foto: z.string().optional(),
  cargo: z.string().optional().default('Usuário'),
  departamento: z.string().optional().default('Geral'),
  matricula: z.string().optional(),
  status: z.enum(['Ativo', 'Inativo', 'Bloqueado']).default('Ativo'),
  perfil: z.string().default('Financeiro'),
  rolesComplementares: z.array(z.string()).default([]),
  mfaHabilitado: z.boolean().default(false),
  ultimoLogin: z.string().optional(),
  tentativasFalhas: z.number().default(0),
  permissoes: z.record(z.any()).optional().default({}),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const activeUserSchema = z.object({
  id: z.string(),
  nome: z.string(),
  email: z.string(),
  cargo: z.string().optional(),
  departamento: z.string().optional(),
  perfil: z.string().optional(),
  foto: z.string().optional(),
  tenantId: z.string().optional(),
});

export type UserDTO = z.infer<typeof userSchema>;
export type ActiveUserDTO = z.infer<typeof activeUserSchema>;
