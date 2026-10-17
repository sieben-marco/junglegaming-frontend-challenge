import { z } from 'zod';

/**
 * Regras dos formulários de conta (validação no CLIENTE).
 *
 * Isto é a primeira barreira: evita uma ida à rede só para descobrir que o
 * e-mail está vazio. O "servidor" (MSW) valida de novo — e é ele quem decide o
 * que vale (aqui é conveniência, não segurança).
 */
export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Informe seu e-mail.').pipe(z.email('Informe um e-mail válido.')),
  // No LOGIN não exigimos tamanho mínimo: a regra de força de senha é do
  // cadastro. Aqui basta preencher — quem decide se a senha serve é o servidor.
  password: z.string().min(1, 'Informe sua senha.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
