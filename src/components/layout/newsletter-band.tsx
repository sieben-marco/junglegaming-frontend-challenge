import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const BENEFITS = [
  {
    letter: 'W',
    title: 'Segurança da carteira',
    text: 'Proteja sua carteira e coleção de arte digital verificada com confiança.',
  },
  {
    letter: 'C',
    title: 'Criadores em destaque',
    text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    letter: 'D',
    title: 'Alertas de lançamentos',
    text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
];

export function NewsletterBand() {
  return (
    <section aria-label="Benefícios e newsletter" className="mx-auto w-full max-w-[1200px] px-4 py-4 sm:px-6">
      <div className="grid gap-8 rounded-2xl bg-card p-8 lg:grid-cols-4">
        {BENEFITS.map((benefit) => (
          <article key={benefit.letter} className="flex flex-col gap-3">
            <span
              aria-hidden
              className="flex size-10 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground"
            >
              {benefit.letter}
            </span>
            <h3 className="font-semibold text-foreground">{benefit.title}</h3>
            <p className="text-sm text-muted-foreground">{benefit.text}</p>
          </article>
        ))}

        <div className="flex flex-col gap-3 lg:border-l lg:border-border lg:pl-8">
          <h3 className="font-semibold text-foreground">Antecipe-se ao próximo lançamento</h3>
          <form className="flex gap-2" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="newsletter-email" className="sr-only">
              Seu e-mail
            </label>
            <Input
              id="newsletter-email"
              type="email"
              placeholder="digite seu e-mail..."
              autoComplete="email"
            />
            <Button type="submit">Enviar</Button>
          </form>
          <p className="text-sm text-muted-foreground">
            Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
          </p>
        </div>
      </div>
    </section>
  );
}
