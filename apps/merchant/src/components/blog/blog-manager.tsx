"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Sparkles, Trash2, ExternalLink } from "lucide-react";
import { cn } from "@ecomstrait/ui";
import { createPost, generatePostDraft, deletePost, setPostStatus, type Post } from "@/lib/blog-actions";
import { UpgradeModal } from "@/components/billing/upgrade-modal";

const STATUS_STYLE: Record<Post["status"], string> = {
  draft: "bg-ink-100 text-ink-500",
  published: "bg-brand-50 text-brand-700",
};

/**
 * The blog authoring list — start a post two ways (blank, or hand AI a
 * topic), then manage what's there. Editing itself happens on its own page
 * (`/stores/[id]/blog/[postId]`) once a post exists.
 */
export function BlogManager({
  storeId,
  storeLiveUrl,
  initialPosts,
}: {
  storeId: string;
  storeLiveUrl: string | null;
  initialPosts: Post[];
}) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [upgradeMsg, setUpgradeMsg] = useState<string | null>(null);
  const [creating, startCreating] = useTransition();
  const [drafting, startDrafting] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  function createBlank() {
    if (!title.trim() || creating) return;
    setError(null);
    startCreating(async () => {
      const res = await createPost(storeId, title);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.post) router.push(`/stores/${storeId}/blog/${res.post.id}`);
    });
  }

  function draftWithAi() {
    if (!topic.trim() || drafting) return;
    setError(null);
    startDrafting(async () => {
      const res = await generatePostDraft(storeId, topic);
      if (res.error) {
        if (res.upgrade) setUpgradeMsg(res.error);
        else setError(res.error);
        return;
      }
      if (res.post) router.push(`/stores/${storeId}/blog/${res.post.id}`);
    });
  }

  async function toggleStatus(post: Post) {
    setBusyId(post.id);
    setError(null);
    const next = post.status === "published" ? "draft" : "published";
    const res = await setPostStatus(storeId, post.id, next);
    setBusyId(null);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.post) setPosts((list) => list.map((p) => (p.id === post.id ? res.post! : p)));
  }

  async function remove(post: Post) {
    if (!confirm(`Delete "${post.title}"? This can't be undone.`)) return;
    setBusyId(post.id);
    setError(null);
    const res = await deletePost(storeId, post.id);
    setBusyId(null);
    if (res.error) {
      setError(res.error);
      return;
    }
    setPosts((list) => list.filter((p) => p.id !== post.id));
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-ink-100 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-400">Write it yourself</p>
          <div className="mt-3 flex gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createBlank()}
              placeholder="Post title"
              className="h-9 flex-1 rounded-lg border border-ink-200 px-3 text-sm outline-none focus:border-brand-400"
            />
            <button
              onClick={createBlank}
              disabled={!title.trim() || creating}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-ink-950 px-3 text-sm font-semibold text-white disabled:opacity-40"
            >
              {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Create
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-ai-100 bg-ai-50/40 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-ai-700">Ask AI to draft one</p>
          <div className="mt-3 flex gap-2">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && draftWithAi()}
              placeholder="e.g. how to pick the right size"
              className="h-9 flex-1 rounded-lg border border-ink-200 bg-white px-3 text-sm outline-none focus:border-brand-400"
            />
            <button
              onClick={draftWithAi}
              disabled={!topic.trim() || drafting}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-br from-brand-500 to-ai-600 px-3 text-sm font-semibold text-white disabled:opacity-40"
            >
              {drafting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Draft
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center text-sm text-ink-500">
          No posts yet — start one above.
        </div>
      ) : (
        <div className="divide-y divide-ink-100 rounded-2xl border border-ink-100 bg-white">
          {posts.map((post) => (
            <div key={post.id} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <Link href={`/stores/${storeId}/blog/${post.id}`} className="font-medium text-ink-900 hover:underline">
                  {post.title}
                </Link>
                <p className="mt-0.5 text-xs text-ink-400">
                  {post.source === "ai" ? "AI-drafted" : "Written"} · updated{" "}
                  {new Date(post.updatedAt).toLocaleDateString()}
                </p>
              </div>
              {post.status === "published" && storeLiveUrl && (
                <a
                  href={`${storeLiveUrl}/blog/${post.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-ink-500 hover:text-ink-900"
                >
                  View <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_STYLE[post.status])}>
                {post.status}
              </span>
              <button
                onClick={() => toggleStatus(post)}
                disabled={busyId === post.id}
                className="inline-flex h-8 items-center rounded-lg border border-ink-200 px-3 text-xs font-semibold text-ink-700 hover:bg-ink-50 disabled:opacity-40"
              >
                {busyId === post.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : post.status === "published" ? "Unpublish" : "Publish"}
              </button>
              <button
                onClick={() => remove(post)}
                disabled={busyId === post.id}
                aria-label={`Delete ${post.title}`}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      {upgradeMsg && <UpgradeModal message={upgradeMsg} onClose={() => setUpgradeMsg(null)} />}
    </div>
  );
}
