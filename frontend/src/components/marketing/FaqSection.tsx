import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { RevealSection } from '@/components/marketing/RevealSection'
import { SectionBand } from '@/components/marketing/SectionBand'

const FAQS = [
  {
    question: 'What file types are supported?',
    answer: 'PDF, JPG, and PNG. Both typed and scanned or photographed invoices work.',
  },
  {
    question: 'How accurate is the extraction?',
    answer:
      "We haven't published an accuracy figure — results vary by invoice quality and layout. Instead, every extraction gets a confidence score based on things like whether the vendor and date were found and whether the totals reconcile with the line items, so you can judge each result on its own rather than trusting a blanket number.",
  },
  {
    question: 'Do I need an account?',
    answer:
      'No — you can process invoices anonymously with a small daily limit. Creating a free account raises that limit and keeps a permanent, revisitable record of every upload.',
  },
  {
    question: 'What happens to low-confidence extractions?',
    answer:
      "If the confidence score falls below the threshold, the invoice is marked NEEDS_REVIEW instead of being accepted silently — you'll see a banner flagging it so you know to double-check the numbers before relying on them.",
  },
  {
    question: 'Is my data stored?',
    answer:
      "Yes. Uploaded files are stored so we can process them and show you the results — we don't currently have an automatic deletion policy for anonymous uploads.",
  },
  {
    question: "What's the difference between Free and Pro?",
    answer:
      'Free includes 5 invoices a day at no cost. Pro removes that daily limit and keeps a persistent history of everything you process, for $9/month.',
  },
] as const

export function FaqSection() {
  return (
    <SectionBand id="faq" tone="default" innerClassName="mx-auto max-w-4xl px-6 py-20 sm:py-24">
      <RevealSection>
        <p className="text-center text-xs font-semibold tracking-widest text-primary uppercase">FAQ</p>
        <h2 className="mt-3 text-center font-heading text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          Frequently asked questions
        </h2>
        <Accordion
          type="single"
          collapsible
          className="mt-12 grid grid-cols-1 gap-x-12 md:grid-flow-col md:grid-cols-2 md:grid-rows-3"
        >
          {FAQS.map((faq) => (
            <AccordionItem key={faq.question} value={faq.question} className="border-border">
              <AccordionTrigger className="text-base font-medium text-text-primary hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-text-secondary">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </RevealSection>
    </SectionBand>
  )
}
