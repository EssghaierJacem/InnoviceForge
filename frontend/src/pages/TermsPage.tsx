import { Link } from 'react-router-dom'

export function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20 sm:py-24">
      <p className="text-xs font-semibold tracking-widest text-primary uppercase">Terms</p>
      <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
        Terms of use
      </h1>
      <p className="mt-4 text-sm text-text-secondary">
        InvoiceForge is a portfolio and demonstration project. There's no company behind it, no signed
        agreement between you and anyone, and nothing here should be read as commercial legal boilerplate —
        it's a plain description of what using this site means.
      </p>

      <div className="mt-10 flex flex-col gap-8">
        <Section title="What this is">
          <p>
            A working system built to demonstrate event-driven microservices, multi-tenant auth, and
            LLM-based document extraction — not a commercial product with an SLA, uptime guarantee, or
            support contract.
          </p>
        </Section>

        <Section title="No warranty">
          <p>
            Everything here is provided as-is. Extraction accuracy is not guaranteed — that's the entire
            reason results carry a confidence score instead of a blanket claim. Don't rely on it for
            anything where a wrong number has real consequences.
          </p>
        </Section>

        <Section title="Acceptable use">
          <p>
            Don't upload sensitive or regulated documents you wouldn't want stored indefinitely — see the{' '}
            <Link to="/privacy" className="text-primary hover:underline">privacy page</Link> for why. Don't
            try to abuse the free-tier upload limits; they're there so the demo stays usable for everyone.
          </p>
        </Section>

        <Section title="Changes and availability">
          <p>
            This project can change, break, or go offline at any time without notice — it's maintained on
            a best-effort basis, not a production commitment.
          </p>
        </Section>
      </div>

      <Link to="/" className="mt-10 inline-block text-sm font-medium text-primary hover:underline">
        ← Back home
      </Link>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-heading text-lg font-semibold text-text-primary">{title}</h2>
      <div className="mt-2 text-sm text-text-secondary">{children}</div>
    </div>
  )
}
