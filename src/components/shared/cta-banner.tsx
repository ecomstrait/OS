import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

type CtaBannerProps = {
  title?: string;
  description?: string;
};

export function CtaBanner({
  title = "Ready to build your business?",
  description = "Whether you're a supplier looking to reach more customers or an entrepreneur ready to launch your online store, EcomStrait gives you the tools, AI, and support to succeed.",
}: CtaBannerProps) {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="container-px">
        <Reveal className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-ink-950 px-6 py-16 text-center sm:px-16 sm:py-24">
          {/* Aurora glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full opacity-40 blur-3xl animate-aurora"
            style={{
              background:
                "radial-gradient(circle, rgba(16,185,129,0.5), rgba(59,130,246,0.35), transparent 70%)",
            }}
          />
          <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6">
            <h2 className="text-3xl font-bold text-white sm:text-5xl">{title}</h2>
            <p className="text-lg text-ink-200">{description}</p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <Button href="/store-owners" variant="primary" size="lg">
                Launch My Store <ArrowRight className="h-4 w-4" />
              </Button>
              <Button href="/suppliers" variant="outline-light" size="lg">
                Become a Supplier
              </Button>
            </div>
            <p className="text-sm text-ink-400">
              Prefer to talk first?{" "}
              <a href="/contact" className="font-medium text-brand-400 hover:underline">
                Book a live demo →
              </a>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
