import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { ProblemSolution } from "@/components/home/problem-solution";
import { CtaBanner } from "@/components/shared/cta-banner";

export const metadata: Metadata = {
  title: "The Problem",
  description:
    "Selling online means stitching together ten tools — website, hosting, SEO, marketing, suppliers, payments, analytics. EcomStrait replaces all of it with one AI co-founder.",
};

export default function ProblemPage() {
  return (
    <>
      <PageHeader
        eyebrow="The Problem"
        title="Ten tools, one headache — or one AI co-founder"
        description="Launching a store used to mean wiring together a dozen disconnected tools and bills. See what that really looks like — and how EcomAI collapses it into one."
      />
      <ProblemSolution />
      <CtaBanner />
    </>
  );
}
