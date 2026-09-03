"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, Loader2, X } from "lucide-react";
import { cn } from "@ecomstrait/ui";
import { createClient } from "@ecomstrait/auth/client";
import { TextField } from "@/components/ui";
import { updateProfile } from "@/lib/profile-actions";

const BUCKET = "avatars";

/** Avatar upload + editable display name, shown at the top of Settings. */
export function ProfileCard({
  userId,
  email,
  initialFullName,
  initialAvatarUrl,
}: {
  userId: string;
  email: string;
  initialFullName: string;
  initialAvatarUrl: string | null;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialFullName);
  const [saved, setSaved] = useState(initialFullName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = fullName.trim().length > 0 && fullName.trim() !== saved;
  const initial = (fullName || email)[0]?.toUpperCase() ?? "?";

  async function onFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "png";
      const path = `${userId}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      // cache-bust so a re-upload shows immediately, same as the store logo upload
      const busted = `${url}?v=${file.size}`;
      const res = await updateProfile({ avatarUrl: busted });
      if (res.error) throw new Error(res.error);
      setAvatarUrl(busted);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Photo upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto() {
    setUploading(true);
    setError(null);
    const res = await updateProfile({ avatarUrl: null });
    setUploading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setAvatarUrl(null);
    router.refresh();
  }

  async function saveName() {
    if (!dirty) return;
    setSavingName(true);
    setError(null);
    const trimmed = fullName.trim();
    const res = await updateProfile({ fullName: trimmed });
    setSavingName(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setFullName(trimmed);
    setSaved(trimmed);
    setJustSaved(true);
    router.refresh();
    setTimeout(() => setJustSaved(false), 1500);
  }

  return (
    <section className="rounded-2xl border border-ink-100 bg-white p-5">
      <h2 className="text-sm font-semibold text-ink-950">Profile</h2>
      <div className="mt-4 flex items-center gap-4">
        <div className="relative shrink-0">
          <label className="group relative block h-16 w-16 cursor-pointer overflow-hidden rounded-full bg-brand-500">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full w-full place-items-center text-xl font-bold text-white">{initial}</span>
            )}
            <span
              className={cn(
                "absolute inset-0 grid place-items-center bg-ink-950/50 opacity-0 transition group-hover:opacity-100",
                uploading && "opacity-100",
              )}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Camera className="h-4 w-4 text-white" />
              )}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
          </label>
          {avatarUrl && !uploading && (
            <button
              type="button"
              onClick={removePhoto}
              aria-label="Remove photo"
              className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-white text-ink-400 shadow ring-1 ring-ink-100 hover:text-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <TextField id="fullName" label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={saveName}
          disabled={!dirty || savingName}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-40"
        >
          {savingName ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : justSaved ? (
            <>
              <Check className="h-3.5 w-3.5" /> Saved
            </>
          ) : (
            "Save changes"
          )}
        </button>
      </div>
    </section>
  );
}
