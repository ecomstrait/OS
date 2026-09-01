"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, ImagePlus, Loader2, Trash2, X, ExternalLink } from "lucide-react";
import { cn } from "@ecomstrait/ui";
import { MediaPicker } from "@/components/builder/media-picker";
import { updatePost, setPostStatus, deletePost, type Post } from "@/lib/blog-actions";

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

/** Edit one post — title/slug/excerpt/body/cover/SEO, plus publish state and delete. */
export function PostEditor({
  storeId,
  storeLiveUrl,
  post,
}: {
  storeId: string;
  storeLiveUrl: string | null;
  post: Post;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [excerpt, setExcerpt] = useState(post.excerpt ?? "");
  const [body, setBody] = useState(post.body);
  const [coverImage, setCoverImage] = useState<string | null>(post.coverImage);
  const [seoTitle, setSeoTitle] = useState(post.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(post.seoDescription ?? "");
  const [status, setStatus] = useState(post.status);
  const [picking, setPicking] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState(false);
  const [saving, startSaving] = useTransition();
  const [publishing, startPublishing] = useTransition();
  const [deleting, startDeleting] = useTransition();

  function save() {
    setError(null);
    setSavedAt(false);
    startSaving(async () => {
      const res = await updatePost(storeId, post.id, { title, slug, excerpt, body, coverImage, seoTitle, seoDescription });
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.post) {
        setSlug(res.post.slug);
        setSavedAt(true);
      }
    });
  }

  function toggleStatus() {
    setError(null);
    const next = status === "published" ? "draft" : "published";
    startPublishing(async () => {
      const res = await setPostStatus(storeId, post.id, next);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.post) setStatus(res.post.status);
    });
  }

  function remove() {
    if (!confirm(`Delete "${title}"? This can't be undone.`)) return;
    startDeleting(async () => {
      const res = await deletePost(storeId, post.id);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.push(`/stores/${storeId}/blog`);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/stores/${storeId}/blog`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Blog
        </Link>
        <div className="flex items-center gap-2">
          {status === "published" && storeLiveUrl && (
            <a
              href={`${storeLiveUrl}/blog/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-ink-200 px-3 text-sm font-semibold text-ink-700 hover:bg-ink-50"
            >
              View live <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            onClick={toggleStatus}
            disabled={publishing}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold",
              status === "published" ? "border border-ink-200 text-ink-700 hover:bg-ink-50" : "bg-brand-500 text-white hover:bg-brand-600",
            )}
          >
            {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : status === "published" ? "Unpublish" : "Publish"}
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-ink-950 px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : savedAt ? <><Check className="h-4 w-4" /> Saved</> : "Save"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-4 rounded-2xl border border-ink-100 bg-white p-5">
        <Field label="Title" value={title} onChange={setTitle} />
        <Field label="URL slug" value={slug} onChange={setSlug} placeholder="how-to-pick-the-right-size" />
        <Field label="Excerpt" value={excerpt} onChange={setExcerpt} rows={2} placeholder="One sentence, shown in the blog list." />

        <div>
          <span className="mb-1 block text-xs font-semibold text-ink-600">Cover image</span>
          {coverImage ? (
            <div className="relative inline-block overflow-hidden rounded-xl border border-ink-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverImage} alt="" className="h-28 w-48 object-cover" />
              <button
                type="button"
                onClick={() => setCoverImage(null)}
                aria-label="Remove cover image"
                className="absolute right-1 top-1 rounded-lg bg-white/90 p-1 text-ink-600 shadow-sm hover:text-red-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPicking(true)}
              className="inline-flex h-28 w-48 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-ink-300 text-xs text-ink-500 hover:border-brand-400 hover:text-brand-600"
            >
              <ImagePlus className="h-4 w-4" />
              Choose
            </button>
          )}
        </div>

        <Field label="Body" value={body} onChange={setBody} rows={16} placeholder="Blank line between paragraphs." />
      </div>

      <div className="space-y-4 rounded-2xl border border-ink-100 bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-ink-400">SEO</p>
        <Field label="SEO title" value={seoTitle} onChange={setSeoTitle} placeholder={title} />
        <Field label="SEO description" value={seoDescription} onChange={setSeoDescription} rows={2} placeholder={excerpt} />
      </div>

      <button
        onClick={remove}
        disabled={deleting}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-ink-200 px-3 text-sm font-semibold text-ink-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
      >
        {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        Delete post
      </button>

      <MediaPicker
        storeId={storeId}
        kind="image"
        open={picking}
        onClose={() => setPicking(false)}
        onPick={(media) => setCoverImage(media.url)}
      />
    </div>
  );
}
