import { Link } from 'react-router-dom'

export function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20 sm:py-24">
      <p className="text-xs font-semibold tracking-widest text-primary uppercase">Privacy</p>
      <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
        Privacy policy
      </h1>
      <p className="mt-4 text-sm text-text-secondary">
        InvoiceForge is a portfolio and demonstration project, not a live commercial service. This page
        describes what the system actually does with your data today — it isn't a legal document backed
        by a company, a legal team, or a data processing agreement.
      </p>

      <div className="mt-10 flex flex-col gap-8">
        <Section title="What we collect">
          <p>
            The invoice file you upload (PDF, JPG, or PNG), the data our extraction pipeline pulls out of
            it (vendor, dates, amounts, line items, and similar fields), and — if you create an account —
            the email address Keycloak has on file for you.
          </p>
        </Section>

        <Section title="How long we keep it">
          <p>
            Honestly: indefinitely, for now. There is currently no automated retention or deletion policy
            for uploaded files or extracted data, anonymous or account-linked. This is a known gap in the
            system, not a deliberate choice — it just hasn't been built yet. Don't upload anything you
            wouldn't be comfortable having stored with no expiry date.
          </p>
        </Section>

        <Section title="Who can see it">
          <p>
            Each account's data is scoped to that account's tenant at the database level — one account
            never sees another account's invoices. Anonymous uploads (made without logging in) aren't tied
            to any account at all.
          </p>
        </Section>

        <Section title="Third parties">
          <p>
            The contents of an uploaded document are sent to Google's Gemini API to perform the actual
            extraction. That's the only third party your file's contents pass through.
          </p>
        </Section>

        <Section title="Questions">
          <p>
            Reach out via the <Link to="/contact" className="text-primary hover:underline">contact page</Link>{' '}
            if you have questions about any of this.
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
