"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Trash2, Upload, X, ImageOff } from "lucide-react";
import { cn } from "@ecomstrait/ui";
import type { PlanMedia } from "@/lib/ecomai";

/**
 * The store's media library: upload, browse, pick.
 *
 * Uploads go through /api/media rather than straight to storage, because the
 * route is what enforces ownership, type and size, and records the asset so it
 * can be re-used and deleted later. A merchant who uploads a hero image once
 * shouldn't have to find the file again to use it in a section.
 */

export type Asset = {
  id: string;
  kind: "image" | "video";
  url: string;
  file_name: string | null;
  bytes: number | null;
  role: string | null;
  alt: string | null;
};

function humanSize(bytes: number | null): string {
  if (!bytes) return "";
  const mb = bytes / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(1)}MB` : `${Math.round(bytes / 1024)}KB`;
}

type PickerProps = {
  storeId: string;
  /** Restrict the library to one type when a slot only accepts that type. */
  kind?: "image" | "video";
  open: boolean;
  onClose: () => void;
  onPick: (media: PlanMedia) => void;
};

/**
 * Mounting on open is what keeps the fetch out of a state-setting effect, and
 * it also means the library is always fresh — media uploaded from another slot
 * shows up without a manual refresh.
 */
export function MediaPicker(props: PickerProps) {
  if (!props.open) return null;
  return <Library {...props} />;
}

function Library({ storeId, kind, onClose, onPick }: PickerProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/media?storeId=${encodeURIComponent(storeId)}`, {
          cache: "no-store",
        });
        const body = await res.json();
        if (!alive) return;
        if (!res.ok) throw new Error(body.error ?? "Couldn't load your media.");
        setAssets(body.assets ?? []);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Couldn't load your media.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [storeId]);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("storeId", storeId);
      form.append("file", file);
      form.append("kind", file.type.startsWith("video/") ? "video" : "image");

      const res = await fetch("/api/media", { method: "POST", body: form });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Upload failed.");
      setAssets((prev) => [body.asset, ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove(assetId: string) {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/media?assetId=${encodeURIComponent(assetId)}&storeId=${encodeURIComponent(storeId)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Couldn't delete that.");
      }
      setAssets((prev) => prev.filter((a) => a.id !== assetId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't delete that.");
    } finally {
      setBusy(false);
    }
  }

  const shown = kind ? assets.filter((a) => a.kind === kind) : assets;
  const accept = kind === "video" ? "video/*" : kind === "image" ? "image/*" : "image/*,video/*";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold text-ink-900">Media library</h2>
            <p className="text-xs text-ink-500">
              Images up to 8MB, video up to 64MB. Re-usable across every section.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 border-b border-ink-100 px-5 py-3">
          <input
            ref={fileRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-500 px-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload
          </button>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="grid place-items-center py-12 text-ink-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : shown.length === 0 ? (
            <div className="grid place-items-center gap-2 py-12 text-center">
              <ImageOff className="h-6 w-6 text-ink-300" />
              <p className="text-sm text-ink-500">Nothing here yet — upload your first file.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {shown.map((a) => (
                <div
                  key={a.id}
                  className="group relative overflow-hidden rounded-xl border border-ink-200"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onPick({ url: a.url, kind: a.kind, ...(a.alt ? { alt: a.alt } : {}) });
                      onClose();
                    }}
                    className="block w-full"
                  >
                    <div className="relative aspect-square bg-ink-50">
                      {a.kind === "video" ? (
                        <video src={a.url} className="absolute inset-0 h-full w-full object-cover" muted />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.url}
                          alt={a.alt ?? a.file_name ?? ""}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="px-2 py-1.5 text-left">
                      <p className="line-clamp-1 text-[11px] font-medium text-ink-700">
                        {a.file_name ?? a.kind}
                      </p>
                      <p className="text-[11px] text-ink-400">{humanSize(a.bytes)}</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(a.id)}
                    aria-label="Delete"
                    className={cn(
                      "absolute right-1.5 top-1.5 rounded-lg bg-white/90 p-1.5 text-ink-600 opacity-0 shadow-sm transition",
                      "hover:text-red-600 group-hover:opacity-100",
                    )}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
