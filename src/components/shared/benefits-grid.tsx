import { Reveal } from "@/components/ui/reveal";
import { Icon, type IconName } from "@/components/ui/icon";

type Benefit = { icon: IconName; title: string; description: string };

export function BenefitsGrid({ items }: { items: Benefit[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((b, i) => (
        <Reveal key={b.title} delay={(i % 3) * 0.5}>
          <div className="flex h-full flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-6 transition hover:border-brand-200 hover:shadow-lg hover:shadow-ink-950/5">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Icon name={b.icon} className="h-5 w-5" />
            </span>
            <h3 className="text-base font-bold text-ink-950">{b.title}</h3>
            <p className="text-sm leading-relaxed text-ink-500">{b.description}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
