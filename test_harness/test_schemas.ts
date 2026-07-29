import {
  auditLogSchema,
  clienteSchema,
  cobrancaSchema,
  colaboradorSchema,
  contaPagarSchema,
  contaReceberSchema,
  contratoSchema,
  fornecedorSchema,
  projetoSchema,
  userSchema,
  activeUserSchema,
} from '../src/schemas/index';

const results: Array<{ test: string; status: 'PASS' | 'FAIL'; error?: string; data?: any }> = [];

function assert(testName: string, condition: boolean, detail?: string) {
  if (condition) {
    results.push({ test: testName, status: 'PASS', data: detail });
  } else {
    results.push({ test: testName, status: 'FAIL', error: detail || 'Assertion failed' });
  }
}

function assertThrows(testName: string, fn: () => void) {
  try {
    fn();
    results.push({ test: testName, status: 'FAIL', error: 'Expected function to throw, but it succeeded' });
  } catch (err: any) {
    results.push({ test: testName, status: 'PASS', data: err?.message });
  }
}

function assertPasses(testName: string, fn: () => any) {
  try {
    const res = fn();
    results.push({ test: testName, status: 'PASS', data: JSON.stringify(res) });
    return res;
  } catch (err: any) {
    results.push({ test: testName, status: 'FAIL', error: err?.message });
  }
}

console.log('=== RUNNING SCHEMAS ADVERSARIAL TESTS ===');

// 1. AuditLog Schema
assertThrows('auditLogSchema: missing required action throws', () => {
  auditLogSchema.parse({ modulo: 'Geral' });
});

assertThrows('auditLogSchema: empty action throws', () => {
  auditLogSchema.parse({ action: '' });
});

assertPasses('auditLogSchema: default fallbacks apply', () => {
  return auditLogSchema.parse({ action: 'LOGIN' });
});

// 2. Cliente Schema
assertThrows('clienteSchema: missing required fields (codigo, razaoSocial, etc)', () => {
  clienteSchema.parse({});
});

assertThrows('clienteSchema: invalid enum tipo', () => {
  clienteSchema.parse({
    codigo: 'CLI-001',
    tipo: 'InvalidoTipo',
    razaoSocial: 'Empresa X',
    nomeFantasia: 'X',
    documento: '123',
    endereco: {},
  });
});

assertThrows('clienteSchema: invalid enum status', () => {
  clienteSchema.parse({
    codigo: 'CLI-001',
    tipo: 'Pessoa Jurídica',
    razaoSocial: 'Empresa X',
    nomeFantasia: 'X',
    documento: '123',
    status: 'BLOQUEADO',
    endereco: {},
  });
});

assertThrows('clienteSchema: missing required endereco object', () => {
  clienteSchema.parse({
    codigo: 'CLI-001',
    tipo: 'Pessoa Jurídica',
    razaoSocial: 'Empresa X',
    nomeFantasia: 'X',
    documento: '123',
  });
});

// Testing the weird email validation pattern: z.string().email().or(z.string().default(''))
const validClienteWithInvalidEmail = clienteSchema.safeParse({
  codigo: 'CLI-001',
  tipo: 'Pessoa Jurídica',
  razaoSocial: 'Empresa X',
  nomeFantasia: 'X',
  documento: '123',
  endereco: {},
  contatos: [
    {
      nome: 'João',
      email: 'not-an-email-at-all',
    },
  ],
});
assert(
  'clienteSchema: contato invalid email accepted due to z.string().default("") fallback flaw',
  validClienteWithInvalidEmail.success === true,
  'Flaw confirmed: "not-an-email-at-all" passed validation because z.string().default("") accepts invalid emails'
);

// 3. Cobranca Schema
assertThrows('cobrancaSchema: invalid status enum', () => {
  cobrancaSchema.parse({ status: 'INVALID_STATUS' });
});

assertPasses('cobrancaSchema: defaults apply', () => {
  return cobrancaSchema.parse({});
});

// 4. Colaborador Schema
assertThrows('colaboradorSchema: missing nomeCompleto', () => {
  colaboradorSchema.parse({});
});

assertThrows('colaboradorSchema: invalid status enum', () => {
  colaboradorSchema.parse({ nomeCompleto: 'João', status: 'PENDENTE' });
});

const validColabWithInvalidEmail = colaboradorSchema.safeParse({
  nomeCompleto: 'Maria Silva',
  email: 'invalid-email-address',
});
assert(
  'colaboradorSchema: invalid email accepted due to z.string().default("") fallback flaw',
  validColabWithInvalidEmail.success === true,
  'Flaw confirmed: invalid-email-address passed validation'
);

// 5. ContaPagar Schema
assertThrows('contaPagarSchema: missing descricao', () => {
  contaPagarSchema.parse({ valorOriginal: 100, dataVencimento: '2026-08-01' });
});

