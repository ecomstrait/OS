"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { MediaPicker } from "@/components/builder/media-picker";
import type { PlanMedia, PlanSection, StorePlan } from "@/lib/ecomai";

/**
 * Direct editing of a store's content, alongside the AI builder rather than
 * instead of it: EcomAI writes the first draft, this is how a merchant changes
 * a headline or swaps a hero image without having to describe it in a sentence.
 *
 * Everything here edits a local copy and hands the whole plan back on save, so
 * a half-finished edit never reaches the live storefront.
 */

const SECTION_LABELS: Record<PlanSection["type"], string> = {
  text: "Text block",
  image: "Image",
  video: "Video",
  gallery: "Gallery",
  features: "Feature list",
};

/** Section types that use the `media` array, and how many entries make sense. */
const MEDIA_LIMIT: Partial<Record<PlanSection["type"], number>> = {
  image: 1,
  video: 1,
  gallery: 8,
};

/** More than one hero image/video becomes a carousel — this caps how many. */
const HERO_MEDIA_LIMIT = 6;

function Field({
  label,
  value,
  onChange,
  placeholder,
  rows,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-ink-600">{label}</span>
      {rows ? (
        <textarea
          value={value}
          rows={rows}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
        />
      ) : (
        <input
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-full rounded-lg border border-ink-200 px-3 text-sm outline-none focus:border-brand-400"
        />
      )}
    </label>
  );
}

function MediaSlot({
  label,
  media,
  onPick,
  onClear,
}: {
  label: string;
  media: PlanMedia | null;
  onPick: () => void;
  onClear: () => void;
}) {
  return (
    <div>
      <span className="mb-1 block text-xs font-semibold text-ink-600">{label}</span>
      {media ? (
        <div className="relative inline-block overflow-hidden rounded-xl border border-ink-200">
          {media.kind === "video" ? (
            <video src={media.url} className="h-24 w-40 object-cover" muted />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media.url} alt={media.alt ?? ""} className="h-24 w-40 object-cover" />
          )}
          <button
            type="button"
            onClick={onClear}
            aria-label={`Remove ${label}`}
            className="absolute right-1 top-1 rounded-lg bg-white/90 p-1 text-ink-600 shadow-sm hover:text-red-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onPick}
          className="inline-flex h-24 w-40 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-ink-300 text-xs text-ink-500 hover:border-brand-400 hover:text-brand-600"
        >
          <ImagePlus className="h-4 w-4" />
          Choose
        </button>
      )}
    </div>
  );
}

