import { Star, Quote } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { testimonials } from "@/content/testimonials";

export function Testimonials() {
  return (
    <Section tone="muted" id="stories">
      <SectionHeading
        eyebrow="Success Stories"
        title="Suppliers grow. Stores thrive."
        description="Entrepreneurs and suppliers building real businesses on EcomStrait."
      />
      <div className="mt-14 grid gap-5 md:grid-cols-2">
        {testimonials.map((t, i) => (
          <Reveal key={t.name} delay={(i % 2) * 0.5}>
            <figure className="flex h-full flex-col rounded-3xl border border-ink-100 bg-white p-7 shadow-sm">
              <div className="flex items-center justify-between">
                <Quote className="h-8 w-8 text-brand-200" />
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
              <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-ink-700">
                “{t.quote}”
              </blockquote>
              {t.metric && (
                <p className="mt-4 inline-flex w-fit rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                  {t.metric}
                </p>
              )}
              <figcaption className="mt-5 flex items-center gap-3 border-t border-ink-100 pt-5">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-ink-800 to-ink-950 text-sm font-bold text-white">
                  {t.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink-950">{t.name}</p>
                  <p className="text-xs text-ink-500">{t.role}, {t.company}</p>
                </div>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
