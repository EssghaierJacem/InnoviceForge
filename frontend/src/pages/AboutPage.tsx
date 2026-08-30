import { Link } from 'react-router-dom'

export function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20 sm:py-24">
      <p className="text-xs font-semibold tracking-widest text-primary uppercase">About</p>
      <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
        Why this exists
      </h1>

      <div className="mt-8 flex flex-col gap-6 text-text-secondary">
        <p>
          InvoiceForge started as a way to actually build an event-driven microservices system, not just
          read about one. The pieces are ordinary on their own — a Spring Boot gateway, an ingestion
          service, an analytics service, a Python extraction pipeline, RabbitMQ in the middle — but wiring
          them together correctly, with a real outbox pattern, idempotent consumers, and a retry ladder
          that actually escalates instead of looping forever, is where the interesting problems live.
        </p>
        <p>
          Every account is tenant-scoped end to end: Keycloak issues the token, every service validates it
          independently rather than trusting the gateway alone, and the tenant claim rides inside the
          signed JWT rather than a spoofable header. The extraction itself is a real vision-capable LLM
          call, not a canned demo response — which means it also has real failure modes, which is why every
          result carries a confidence score instead of a blanket accuracy claim.
        </p>
        <p>
          It's not a company. There's no support team, no SLA, no funding behind it — it's a portfolio
          project built to be genuinely used and stress-tested, not just screenshotted. The pricing tiers
          you see elsewhere on this site describe what a real product's tiering might look like; they
          aren't a live commercial offer.
        </p>
      </div>

      <Link to="/" className="mt-10 inline-block text-sm font-medium text-primary hover:underline">
        ← Back home
      </Link>
    </div>
  )
}