export function ContentEditor({
  storeId,
  plan,
  onChange,
}: {
  storeId: string;
  plan: StorePlan;
  onChange: (next: StorePlan) => void;
}) {
  /** Which slot the picker is filling. `null` means the picker is closed. */
  const [picking, setPicking] = useState<
    { slot: "hero" } | { slot: "about" } | { slot: "section"; index: number } | null
  >(null);

  const sections = plan.sections ?? [];

  function set<K extends keyof StorePlan>(key: K, value: StorePlan[K]) {
    onChange({ ...plan, [key]: value });
  }

  function setSections(next: PlanSection[]) {
    onChange({ ...plan, sections: next });
  }

  function updateSection(index: number, patch: Partial<PlanSection>) {
    setSections(sections.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addSection(type: PlanSection["type"]) {
    setSections([
      ...sections,
      {
        // Prefixed and counter-based rather than random, so the same plan
        // serialises identically twice — the save path diffs on JSON.
        id: `s${sections.length + 1}-${type}`,
        type,
        heading: "",
        ...(type === "features" ? { items: [{ title: "", description: "" }] } : {}),
      },
    ]);
  }

  function move(index: number, by: -1 | 1) {
    const target = index + by;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);
  }

  function pickedMedia(media: PlanMedia) {
    if (!picking) return;
    if (picking.slot === "hero") {
      set("heroMedia", [...(plan.heroMedia ?? []), media].slice(-HERO_MEDIA_LIMIT));
    } else if (picking.slot === "about") set("aboutMedia", media);
    else {
      const section = sections[picking.index];
      if (!section) return;
      const limit = MEDIA_LIMIT[section.type] ?? 1;
      const existing = section.media ?? [];
      updateSection(picking.index, { media: [...existing, media].slice(-limit) });
    }
  }

  const pickerKind =
    picking?.slot === "section" ? undefined : picking?.slot === "hero" ? undefined : "image";

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-ink-400">Header</h3>
        <Field
          label="Announcement bar"
          value={plan.announcement ?? ""}
          placeholder="Free shipping on orders over $50"
          onChange={(v) => set("announcement", v)}
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-ink-400">Hero</h3>
        <Field label="Headline" value={plan.heroHeadline} onChange={(v) => set("heroHeadline", v)} />
        <Field label="Subheading" value={plan.heroSub} rows={2} onChange={(v) => set("heroSub", v)} />
        <div>
          <span className="mb-1 block text-xs font-semibold text-ink-600">
            Background images or videos{" "}
            <span className="font-normal text-ink-400">
              (up to {HERO_MEDIA_LIMIT} — more than one becomes a carousel)
            </span>
          </span>
          <div className="flex flex-wrap gap-2">
            {(plan.heroMedia ?? []).map((m, mi) => (
              <div key={`${m.url}-${mi}`} className="relative overflow-hidden rounded-xl border border-ink-200">
                {m.kind === "video" ? (
                  <video src={m.url} className="h-24 w-40 object-cover" muted />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt={m.alt ?? ""} className="h-24 w-40 object-cover" />
                )}
                <button
                  type="button"
                  aria-label="Remove hero media"
                  onClick={() => set("heroMedia", (plan.heroMedia ?? []).filter((_, x) => x !== mi))}
                  className="absolute right-1 top-1 rounded-lg bg-white/90 p-1 text-ink-600 shadow-sm hover:text-red-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {(plan.heroMedia?.length ?? 0) < HERO_MEDIA_LIMIT && (
              <button
                type="button"
                onClick={() => setPicking({ slot: "hero" })}
                className="inline-flex h-24 w-40 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-ink-300 text-xs text-ink-500 hover:border-brand-400 hover:text-brand-600"
              >
                <ImagePlus className="h-4 w-4" />
                {(plan.heroMedia?.length ?? 0) === 0 ? "Choose" : "Add another"}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-ink-400">About</h3>
        <Field label="About text" value={plan.about} rows={4} onChange={(v) => set("about", v)} />
        <MediaSlot
          label="About image"
          media={plan.aboutMedia ?? null}
          onPick={() => setPicking({ slot: "about" })}
          onClear={() => set("aboutMedia", null)}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wide text-ink-400">Sections</h3>
          <div className="flex flex-wrap gap-1">
            {(Object.keys(SECTION_LABELS) as PlanSection["type"][]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => addSection(t)}
                className="inline-flex items-center gap-1 rounded-lg border border-ink-200 px-2 py-1 text-[11px] font-semibold text-ink-600 hover:bg-ink-50"
              >
                <Plus className="h-3 w-3" /> {SECTION_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {sections.length === 0 && (
          <p className="rounded-lg border border-dashed border-ink-200 px-3 py-6 text-center text-xs text-ink-500">
            No extra sections. Add one above — themes that don&apos;t support a type simply skip it.
          </p>
        )}

        {sections.map((section, i) => (
          <div key={section.id} className="rounded-xl border border-ink-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-ink-700">{SECTION_LABELS[section.type]}</span>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Move up"
                  className="rounded p-1 text-ink-500 hover:bg-ink-100 disabled:opacity-30"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === sections.length - 1}
                  aria-label="Move down"
                  className="rounded p-1 text-ink-500 hover:bg-ink-100 disabled:opacity-30"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSections(sections.filter((_, x) => x !== i))}
                  aria-label="Delete section"
                  className="rounded p-1 text-ink-500 hover:bg-ink-100 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Field
                label="Heading"
                value={section.heading ?? ""}
                onChange={(v) => updateSection(i, { heading: v })}
              />

              {(section.type === "text" || section.type === "image" || section.type === "video") && (
                <Field
                  label="Body"
                  rows={3}
                  value={section.body ?? ""}
                  onChange={(v) => updateSection(i, { body: v })}
                />
              )}

              {MEDIA_LIMIT[section.type] !== undefined && (
                <div>
                  <span className="mb-1 block text-xs font-semibold text-ink-600">
                    Media{" "}
                    {section.type === "gallery" && (
                      <span className="font-normal text-ink-400">
                        (up to {MEDIA_LIMIT.gallery})
                      </span>
                    )}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(section.media ?? []).map((m, mi) => (
                      <div
                        key={`${m.url}-${mi}`}
                        className="relative overflow-hidden rounded-lg border border-ink-200"
                      >
                        {m.kind === "video" ? (
                          <video src={m.url} className="h-16 w-24 object-cover" muted />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.url} alt={m.alt ?? ""} className="h-16 w-24 object-cover" />
                        )}
                        <button
                          type="button"
                          aria-label="Remove media"
                          onClick={() =>
                            updateSection(i, {
                              media: (section.media ?? []).filter((_, x) => x !== mi),
                            })
                          }
                          className="absolute right-0.5 top-0.5 rounded bg-white/90 p-0.5 text-ink-600 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {(section.media?.length ?? 0) < (MEDIA_LIMIT[section.type] ?? 1) && (
                      <button
                        type="button"
                        onClick={() => setPicking({ slot: "section", index: i })}
                        className="grid h-16 w-24 place-items-center rounded-lg border border-dashed border-ink-300 text-ink-400 hover:border-brand-400 hover:text-brand-600"
                      >
                        <ImagePlus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {section.type === "features" && (
                <div className="space-y-2">
                  {(section.items ?? []).map((item, ii) => (
                    <div key={ii} className="flex gap-2">
                      <input
                        value={item.title}
                        placeholder="Title"
                        onChange={(e) =>
                          updateSection(i, {
                            items: (section.items ?? []).map((x, y) =>
                              y === ii ? { ...x, title: e.target.value } : x,
                            ),
                          })
                        }
                        className="h-9 w-1/3 rounded-lg border border-ink-200 px-3 text-sm outline-none focus:border-brand-400"
                      />
                      <input
                        value={item.description}
                        placeholder="Description"
                        onChange={(e) =>
                          updateSection(i, {
                            items: (section.items ?? []).map((x, y) =>
                              y === ii ? { ...x, description: e.target.value } : x,
                            ),
                          })
                        }
                        className="h-9 flex-1 rounded-lg border border-ink-200 px-3 text-sm outline-none focus:border-brand-400"
                      />
                      <button
                        type="button"
                        aria-label="Remove item"
                        onClick={() =>
                          updateSection(i, {
                            items: (section.items ?? []).filter((_, y) => y !== ii),
                          })
                        }
                        className="rounded p-1.5 text-ink-500 hover:bg-ink-100 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      updateSection(i, {
                        items: [...(section.items ?? []), { title: "", description: "" }],
                      })
                    }
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
                  >
                    <Plus className="h-3 w-3" /> Add item
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wide text-ink-400">Footer</h3>
        <Field
          label="Footer text"
          value={plan.footerText ?? ""}
          placeholder={plan.tagline || "Powered by EcomStrait"}
          onChange={(v) => set("footerText", v)}
        />
      </section>

      <MediaPicker
        storeId={storeId}
        open={picking !== null}
        kind={pickerKind as "image" | "video" | undefined}
        onClose={() => setPicking(null)}
        onPick={pickedMedia}
      />
    </div>
  );
}
