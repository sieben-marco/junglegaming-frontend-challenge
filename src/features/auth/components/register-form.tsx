import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getApiError } from '@/lib/api-error';
import { toFieldErrors } from '@/lib/form-errors';
import { registerSchema } from '../schemas';
import { useRegister } from '../queries';

/**
 * Formulário de CADASTRO.
 *
 * Além do que o login já explicava (validação no envio, `noValidate`,
 * `aria-invalid`/`aria-describedby`, erro do servidor em `role="alert"`), aqui
 * há dois detalhes que valem atenção:
 *
 *  1. CONFIRMAÇÃO DE SENHA: é erro de digitação, então validamos na tela
 *     (`.refine` no `registerSchema`) — sem ida à rede.
 *  2. CONFLITO DO SERVIDOR (409): o "servidor" devolve `details` dizendo QUAL
 *     campo conflitou (e-mail ou nome de usuário). Em vez de mostrar um erro
 *     genérico no topo, destacamos o campo — que é onde a pessoa corrige.
 */

const USERNAME_FIELD_ID = 'register-username';
const EMAIL_FIELD_ID = 'register-email';
const PASSWORD_FIELD_ID = 'register-password';
const CONFIRMATION_FIELD_ID = 'register-password-confirmation';

interface RegisterFormProps {
  /** Chamado depois de o cadastro dar certo (a página decide para onde ir). */
  onAuthenticated: () => void;
}

export function RegisterForm({ onAuthenticated }: RegisterFormProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const registration = useRegister();

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setFormMessage(null);

    const parsed = registerSchema.safeParse({
      username,
      email,
      password,
      passwordConfirmation,
    });
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error.issues));
      return;
    }
    setErrors({});

    registration.mutate(
      // `passwordConfirmation` é regra de tela: não vai para a API.
      {
        username: parsed.data.username,
        email: parsed.data.email,
        password: parsed.data.password,
      },
      {
        onSuccess: () => onAuthenticated(),
        onError: (error) => {
          const apiError = getApiError(error);
          if (apiError.details) {
            setErrors(apiError.details);
            setFormMessage(apiError.message);
            return;
          }
          setFormMessage(apiError.message);
        },
      },
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Input
          id={USERNAME_FIELD_ID}
          name="username"
          autoComplete="username"
          placeholder="Nome de usuário"
          aria-label="Nome de usuário"
          aria-invalid={errors.username ? true : undefined}
          aria-describedby={errors.username ? `${USERNAME_FIELD_ID}-error` : undefined}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          disabled={registration.isPending}
          className="h-11 bg-background/40"
        />
        {errors.username ? (
          <p id={`${USERNAME_FIELD_ID}-error`} className="text-xs text-destructive">
            {errors.username}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Input
          id={EMAIL_FIELD_ID}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Digite seu e-mail"
          aria-label="E-mail"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? `${EMAIL_FIELD_ID}-error` : undefined}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={registration.isPending}
          className="h-11 bg-background/40"
        />
        {errors.email ? (
          <p id={`${EMAIL_FIELD_ID}-error`} className="text-xs text-destructive">
            {errors.email}
          </p>
        ) : null}
      </div>

      <PasswordField
        id={PASSWORD_FIELD_ID}
        label="Senha"
        placeholder="Senha"
        autoComplete="new-password"
        value={password}
        onChange={setPassword}
        error={errors.password}
        show={showPassword}
        onToggleShow={() => setShowPassword((current) => !current)}
        disabled={registration.isPending}
      />

      <PasswordField
        id={CONFIRMATION_FIELD_ID}
        label="Confirmar senha"
        placeholder="Confirmar senha"
        autoComplete="new-password"
        value={passwordConfirmation}
        onChange={setPasswordConfirmation}
        error={errors.passwordConfirmation}
        show={showConfirmation}
        onToggleShow={() => setShowConfirmation((current) => !current)}
        disabled={registration.isPending}
      />

      {formMessage ? (
        <p role="alert" className="text-sm text-destructive">
          {formMessage}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={registration.isPending}>
        {registration.isPending ? (
          <>
            <LoaderCircle aria-hidden className="animate-spin" />
            Criando conta…
          </>
        ) : (
          'Criar conta'
        )}
      </Button>
    </form>
  );
}

interface PasswordFieldProps {
  id: string;
  label: string;
  placeholder: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  show: boolean;
  onToggleShow: () => void;
  disabled: boolean;
}

/** Campo de senha com o botão do "olho" (o Figma mostra um em cada senha). */
function PasswordField({
  id,
  label,
  placeholder,
  autoComplete,
  value,
  onChange,
  error,
  show,
  onToggleShow,
  disabled,
}: PasswordFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Input
          id={id}
          name={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-label={label}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="h-11 bg-background/40 pr-10"
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={show ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          aria-pressed={show}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {show ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
        </button>
      </div>
      {error ? (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
