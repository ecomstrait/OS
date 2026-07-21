import { PageHeader } from "@/components/shared/page-header";
import { Section } from "@/components/ui/section";

export type LegalSection = { heading: string; body: string[] };

export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <PageHeader eyebrow={`Last updated ${updated}`} title={title} description={intro} />
      <Section tone="light">
        <div className="mx-auto max-w-3xl">
          {sections.map((s) => (
            <div key={s.heading} className="mb-10">
              <h2 className="text-xl font-bold text-ink-950">{s.heading}</h2>
              {s.body.map((p, i) => (
                <p key={i} className="mt-3 text-[15px] leading-relaxed text-ink-600">
                  {p}
                </p>
              ))}
            </div>
          ))}
          <p className="rounded-2xl border border-ink-100 bg-ink-50 p-5 text-sm text-ink-500">
            This is placeholder legal content for the showcase site. Replace it with
            reviewed policy language before going live.
          </p>
        </div>
      </Section>
    </>
  );
}
