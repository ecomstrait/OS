import { Marquee } from "@/components/ui/marquee";
import { trustedLogos } from "@/content/testimonials";

export function TrustedBy() {
  return (
    <section className="border-y border-ink-100 bg-white py-10">
      <div className="container-px">
        <p className="mb-8 text-center text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
          Built on and trusted by the tools you already know
        </p>
        <Marquee>
          {trustedLogos.map((logo) => (
            <span
              key={logo}
              className="mx-8 whitespace-nowrap text-2xl font-bold tracking-tight text-ink-300 transition-colors hover:text-ink-600 sm:mx-12"
            >
              {logo}
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