assertThrows('contaPagarSchema: missing dataVencimento', () => {
  contaPagarSchema.parse({ descricao: 'Conta luz', valorOriginal: 100 });
});

assertThrows('contaPagarSchema: negative valorOriginal', () => {
  contaPagarSchema.parse({ descricao: 'Conta luz', valorOriginal: -50, dataVencimento: '2026-08-01' });
});

assertThrows('contaPagarSchema: invalid status enum', () => {
  contaPagarSchema.parse({ descricao: 'Conta', valorOriginal: 100, dataVencimento: '2026-08-01', status: 'INVALID' });
});

// 6. ContaReceber Schema
assertThrows('contaReceberSchema: missing descricao', () => {
  contaReceberSchema.parse({ valorOriginal: 500, dataVencimento: '2026-08-01' });
});

assertThrows('contaReceberSchema: negative valorOriginal', () => {
  contaReceberSchema.parse({ descricao: 'Venda', valorOriginal: -10, dataVencimento: '2026-08-01' });
});

assertThrows('contaReceberSchema: invalid status enum', () => {
  contaReceberSchema.parse({ descricao: 'Venda', valorOriginal: 10, dataVencimento: '2026-08-01', status: 'PAGO' });
});

// 7. Contrato Schema
assertThrows('contratoSchema: missing numeroContrato', () => {
  contratoSchema.parse({ objetoContrato: 'Serviço', valorTotal: 1000, dataInicio: '2026-01-01' });
});

assertThrows('contratoSchema: missing dataInicio', () => {
  contratoSchema.parse({ numeroContrato: 'CTR-1', objetoContrato: 'Serviço', valorTotal: 1000 });
});

assertThrows('contratoSchema: negative valorTotal', () => {
  contratoSchema.parse({ numeroContrato: 'CTR-1', objetoContrato: 'Serviço', valorTotal: -100, dataInicio: '2026-01-01' });
});

assertThrows('contratoSchema: invalid status enum', () => {
  contratoSchema.parse({ numeroContrato: 'CTR-1', objetoContrato: 'Serviço', valorTotal: 100, dataInicio: '2026-01-01', status: 'DESATIVADO' });
});

// 8. Fornecedor Schema
assertThrows('fornecedorSchema: missing razaoSocial', () => {
  fornecedorSchema.parse({ nomeFantasia: 'ABC', cnpj: '123' });
});

assertThrows('fornecedorSchema: missing cnpj', () => {
  fornecedorSchema.parse({ razaoSocial: 'ABC Ltda', nomeFantasia: 'ABC' });
});

assertThrows('fornecedorSchema: invalid status enum', () => {
  fornecedorSchema.parse({ razaoSocial: 'ABC Ltda', nomeFantasia: 'ABC', cnpj: '123', status: 'SUSPENSO' });
});

// 9. Projeto Schema
assertThrows('projetoSchema: missing codigo', () => {
  projetoSchema.parse({ nome: 'Projeto X' });
});

assertThrows('projetoSchema: progressoGlobal < 0', () => {
  projetoSchema.parse({ codigo: 'PRJ-1', nome: 'Proj X', progressoGlobal: -5 });
});

assertThrows('projetoSchema: progressoGlobal > 100', () => {
  projetoSchema.parse({ codigo: 'PRJ-1', nome: 'Proj X', progressoGlobal: 105 });
});

assertThrows('projetoSchema: invalid prioridade enum', () => {
  projetoSchema.parse({ codigo: 'PRJ-1', nome: 'Proj X', prioridade: 'URGENTE' });
});

assertThrows('projetoSchema: invalid status enum', () => {
  projetoSchema.parse({ codigo: 'PRJ-1', nome: 'Proj X', status: 'EM_ANDAMENTO' });
});

// 10. User Schema & ActiveUser Schema
assertThrows('userSchema: missing nome', () => {
  userSchema.parse({ email: 'user@test.com' });
});

assertThrows('userSchema: invalid email format', () => {
  userSchema.parse({ nome: 'User', email: 'invalid-email-format' });
});

assertThrows('userSchema: invalid status enum', () => {
  userSchema.parse({ nome: 'User', email: 'user@test.com', status: 'ACTIVE' });
});

assertThrows('activeUserSchema: missing required email', () => {
  activeUserSchema.parse({ id: 'u1', nome: 'User' });
});

console.log('\n=== TEST RESULTS SUMMARY ===');
let passed = 0;
let failed = 0;
for (const r of results) {
  if (r.status === 'PASS') {
    passed++;
    console.log(`[PASS] ${r.test}`);
  } else {
    failed++;
    console.log(`[FAIL] ${r.test} - Error: ${r.error}`);
  }
}
console.log(`\nTotal: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
