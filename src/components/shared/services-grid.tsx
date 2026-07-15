import { Reveal } from "@/components/ui/reveal";
import { Icon } from "@/components/ui/icon";
import { Check } from "lucide-react";
import { services } from "@/content/services";

export function ServicesGrid({
  limit,
  detailed = false,
}: {
  limit?: number;
  detailed?: boolean;
}) {
  const items = limit ? services.slice(0, limit) : services;

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((service, i) => (
        <Reveal key={service.title} delay={(i % 3) * 0.5}>
          <div className="group flex h-full flex-col rounded-2xl border border-ink-100 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-ink-950/5">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-500 group-hover:text-white">
              <Icon name={service.icon} className="h-6 w-6" />
            </span>
            <h3 className="mt-5 text-lg font-bold text-ink-950">{service.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">
              {service.description}
            </p>
            {detailed && (
              <ul className="mt-4 grid grid-cols-2 gap-1.5">
                {service.features.map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-xs text-ink-600">
                    <Check className="h-3 w-3 shrink-0 text-brand-500" strokeWidth={3} />
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Reveal>
      ))}
    </div>
  );
}
