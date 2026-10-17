import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getApiError } from '@/lib/api-error';
import { toFieldErrors } from '@/lib/form-errors';
import { loginSchema } from '../schemas';
import { useLogin } from '../queries';

/**
 * Formulário de login.
 *
 * Decisões que valem explicação:
 *  - VALIDAÇÃO NO ENVIO (e não a cada tecla): quem ainda está digitando não é
 *    interrompido com erro — o erro aparece quando a pessoa tenta entrar.
 *  - `noValidate`: desligamos a validação "bolha" do navegador para termos UMA
 *    fonte de verdade (o zod), com mensagens nossas e acessíveis (o balão nativo
 *    não é anunciado por leitores de tela de forma confiável).
 *  - cada campo com erro aponta para a sua mensagem por `aria-describedby` e
 *    recebe `aria-invalid` (o leitor de tela anuncia "inválido" + o motivo).
 *  - o erro do SERVIDOR (e-mail ou senha inválidos) não pertence a um campo: vai
 *    numa região `role="alert"`, que é anunciada assim que aparece.
 */

const EMAIL_FIELD_ID = 'login-email';
const PASSWORD_FIELD_ID = 'login-password';

interface LoginFormProps {
  /** Chamado depois de um login bem-sucedido (a página decide para onde ir). */
  onAuthenticated: () => void;
}

export function LoginForm({ onAuthenticated }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const login = useLogin();

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setFormMessage(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error.issues));
      return;
    }
    setErrors({});

    login.mutate(parsed.data, {
      onSuccess: () => onAuthenticated(),
      // 401 (credencial errada), 422, rede... todos caem aqui com a mensagem do
      // servidor — a tela não inventa o motivo.
      onError: (error) => setFormMessage(getApiError(error).message),
    });
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Input
          id={EMAIL_FIELD_ID}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="contato@email.com"
          aria-label="E-mail"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? `${EMAIL_FIELD_ID}-error` : undefined}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={login.isPending}
          className="h-11 bg-background/40"
        />
        {errors.email ? (
          <p id={`${EMAIL_FIELD_ID}-error`} className="text-xs text-destructive">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <div className="relative">
          <Input
            id={PASSWORD_FIELD_ID}
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="*********"
            aria-label="Senha"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? `${PASSWORD_FIELD_ID}-error` : undefined}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={login.isPending}
            className="h-11 bg-background/40 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={showPassword}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {showPassword ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
          </button>
        </div>
        {errors.password ? (
          <p id={`${PASSWORD_FIELD_ID}-error`} className="text-xs text-destructive">
            {errors.password}
          </p>
        ) : null}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() =>
            setFormMessage('A recuperação de senha não está disponível nesta demonstração.')
          }
          className="text-xs text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          Esqueceu a senha?
        </button>
      </div>

      {formMessage ? (
        <p role="alert" className="text-sm text-destructive">
          {formMessage}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={login.isPending}>
        {login.isPending ? (
          <>
            <LoaderCircle aria-hidden className="animate-spin" />
            Entrando…
          </>
        ) : (
          'Entrar'
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Demonstração: entre com <span className="text-foreground">ana@kurio.art</span> e a senha{' '}
        <span className="text-foreground">kurio123</span>.
      </p>
    </form>
  );
}
