import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="relative flex min-h-[70vh] items-center overflow-hidden bg-ink-950 text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-dark opacity-30" />
      <div className="container-px relative flex flex-col items-center gap-6 text-center">
        <p className="text-7xl font-extrabold text-gradient font-display sm:text-8xl">404</p>
        <h1 className="text-2xl font-bold sm:text-3xl">This page took an unexpected route</h1>
        <p className="max-w-md text-ink-300">
          The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you back on track.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href="/" variant="primary" size="lg">Back to Home</Button>
          <Button href="/contact" variant="outline-light" size="lg">Contact Us</Button>
        </div>
      </div>
    </section>
  );
}
