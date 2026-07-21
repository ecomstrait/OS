/**
 * Founders Waitlist orchestration.
 *
 *   1. Persist the subscriber (idempotent — re-joining is a friendly no-op).
 *   2. For a NEW subscriber only: send the Day-0 welcome now and schedule the
 *      rest of the "30 Days to Your First Business" drip via Resend scheduledAt.
 *   3. Notify the team (best-effort).
 *
 * Every step degrades gracefully: a missing Supabase or Resend key never fails
 * the request, matching the leads/newsletter routes.
 */

import { getSupabase } from "@/lib/supabase";
import { sendEmail, sendNotification } from "@/lib/notify";
import { renderWaitlistEmail } from "@/lib/emails";
import { waitlistDrip } from "@/content/waitlist-emails";

export type WaitlistInput = {
  email: string;
  idea?: string;
  niche?: string;
  persona?: string;
  source?: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Send the Day-0 welcome immediately and schedule the follow-ups. */
async function runDrip(input: WaitlistInput): Promise<void> {
  const now = Date.now();
  await Promise.all(
    waitlistDrip.map((email) => {
      const html = renderWaitlistEmail(email, { niche: input.niche });
      const scheduledAt =
        email.delayDays > 0
          ? new Date(now + email.delayDays * DAY_MS).toISOString()
          : undefined;
      return sendEmail({ to: input.email, subject: email.subject, html, scheduledAt });
    }),
  );
}

export async function joinWaitlist(
  input: WaitlistInput,
): Promise<{ saved: boolean; isNew: boolean; emailed: boolean }> {
  const email = input.email.trim().toLowerCase();

  // 1) Persist. `.select()` after an ignore-duplicates upsert returns the row
  //    only when it was actually inserted → tells us whether this is new.
  let saved = false;
  let isNew = true;
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("waitlist_subscribers")
      .upsert(
        {
          email,
          idea: input.idea ?? null,
          niche: input.niche ?? null,
          persona: input.persona ?? null,
          source: input.source ?? null,
        },
        { onConflict: "email", ignoreDuplicates: true },
      )
      .select("id");
    if (error) console.error("[supabase] waitlist upsert error:", error.message);
    else {
      saved = true;
      isNew = Array.isArray(data) && data.length > 0;
    }
  }

  // 2) Drip only for genuinely new subscribers (avoid re-scheduling on re-join).
  //    If Supabase is unavailable we can't dedupe, so still welcome them once.
  let emailed = false;
  if (isNew) {
    try {
      await runDrip({ ...input, email });
      emailed = true;
    } catch (err) {
      console.error("[waitlist] drip failed:", err);
    }
  }

  // 3) Notify the team (best-effort, never blocks success).
  await sendNotification({
    subject: `New Founders Waitlist signup — ${email}`,
    heading: "New Founders Waitlist signup",
    data: {
      email,
      idea: input.idea ?? "—",
      niche: input.niche ?? "—",
      persona: input.persona ?? "—",
      source: input.source ?? "—",
      returning: isNew ? "no" : "yes",
    },
    replyTo: email,
  });

  return { saved, isNew, emailed };
}
