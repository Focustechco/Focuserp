import { z } from 'zod';

console.log('--- EMPIRICAL ZOD PARSING EDGE CASE TEST ---\n');

// 1. Date Testing
console.log('1. Date Field Behavior:');
const stringDateSchema = z.object({
  dataVencimento: z.string().min(1, 'Data de vencimento é obrigatória'),
  dataFundacaoNascimento: z.string().optional(),
});

const malformedDate1 = stringDateSchema.safeParse({
  dataVencimento: 'invalid-date-string',
  dataFundacaoNascimento: '99/99/9999',
});
console.log('  Input: { dataVencimento: "invalid-date-string", dataFundacaoNascimento: "99/99/9999" }');
console.log('  Result success:', malformedDate1.success);
if (malformedDate1.success) {
  console.log('  Parsed output:', malformedDate1.data);
  console.log('  -> FINDING: Malformed date strings are ACCEPTED by z.string() without date format enforcement.\n');
}

// 2. Negative Currency Testing
console.log('2. Currency & Financial Field Behavior:');
const contaPagarPartialSchema = z.object({
  valorOriginal: z.number().min(0, 'Valor original deve ser positivo'),
  desconto: z.number().default(0),
  multa: z.number().default(0),
  juros: z.number().default(0),
});

const negativeTest1 = contaPagarPartialSchema.safeParse({
  valorOriginal: -100,
  desconto: -50,
  multa: -10,
  juros: -5,
});
console.log('  Input: { valorOriginal: -100, desconto: -50, multa: -10, juros: -5 }');
console.log('  Result success:', negativeTest1.success);
if (!negativeTest1.success) {
  console.log('  valorOriginal rejection reason:', negativeTest1.error.issues[0].message);
}

const negativeTest2 = contaPagarPartialSchema.safeParse({
  valorOriginal: 100,
  desconto: -50,
  multa: -10,
  juros: -5,
});
console.log('  Input: { valorOriginal: 100, desconto: -50, multa: -10, juros: -5 }');
console.log('  Result success:', negativeTest2.success);
if (negativeTest2.success) {
  console.log('  Parsed output:', negativeTest2.data);
  console.log('  -> FINDING: Negative values for desconto, multa, juros are ACCEPTED because .min(0) is missing.\n');
}

// 3. Blank / Invalid UUID Testing
console.log('3. UUID Field Behavior:');
const uuidSchema = z.object({
  id: z.string().optional(),
  tenantId: z.string().optional(),
  clienteId: z.string().optional(),
});

const uuidTest1 = uuidSchema.safeParse({
  id: '',
  tenantId: '   ',
  clienteId: 'not-a-uuid-12345',
});
console.log('  Input: { id: "", tenantId: "   ", clienteId: "not-a-uuid-12345" }');
console.log('  Result success:', uuidTest1.success);
if (uuidTest1.success) {
  console.log('  Parsed output:', uuidTest1.data);
  console.log('  -> FINDING: Blank strings, spaces, and non-UUID strings pass z.string().optional() without .uuid() check.\n');
}

console.log('--- END OF ZOD EDGE CASE TEST ---');
