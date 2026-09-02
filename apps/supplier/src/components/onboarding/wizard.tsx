"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import type { DocumentType } from "@ecomstrait/db/types";
import { Button } from "@/components/ui";
import { Stepper, FieldInput } from "@/components/onboarding/fields";
import { DocumentsStep } from "@/components/onboarding/documents-step";
import {
  EMPTY_FORM,
  DOCUMENTS,
  STEP1_FIELDS,
  STEP2_FIELDS,
  STEP4_FIELDS,
  stepFields,
  type SupplierForm,
} from "@/lib/onboarding";
import { saveSupplier, submitOnboarding } from "@/lib/supplier-actions";
import { websiteUrl } from "@/lib/site-url";

export function OnboardingWizard({
  userId,
  initialForm,
  initialStep,
  initialSupplierId,
  initialUploaded,
}: {
  userId: string;
  initialForm: SupplierForm;
  initialStep: number;
  initialSupplierId: string | null;
  initialUploaded: Record<string, string>;
}) {
  const router = useRouter();
  const [step, setStep] = useState(Math.min(Math.max(initialStep, 1), 5));
  const [form, setForm] = useState<SupplierForm>({ ...EMPTY_FORM, ...initialForm });
  const [supplierId, setSupplierId] = useState<string | null>(initialSupplierId);
  const [uploaded, setUploaded] = useState<Record<string, string>>(initialUploaded);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof SupplierForm>(k: K, v: SupplierForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function missingFields(): boolean {
    return stepFields(step).some((def) => {
      const v = form[def.name];
      if (!def.required) return false;
      return Array.isArray(v) ? v.length === 0 : !String(v).trim();
    });
  }

  function missingDocs(): boolean {
    return DOCUMENTS.some((d) => d.required && !uploaded[d.type]);
  }

  async function next() {
    setError(null);
    if ((step === 1 || step === 2 || step === 4) && missingFields()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (step === 3 && missingDocs()) {
      setError("Please upload the required documents.");
      return;
    }
    setSaving(true);
    const res = await saveSupplier({ ...form, onboarding_step: step + 1 });
    setSaving(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setSupplierId(res.id);
    setStep((s) => Math.min(s + 1, 5));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  }

  async function submit() {
    if (!termsAccepted) {
      setError("Please accept the terms to continue.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await submitOnboarding({ marketingOptIn });
    // On success the action redirects; only errors return here.
    if (res && "error" in res) {
      setError(res.error);
      setSaving(false);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <Stepper current={step} />
      </div>

      <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
        {step === 1 && (
          <Section title="Business information" desc="Tell us who you are.">
            <div className="grid gap-4 sm:grid-cols-2">
              {STEP1_FIELDS.map((def) => (
                <FieldInput key={def.name} def={def} form={form} set={set} />
              ))}
            </div>
          </Section>
        )}

        {step === 2 && (
          <Section title="Business details" desc="A bit about your operation.">
            <div className="grid gap-4 sm:grid-cols-2">
              {STEP2_FIELDS.map((def) => (
                <FieldInput key={def.name} def={def} form={form} set={set} />
              ))}
            </div>
          </Section>
        )}

        {step === 3 && (
          <Section title="Verification documents" desc="Upload proof to get verified.">
            <DocumentsStep
              userId={userId}
              supplierId={supplierId}
              uploaded={uploaded}
              onUploaded={(type: DocumentType, path) =>
                setUploaded((u) => ({ ...u, [type]: path }))
              }
            />
          </Section>
        )}

        {step === 4 && (
          <Section title="Product information" desc="How you fulfil orders.">
            <div className="grid gap-4 sm:grid-cols-2">
              {STEP4_FIELDS.map((def) => (
                <FieldInput key={def.name} def={def} form={form} set={set} />
              ))}
            </div>
          </Section>
        )}

        {step === 5 && (
          <Section title="Review & submit" desc="Confirm and send for verification.">
            <dl className="grid gap-3 rounded-xl border border-ink-100 bg-ink-50/50 p-4 text-sm sm:grid-cols-2">
              <Row label="Business" value={form.business_name} />
              <Row label="Type" value={form.business_type} />
              <Row label="Location" value={[form.city, form.country].filter(Boolean).join(", ")} />
              <Row label="Categories" value={form.product_categories.join(", ")} />
              <Row label="Documents" value={`${Object.keys(uploaded).length} uploaded`} />
              <Row label="Shipping" value={form.shipping_regions.join(", ")} />
            </dl>

            <div className="mt-5 flex flex-col gap-3">
              <label className="flex items-start gap-3 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-500"
                />
                <span>
                  I accept the{" "}
                  <a
                    href={`${websiteUrl()}/terms`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-brand-600 underline hover:text-brand-700"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href={`${websiteUrl()}/privacy`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-brand-600 underline hover:text-brand-700"
                  >
                    Privacy Policy
                  </a>
                  , and confirm the information above is accurate.
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={(e) => setMarketingOptIn(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-500"
                />
                <span>Send me product updates and supplier tips (optional).</span>
              </label>
            </div>
          </Section>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {/* Nav */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={back}
            disabled={step === 1 || saving}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-800 disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <div className="w-40">
            {step < 5 ? (
              <Button type="button" onClick={next} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
              </Button>
            ) : (
              <Button type="button" onClick={submit} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit for review"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-lg font-bold text-ink-950">{title}</h2>
      <p className="mb-5 mt-0.5 text-sm text-ink-500">{desc}</p>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-ink-400">{label}</dt>
      <dd className="font-medium text-ink-900">{value || "—"}</dd>
    </div>
  );
}
