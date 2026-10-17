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

/** Mesmas regras que o "servidor" aplica (ver `mocks/handlers/auth.ts`). */
export const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;
export const MIN_PASSWORD_LENGTH = 6;

/**
 * Regras do CADASTRO.
 *
 * Além dos campos do login, o cadastro pede a CONFIRMAÇÃO da senha. Fazemos a
 * checagem aqui (na tela) com `.refine`, porque é um erro de digitação do
 * usuário, não uma regra de negócio do servidor — vale avisar na hora, sem ida
 * à rede. O `path` aponta para o campo "confirmar", que é onde a pessoa precisa
 * corrigir.
 */
export const registerSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(1, 'Informe um nome de usuário.')
      .regex(USERNAME_PATTERN, 'Use de 3 a 20 caracteres (letras, números e _).'),
    email: z
      .string()
      .trim()
      .min(1, 'Informe seu e-mail.')
      .pipe(z.email('Informe um e-mail válido.')),
    password: z
      .string()
      .min(1, 'Informe uma senha.')
      .min(MIN_PASSWORD_LENGTH, `Use ao menos ${MIN_PASSWORD_LENGTH} caracteres.`),
    passwordConfirmation: z.string().min(1, 'Confirme a senha.'),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'As senhas não conferem.',
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
